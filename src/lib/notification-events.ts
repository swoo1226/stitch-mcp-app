import webpush from "web-push";
import { createSupabaseAdminClient } from "./supabase-admin";

export type NotificationType =
  | "low_mood_alert"
  | "mood_drop_alert"
  | "checkin_reminder"
  | "team_admin_access_request"
  | "member_access_request"
  | "combined_risk_alert";

export type NotificationPayload = {
  score?: number;
  userName?: string;
  reason?: string;
  prevScore?: number;
  message?: string;
  targetUserId?: string;
  requesterName?: string;
  requesterEmail?: string;
  organization?: string;
  teamName?: string;
  partName?: string;
  level?: "critical" | "warning";
  openTicketCount?: number;
  blockerCount?: number;
};

type NotificationRow = {
  id: string;
  recipient_auth_id: string;
  type: NotificationType;
  target_user_id: string | null;
  payload: NotificationPayload;
  created_at: string;
};

type PushSubscriptionRow = {
  id: string;
  auth_user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type EmitNotificationInput = {
  recipientAuthIds: string[];
  type: NotificationType;
  targetUserId?: string | null;
  payload?: NotificationPayload;
  skipIfExistsToday?: boolean;
};

function utcToKstDate(utcStr: string) {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}

function kstDayStart(iso: string) {
  return `${iso}T00:00:00+09:00`;
}

function buildTargetUrl(notification: NotificationRow) {
  if (notification.type === "checkin_reminder") {
    return "/input";
  }

  if (
    notification.type === "team_admin_access_request" ||
    notification.type === "member_access_request"
  ) {
    return "/admin";
  }

  if (notification.type === "combined_risk_alert") {
    const params = new URLSearchParams();
    if (notification.target_user_id) {
      params.set("user", notification.target_user_id);
    }
    return `/admin/combined-risk${params.size ? `?${params.toString()}` : ""}`;
  }

  if (notification.target_user_id) {
    return `/personal?user=${encodeURIComponent(notification.target_user_id)}`;
  }

  return "/alerts";
}

function buildPushMessage(notification: NotificationRow) {
  if (notification.type === "checkin_reminder") {
    return {
      title: "체크인 리마인더",
      summary: "오늘의 컨디션을 기록해 주세요.",
    };
  }

  if (
    notification.type === "team_admin_access_request" ||
    notification.type === "member_access_request"
  ) {
    return {
      title: "새 접근 요청",
      summary: "도입 요청이 도착했어요. 관리자 화면에서 확인해 주세요.",
    };
  }

  if (notification.type === "combined_risk_alert") {
    return {
      title: "주의 팀원 알림",
      summary: "오늘 확인이 필요한 팀 상태 변화가 감지됐어요.",
    };
  }

  return {
    title: "팀 상태 알림",
    summary: "확인이 필요한 팀 상태 변화가 감지됐어요.",
  };
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function deliverPushNotifications(admin: ReturnType<typeof createSupabaseAdminClient>, notifications: NotificationRow[]) {
  if (!notifications.length || !configureWebPush()) {
    return;
  }

  const recipientAuthIds = Array.from(new Set(notifications.map((notification) => notification.recipient_auth_id)));
  const { data: subscriptions, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("id, auth_user_id, endpoint, p256dh, auth")
    .in("auth_user_id", recipientAuthIds)
    .eq("is_active", true)
    .is("revoked_at", null);

  if (subscriptionError || !subscriptions?.length) {
    return;
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();
  for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const existing = subscriptionsByUser.get(subscription.auth_user_id) ?? [];
    existing.push(subscription);
    subscriptionsByUser.set(subscription.auth_user_id, existing);
  }

  for (const notification of notifications) {
    const targets = subscriptionsByUser.get(notification.recipient_auth_id) ?? [];
    for (const subscription of targets) {
      const payload = JSON.stringify({
        notificationId: notification.id,
        type: notification.type,
        targetUrl: buildTargetUrl(notification),
        ...buildPushMessage(notification),
      });

      const attemptedAt = new Date().toISOString();

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );

        await admin.from("notification_push_deliveries").upsert({
          notification_id: notification.id,
          subscription_id: subscription.id,
          status: "delivered",
          error_code: null,
          attempted_at: attemptedAt,
          delivered_at: new Date().toISOString(),
        });
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : null;
        const status = statusCode === 404 || statusCode === 410 ? "gone" : "failed";
        const errorCode = error instanceof Error ? error.message.slice(0, 300) : String(error);

        await admin.from("notification_push_deliveries").upsert({
          notification_id: notification.id,
          subscription_id: subscription.id,
          status,
          error_code: errorCode,
          attempted_at: attemptedAt,
          delivered_at: null,
        });

        if (status === "gone") {
          await admin
            .from("push_subscriptions")
            .update({
              is_active: false,
              revoked_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
        }
      }
    }
  }
}

export async function emitNotificationEvent(input: EmitNotificationInput) {
  const recipientAuthIds = Array.from(new Set(input.recipientAuthIds.filter(Boolean)));
  if (!recipientAuthIds.length) return { inserted: 0 };

  const admin = createSupabaseAdminClient();

  if (input.skipIfExistsToday) {
    const todayIso = utcToKstDate(new Date().toISOString());
    let existingQuery = admin
      .from("notifications")
      .select("id")
      .in("recipient_auth_id", recipientAuthIds)
      .eq("type", input.type)
      .gte("created_at", kstDayStart(todayIso))
      .limit(1);

    if (input.targetUserId) {
      existingQuery = existingQuery.eq("target_user_id", input.targetUserId);
    } else {
      existingQuery = existingQuery.is("target_user_id", null);
    }

    const { data: existing } = await existingQuery;
    if (existing?.length) {
      return { inserted: 0, skipped: true };
    }
  }

  const insertRows = recipientAuthIds.map((recipientAuthId) => ({
    recipient_auth_id: recipientAuthId,
    type: input.type,
    target_user_id: input.targetUserId ?? null,
    payload: input.payload ?? {},
  }));

  const { data, error } = await admin
    .from("notifications")
    .insert(insertRows)
    .select("id, recipient_auth_id, type, target_user_id, payload, created_at");

  if (error) {
    throw new Error(error.message);
  }

  await deliverPushNotifications(admin, (data ?? []) as NotificationRow[]);

  return { inserted: data?.length ?? 0, notifications: data ?? [] };
}

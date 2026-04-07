import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { emitNotificationEvent, type NotificationPayload, type NotificationType } from "../../../lib/notification-events";

// 알림 생성 조건
const LOW_SCORE_THRESHOLD = 40;
const SHARP_DROP_THRESHOLD = 20;
const RECENT_DAYS = 3;

function kstDayStart(iso: string) { return `${iso}T00:00:00+09:00`; }
function kstDayEnd(iso: string) { return `${iso}T23:59:59+09:00`; }
function utcToKstDate(utcStr: string) {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, score, message, token } = body as {
      userId?: string;
      score: number;
      message?: string;
      token?: string;
    };

    const admin = createSupabaseAdminClient();

    // userId 확정
    let resolvedUserId: string | null = userId ?? null;

    // token 기반이면 users 테이블에서 조회
    if (!resolvedUserId && token) {
      const { data: user } = await admin
        .from("users")
        .select("id")
        .eq("access_token", token)
        .single();
      if (!user) {
        return NextResponse.json({ error: "invalid_token" }, { status: 401 });
      }
      resolvedUserId = user.id;
    }

    // 로그인 세션 기반
    if (!resolvedUserId) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
      );
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: ur } = await admin
          .from("user_roles")
          .select("linked_user_id")
          .eq("auth_user_id", authUser.id)
          .single();
        resolvedUserId = ur?.linked_user_id ?? null;
      }
    }

    const loggedAt = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).replace(" ", "T") + "+09:00";

    // mood_logs insert
    const { error: insertError } = await admin
      .from("mood_logs")
      .insert({ user_id: resolvedUserId, score, message: message ?? null, logged_at: loggedAt });

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "already_checked_in", userId: resolvedUserId }, { status: 409 });
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 알림 생성 (resolvedUserId 있을 때만)
    if (resolvedUserId) {
      await createAlertsIfNeeded(admin, resolvedUserId, score);
    }

    return NextResponse.json({ ok: true, userId: resolvedUserId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

// 오늘 덮어쓰기 (기존 handleOverwrite)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, score, message } = body as { userId: string; score: number; message?: string };

    const admin = createSupabaseAdminClient();
    const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const todayIso = `${nowKst.getUTCFullYear()}-${String(nowKst.getUTCMonth() + 1).padStart(2, "0")}-${String(nowKst.getUTCDate()).padStart(2, "0")}`;

    const { error } = await admin
      .from("mood_logs")
      .update({ score, message: message ?? null })
      .eq("user_id", userId)
      .gte("logged_at", kstDayStart(todayIso))
      .lte("logged_at", kstDayEnd(todayIso));

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await createAlertsIfNeeded(admin, userId, score);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

// ── 알림 생성 로직 ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createAlertsIfNeeded(admin: any, userId: string, todayScore: number) {
  // team_admin의 auth_user_id 조회 (같은 팀)
  const { data: userRow } = await admin
    .from("users")
    .select("team_id, name")
    .eq("id", userId)
    .single();
  if (!userRow?.team_id) return;

  const { data: admins } = await admin
    .from("user_roles")
    .select("auth_user_id")
    .eq("managed_team_id", userRow.team_id)
    .eq("role", "team_admin");
  if (!admins?.length) return;

  const recipientIds: string[] = admins.map((a: { auth_user_id: string }) => a.auth_user_id);

  // 알림 타입 판단
  let type: NotificationType | null = null;
  const payload: NotificationPayload = { score: todayScore, userName: userRow.name, targetUserId: userId };

  if (todayScore <= LOW_SCORE_THRESHOLD) {
    type = "low_mood_alert";
    payload.reason = "low_score";
  } else {
    // 최근 RECENT_DAYS일 점수 조회 → 하락 추세 확인
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - RECENT_DAYS);
    const rangeStartIso = utcToKstDate(rangeStart.toISOString());
    const todayIso = utcToKstDate(new Date().toISOString());

    const { data: recentLogs } = await admin
      .from("mood_logs")
      .select("score, logged_at")
      .eq("user_id", userId)
      .gte("logged_at", kstDayStart(rangeStartIso))
      .lte("logged_at", kstDayEnd(todayIso))
      .order("logged_at", { ascending: true });

    if (recentLogs && recentLogs.length >= 2) {
      const scores: number[] = recentLogs.map((l: { score: number }) => l.score);
      const prev = scores[scores.length - 2];
      if (prev - todayScore >= SHARP_DROP_THRESHOLD) {
        type = "mood_drop_alert";
        payload.reason = "sharp_drop";
        payload.prevScore = prev;
      } else if (scores.length >= 3) {
        const isConsecutiveDrop = scores.every((s, i) => i === 0 || s <= scores[i - 1]);
        if (isConsecutiveDrop) {
          type = "mood_drop_alert";
          payload.reason = "consecutive_drop";
        }
      }
    }
  }

  if (!type) return;

  await emitNotificationEvent({
    recipientAuthIds: recipientIds,
    type,
    targetUserId: userId,
    payload,
    skipIfExistsToday: true,
  });
}

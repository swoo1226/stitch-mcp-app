"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { detectPlatform, detectPushSupport, isStandalonePwa, urlBase64ToUint8Array } from "../../../lib/push-client";
import { getUserSession, type UserRole } from "../../../lib/auth";

type PushStatusResponse = {
  isConfigured: boolean;
  role: UserRole | null;
  cooldownDays: number;
  subscriptions: Array<{
    id: string;
    endpoint: string;
    platform: string;
    device_label: string | null;
    is_active: boolean;
    last_seen_at: string;
    created_at: string;
  }>;
};

function roleItems(role: UserRole | null) {
  if (role === "member") {
    return ["체크인 리마인더", "인앱 알림함에서 상세 확인"];
  }

  if (role === "team_admin" || role === "super_admin") {
    return ["체크인 리마인더", "팀 상태 위험 알림", "인앱 알림함에서 상세 확인"];
  }

  return ["인앱 알림함"];
}

function permissionLabel(permission: NotificationPermission | "unsupported") {
  if (permission === "unsupported") return "브라우저 미지원";
  if (permission === "granted") return "허용됨";
  if (permission === "denied") return "차단됨";
  return "아직 선택 안 함";
}

export default function NotificationsSettingsPageClient() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [support, setSupport] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [status, setStatus] = useState<PushStatusResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStatus() {
    const [session, statusResponse] = await Promise.all([
      getUserSession(),
      fetch("/api/push/subscribe", { cache: "no-store" }),
    ]);

    setRole(session?.role ?? null);

    if (statusResponse.ok) {
      const json = (await statusResponse.json()) as PushStatusResponse;
      setStatus(json);
      return;
    }

    const error = await statusResponse.json().catch(() => null);
    setMessage(error?.error ?? "구독 상태를 불러오지 못했어요.");
  }

  useEffect(() => {
    const supported = detectPushSupport();
    setSupport(supported);
    setStandalone(isStandalonePwa());
    setPermission(supported ? Notification.permission : "unsupported");

    loadStatus()
      .finally(() => setLoading(false));
  }, []);

  async function enablePush() {
    if (!support) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setMessage("VAPID 공개 키가 설정되지 않았어요.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setMessage("브라우저 알림 권한이 허용되지 않았어요. 필요하면 브라우저 설정에서 다시 켤 수 있어요.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const json = subscription.toJSON();
      const deviceLabel = `${detectPlatform()}-${new Date().toLocaleDateString("sv-SE")}`;
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: json,
          deviceLabel,
          platform: detectPlatform(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "subscribe_failed");
      }

      setMessage("중요한 알림만 받도록 설정했어요.");
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "알림 구독에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    if (!support) return;
    setBusy(true);
    setMessage(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      const endpoint = subscription?.endpoint;

      await subscription?.unsubscribe();

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(endpoint ? { endpoint } : {}),
      });

      setMessage("푸시 알림을 해제했어요. 인앱 알림은 계속 받을 수 있어요.");
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "알림 해제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  const activeCount = status?.subscriptions.filter((subscription) => subscription.is_active).length ?? 0;

  return (
    <div className="min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--primary)" }}>Notifications</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>알림 설정</h1>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              푸시는 요약만, 상세 내용은 인앱 알림함에서 확인합니다.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
          >
            대시보드로
          </Link>
        </div>

        <section
          className="rounded-[2rem] p-6"
          style={{ background: "var(--surface-highest)", boxShadow: "var(--glass-shadow)" }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>푸시 알림</h2>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                브라우저 권한은 직접 켤 때만 요청합니다. 업무를 방해하지 않도록 꼭 필요한 알림만 보냅니다.
              </p>
            </div>
            <div className="rounded-[1.25rem] px-4 py-3 text-sm" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)", color: "var(--on-surface)" }}>
              <div>권한 상태: {permissionLabel(permission)}</div>
              <div className="mt-1">활성 구독: {activeCount}개</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] p-4" style={{ background: "var(--surface-overlay)" }}>
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>받는 알림</p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--on-surface)" }}>
                {roleItems(role).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.5rem] p-4" style={{ background: "var(--surface-overlay)" }}>
              <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: "var(--primary)" }}>현재 환경</p>
              <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--on-surface)" }}>
                <li>• 브라우저 지원: {support ? "가능" : "불가"}</li>
                <li>• PWA 설치 상태: {standalone ? "설치됨" : "브라우저 탭에서 사용 중"}</li>
                <li>• 재안내 정책: 권한 거부 후 {status?.cooldownDays ?? 7}일 동안 다시 묻지 않음</li>
                <li>• 조용한 시간: MVP에서는 표시만 제공, 세부 스케줄은 추후 확장</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] p-5" style={{ background: "color-mix(in srgb, var(--surface-highest) 60%, var(--surface-overlay))" }}>
            {!support ? (
              <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                이 브라우저에서는 웹 푸시를 사용할 수 없어요. 인앱 알림함은 계속 사용할 수 있습니다.
              </p>
            ) : !standalone && detectPlatform() === "ios" ? (
              <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                iPhone/iPad에서는 홈 화면에 추가한 뒤에만 푸시가 안정적으로 동작합니다. Safari 공유 메뉴에서 홈 화면에 추가한 뒤 다시 시도해 주세요.
              </p>
            ) : permission === "denied" ? (
              <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                브라우저에서 알림이 차단되어 있어요. OS 또는 브라우저 사이트 설정에서 알림을 다시 허용해 주세요.
              </p>
            ) : activeCount > 0 ? (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  중요한 변화만 받는 중입니다. 잠금화면에는 민감 정보 대신 요약만 표시됩니다.
                </p>
                <button
                  onClick={disablePush}
                  disabled={busy}
                  className="rounded-full px-5 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.06)", color: "var(--on-surface)" }}
                >
                  푸시 알림 끄기
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  먼저 이 화면에서 알림 목적을 확인한 뒤, 원할 때만 권한을 요청합니다.
                </p>
                <button
                  onClick={enablePush}
                  disabled={busy || !status?.isConfigured}
                  className="rounded-full px-5 py-3 text-sm font-black transition-opacity disabled:opacity-50"
                  style={{ background: "var(--primary)", color: "#04141a" }}
                >
                  알림 켜기
                </button>
              </div>
            )}

            {message ? (
              <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>{message}</p>
            ) : null}
            {!loading && status && !status.isConfigured ? (
              <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
                서버 VAPID 설정이 아직 없어 실제 푸시 전송은 비활성화된 상태입니다.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

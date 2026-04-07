"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STANDARD_SPRING } from "../constants/springs";

interface Notification {
  id: string;
  type: "low_mood_alert" | "mood_drop_alert" | "checkin_reminder" | "team_admin_access_request" | "member_access_request";
  target_user_id: string | null;
  payload: {
    score?: number;
    userName?: string;
    reason?: string;
    prevScore?: number;
    requesterName?: string;
    requesterEmail?: string;
    organization?: string;
    teamName?: string;
  };
  read_at: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<Notification["type"], string> = {
  low_mood_alert: "저점수 알림",
  mood_drop_alert: "컨디션 하락",
  checkin_reminder: "체크인 리마인더",
  team_admin_access_request: "팀장 도입 요청",
  member_access_request: "팀원 도입 요청",
};

const REASON_LABEL: Record<string, string> = {
  low_score: "점수 40 이하",
  sharp_drop: "하루 20pt 이상 하락",
  consecutive_drop: "연속 하락",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NOTIFICATION_RECEIVED") {
        fetchNotifications();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  // 패널 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      fetchNotifications();
    }
    if (!open && unreadCount > 0) markAllRead();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
        aria-label="알림"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
          <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
        </svg>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black"
              style={{ background: "var(--error)", color: "white" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={STANDARD_SPRING}
            className="fixed right-3 top-[4.5rem] z-[260] w-[min(20rem,calc(100vw-1.5rem))] rounded-[1.5rem] overflow-hidden md:right-8 md:top-[4.75rem]"
            style={{
              background: "var(--surface-lowest)",
              boxShadow: "0 24px 56px -18px rgba(18, 28, 31, 0.28), 0 10px 24px -12px rgba(18, 28, 31, 0.16)",
              border: "1px solid color-mix(in srgb, var(--on-surface) 10%, transparent)",
              isolation: "isolate",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--surface-overlay)" }}>
              <span className="text-sm font-black" style={{ color: "var(--on-surface)" }}>알림</span>
              {notifications.some((n) => !n.read_at) && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-bold transition-opacity hover:opacity-70"
                  style={{ color: "var(--primary)" }}
                >
                  모두 읽음
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-soft)" }}>알림이 없어요</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 px-4 py-3 transition-colors"
                    style={{
                      background: n.read_at ? "transparent" : "color-mix(in srgb, var(--primary) 6%, transparent)",
                      borderBottom: "1px solid var(--surface-overlay)",
                    }}
                  >
                    {/* 타입 아이콘 */}
                    <div
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: n.type === "checkin_reminder"
                          ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                          : "color-mix(in srgb, var(--error) 12%, transparent)",
                      }}
                    >
                      {n.type === "checkin_reminder" ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="var(--primary)" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="var(--error)" strokeWidth="2">
                          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black" style={{ color: "var(--on-surface)" }}>
                        {(n.payload.userName || n.payload.requesterName) && `${n.payload.userName ?? n.payload.requesterName} · `}{TYPE_LABEL[n.type]}
                      </p>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {(n.type === "team_admin_access_request" || n.type === "member_access_request")
                          ? [n.payload.organization, n.payload.teamName].filter(Boolean).join(" · ")
                          : (
                            <>
                              {n.payload.score !== undefined && `${n.payload.score}pt`}
                              {n.payload.reason && ` · ${REASON_LABEL[n.payload.reason] ?? n.payload.reason}`}
                              {n.payload.prevScore !== undefined && ` (이전 ${n.payload.prevScore}pt)`}
                            </>
                          )}
                      </p>
                      <p className="mt-1 text-[10px]" style={{ color: "var(--text-soft)" }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>

                    {!n.read_at && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--primary)" }} />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: "var(--surface-overlay)" }}>
              <p className="text-[11px] font-medium" style={{ color: "var(--text-soft)" }}>
                푸시는 요약만 보내고 상세는 여기서 확인해요.
              </p>
              <Link
                href="/settings/notifications"
                className="text-xs font-black"
                style={{ color: "var(--primary)" }}
                onClick={() => setOpen(false)}
              >
                푸시 설정
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

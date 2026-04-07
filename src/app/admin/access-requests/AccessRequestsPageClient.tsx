"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { STANDARD_SPRING } from "../../constants/springs";

function BottomNav() {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "var(--glass-blur)",
        boxShadow: "0 -1px 0 color-mix(in srgb, var(--on-surface) 8%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 팀원 */}
      <Link
        href="/admin"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors"
        style={{ color: "var(--text-soft)" }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-black">팀원</span>
      </Link>
      {/* 팀·파트 */}
      <Link
        href="/admin"
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors"
        style={{ color: "var(--text-soft)" }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-black">팀·파트</span>
      </Link>
      {/* 도입 요청 — active */}
      <div
        className="flex flex-1 flex-col items-center justify-center gap-1 py-3"
        style={{ color: "var(--primary)" }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" />
          <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" />
        </svg>
        <span className="text-[10px] font-black">도입 요청</span>
      </div>
    </div>
  );
}

type AccessRequest = {
  id: string;
  requester_role: "team_admin" | "member";
  name: string;
  email: string;
  organization: string;
  team_name: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  reviewed_at: string | null;
  reviewer_note: string | null;
  created_at: string;
};

const ROLE_LABEL = { team_admin: "팀장", member: "팀원" };
const STATUS_LABEL = { pending: "검토 중", approved: "승인", rejected: "거절" };
const STATUS_COLOR = {
  pending: "var(--text-soft)",
  approved: "var(--primary)",
  rejected: "var(--error)",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return h < 1 ? "방금" : `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function AccessRequestsPageClient() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [selected, setSelected] = useState<AccessRequest | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/access-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function review(status: "approved" | "rejected") {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/access-requests/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewerNote: note }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selected.id
              ? { ...r, status, reviewed_at: new Date().toISOString(), reviewer_note: note }
              : r
          )
        );
        setSelected(null);
        setNote("");
      }
    } finally {
      setBusy(false);
    }
  }

  const filtered = requests.filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="min-h-screen px-5 py-8 pb-28 md:px-8 md:pb-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--primary)" }}>Super Admin</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>도입 요청</h1>
          </div>
          <Link
            href="/admin"
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
          >
            어드민으로
          </Link>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-4 py-1.5 text-sm font-bold transition-all"
              style={
                filter === f
                  ? { background: "var(--primary)", color: "#04141a" }
                  : { background: "color-mix(in srgb, var(--on-surface) 8%, transparent)", color: "var(--text-soft)" }
              }
            >
              {f === "all" ? "전체" : STATUS_LABEL[f]}
              {f !== "all" && (
                <span className="ml-1.5 text-xs opacity-70">
                  {requests.filter((r) => r.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div
          className="rounded-[2rem] overflow-hidden"
          style={{ background: "var(--surface-container-highest)", boxShadow: "var(--glass-shadow)" }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--text-soft)" }}>요청이 없어요</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--surface-overlay)" }}>
              {filtered.map((r) => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => { setSelected(r); setNote(r.reviewer_note ?? ""); }}
                  className="w-full flex items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-surface-low"
                >
                  <div
                    className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black"
                    style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
                  >
                    {ROLE_LABEL[r.requester_role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: "var(--on-surface)" }}>
                      {r.name} · {r.organization}
                    </p>
                    <p className="mt-0.5 text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {r.email} · {r.team_name}
                    </p>
                    <p className="mt-1 text-[11px]" style={{ color: "var(--text-soft)" }}>{timeAgo(r.created_at)}</p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-bold"
                    style={{ color: STATUS_COLOR[r.status] }}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* 상세 패널 */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-[300]"
              style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={STANDARD_SPRING}
              className="fixed right-0 top-0 z-[310] h-full w-full max-w-md overflow-y-auto px-6 py-8 flex flex-col gap-5"
              style={{ background: "var(--surface-lowest)", boxShadow: "-16px 0 48px -12px rgba(0,0,0,0.18)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black" style={{ color: "var(--on-surface)" }}>요청 상세</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: "color-mix(in srgb, var(--on-surface) 8%, transparent)", color: "var(--text-soft)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="rounded-[1.5rem] p-4 flex flex-col gap-2" style={{ background: "var(--surface-container-highest)" }}>
                {[
                  ["역할", ROLE_LABEL[selected.requester_role]],
                  ["이름", selected.name],
                  ["이메일", selected.email],
                  ["조직", selected.organization],
                  ["팀명", selected.team_name],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <span className="w-14 shrink-0 font-bold" style={{ color: "var(--text-soft)" }}>{label}</span>
                    <span style={{ color: "var(--on-surface)" }}>{value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[1.5rem] p-4" style={{ background: "var(--surface-container-highest)" }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-soft)" }}>도입 메시지</p>
                <p className="text-sm leading-6 whitespace-pre-wrap" style={{ color: "var(--on-surface)" }}>{selected.message}</p>
              </div>

              {selected.status === "pending" ? (
                <>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "var(--text-soft)" }}>검토 메모 (선택)</p>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={3}
                      placeholder="내부 메모..."
                      className="w-full rounded-[1.25rem] px-4 py-3 text-sm resize-none outline-none"
                      style={{
                        background: "var(--surface-container-highest)",
                        color: "var(--on-surface)",
                        border: "1px solid color-mix(in srgb, var(--on-surface) 10%, transparent)",
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => review("approved")}
                      disabled={busy}
                      className="flex-1 rounded-full py-3 text-sm font-black transition-opacity disabled:opacity-50"
                      style={{ background: "var(--primary)", color: "#04141a" }}
                    >
                      승인
                    </button>
                    <button
                      onClick={() => review("rejected")}
                      disabled={busy}
                      className="flex-1 rounded-full py-3 text-sm font-black transition-opacity disabled:opacity-50"
                      style={{ background: "color-mix(in srgb, var(--error) 14%, transparent)", color: "var(--error)" }}
                    >
                      거절
                    </button>
                  </div>
                </>
              ) : (
                <div className="rounded-[1.5rem] p-4" style={{ background: "color-mix(in srgb, var(--on-surface) 4%, transparent)" }}>
                  <p className="text-xs font-black" style={{ color: STATUS_COLOR[selected.status] }}>
                    {STATUS_LABEL[selected.status]} · {selected.reviewed_at ? timeAgo(selected.reviewed_at) : ""}
                  </p>
                  {selected.reviewer_note && (
                    <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{selected.reviewer_note}</p>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

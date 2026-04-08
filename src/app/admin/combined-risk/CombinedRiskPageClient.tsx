"use client";

import Link from "next/link";
import { useMemo } from "react";
import AdminBottomNav from "../../components/AdminBottomNav";

type CombinedRiskTarget = {
  userId: string;
  name: string;
  teamId: string | null;
  teamName: string;
  partName: string | null;
  todayScore: number;
  recentDelta: number | null;
  openTicketCount: number;
  blockerCount: number;
  level: "critical" | "warning";
  tickets: Array<{
    key: string;
    summary: string;
    status: string;
    browseUrl: string;
  }>;
};

function levelLabel(level: "critical" | "warning") {
  return level === "critical" ? "CRITICAL" : "WARNING";
}

function levelStyle(level: "critical" | "warning") {
  return level === "critical"
    ? { background: "color-mix(in srgb, var(--error) 14%, transparent)", color: "var(--error)" }
    : { background: "color-mix(in srgb, #f59e0b 16%, transparent)", color: "#b7791f" };
}

export default function CombinedRiskPageClient({
  targets,
  highlightedUserId,
  role,
}: {
  targets: CombinedRiskTarget[];
  highlightedUserId: string | null;
  role: "super_admin" | "team_admin";
}) {
  const orderedTargets = useMemo(() => {
    if (!highlightedUserId) return targets;
    return [...targets].sort((a, b) => {
      if (a.userId === highlightedUserId) return -1;
      if (b.userId === highlightedUserId) return 1;
      return 0;
    });
  }, [targets, highlightedUserId]);

  return (
    <div className="min-h-screen px-5 py-8 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--primary)" }}>
              {role === "super_admin" ? "Super Admin" : "Team Admin"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
              오늘의 주의 팀원
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              컨디션과 Jira 미완료 티켓을 함께 본 배치 결과입니다.
            </p>
          </div>
          <Link
            href="/admin"
            className="rounded-full px-4 py-2 text-sm font-bold"
            style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
          >
            어드민으로
          </Link>
        </div>

        <div className="rounded-[2rem] p-5" style={{ background: "var(--surface-highest)", boxShadow: "var(--glass-shadow)" }}>
          {orderedTargets.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--text-soft)" }}>오늘은 주의 팀원이 없어요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orderedTargets.map((target) => {
                const highlighted = target.userId === highlightedUserId;
                return (
                  <div
                    key={target.userId}
                    className="rounded-[1.5rem] p-5"
                    style={{
                      background: highlighted ? "color-mix(in srgb, var(--primary) 10%, var(--surface-lowest))" : "var(--surface-lowest)",
                      boxShadow: highlighted ? "0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent)" : "none",
                    }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide"
                            style={levelStyle(target.level)}
                          >
                            {levelLabel(target.level)}
                          </span>
                          {highlighted ? (
                            <span className="rounded-full px-2.5 py-1 text-[11px] font-black tracking-wide" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}>
                              알림에서 열림
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-3 text-xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                          {target.name}
                        </h2>
                        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                          {[target.teamName, target.partName].filter(Boolean).join(" · ")}
                        </p>
                      </div>

                      <Link
                        href={`/personal?user=${encodeURIComponent(target.userId)}`}
                        className="rounded-full px-4 py-2 text-sm font-bold"
                        style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
                      >
                        개인 현황 보기
                      </Link>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-[1.25rem] px-4 py-3" style={{ background: "var(--surface-overlay)" }}>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-soft)" }}>오늘 점수</p>
                        <p className="mt-2 text-lg font-black" style={{ color: "var(--on-surface)" }}>{target.todayScore}pt</p>
                      </div>
                      <div className="rounded-[1.25rem] px-4 py-3" style={{ background: "var(--surface-overlay)" }}>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-soft)" }}>최근 변화</p>
                        <p className="mt-2 text-lg font-black" style={{ color: "var(--on-surface)" }}>
                          {target.recentDelta == null ? "데이터 없음" : `${target.recentDelta > 0 ? "+" : ""}${target.recentDelta}pt`}
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] px-4 py-3" style={{ background: "var(--surface-overlay)" }}>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-soft)" }}>미완료</p>
                        <p className="mt-2 text-lg font-black" style={{ color: "var(--on-surface)" }}>{target.openTicketCount}건</p>
                      </div>
                      <div className="rounded-[1.25rem] px-4 py-3" style={{ background: "var(--surface-overlay)" }}>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-soft)" }}>Blocker</p>
                        <p className="mt-2 text-lg font-black" style={{ color: "var(--on-surface)" }}>{target.blockerCount}건</p>
                      </div>
                    </div>

                    {target.tickets.length > 0 ? (
                      <div className="mt-4 rounded-[1.25rem] p-4" style={{ background: "color-mix(in srgb, var(--surface-highest) 45%, var(--surface-lowest))" }}>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "var(--text-soft)" }}>주요 티켓</p>
                        <div className="mt-3 space-y-2">
                          {target.tickets.map((ticket) => (
                            <a
                              key={ticket.key}
                              href={ticket.browseUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block rounded-[1rem] px-3 py-3 transition-colors"
                              style={{ background: "var(--surface-overlay)" }}
                            >
                              <p className="text-sm font-black" style={{ color: "var(--on-surface)" }}>{ticket.key}</p>
                              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{ticket.summary}</p>
                              <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--text-soft)" }}>{ticket.status}</p>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <AdminBottomNav isSuperAdmin={role === "super_admin"} />
    </div>
  );
}

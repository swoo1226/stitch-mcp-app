"use client";

import Link from "next/link";
import { useMemo } from "react";
import AdminBottomNav from "../../components/AdminBottomNav";
import AdminSectionHeader from "../../components/AdminSectionHeader";

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
    : { background: "color-mix(in srgb, var(--tertiary) 14%, transparent)", color: "var(--tertiary)" };
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
    <div className="min-h-screen px-5 pt-20 pb-8 md:px-8">
      <AdminSectionHeader current="combined-risk" role={role} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
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
                    className="rounded-[1.5rem] p-4 md:p-5"
                    style={{
                      background: highlighted ? "color-mix(in srgb, var(--primary) 10%, var(--surface-lowest))" : "var(--surface-lowest)",
                      boxShadow: highlighted ? "0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent)" : "none",
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider"
                            style={levelStyle(target.level)}
                          >
                            {levelLabel(target.level)}
                          </span>
                          <span className="text-[11px] font-black tracking-tight" style={{ color: "var(--primary)" }}>
                            {[target.teamName, target.partName].filter(Boolean).join(" · ")}
                          </span>
                        </div>
                        <h2 className="mt-1 text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                          {target.name}
                        </h2>
                      </div>

                      <Link
                        href={`/personal?user=${encodeURIComponent(target.userId)}`}
                        className="rounded-full px-3 py-1.5 text-xs font-black shrink-0"
                        style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
                      >
                        상세 →
                      </Link>
                    </div>

                    {/* 압축된 메트릭 로우 */}
                    <div className="mt-3 flex flex-wrap gap-2">
                       <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--surface-overlay)" }}>
                         <span className="text-[10px] font-black opacity-50 uppercase tracking-wider">Mood</span>
                         <span className="text-xs font-black" style={{ color: target.todayScore <= 30 ? "var(--error)" : "var(--on-surface)" }}>{target.todayScore}pt</span>
                       </div>
                       <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--surface-overlay)" }}>
                         <span className="text-[10px] font-black opacity-50 uppercase tracking-wider">Delta</span>
                         <span className="text-xs font-black">{target.recentDelta == null ? "-" : `${target.recentDelta > 0 ? "+" : ""}${target.recentDelta}`}</span>
                       </div>
                       <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "var(--surface-overlay)" }}>
                         <span className="text-[10px] font-black opacity-50 uppercase tracking-wider">Open</span>
                         <span className="text-xs font-black">{target.openTicketCount}</span>
                       </div>
                       {target.blockerCount > 0 && (
                         <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ background: "color-mix(in srgb, var(--error) 12%, var(--surface-overlay))" }}>
                           <span className="text-[10px] font-black text-error uppercase tracking-wider">Blocker</span>
                           <span className="text-xs font-black text-error">{target.blockerCount}</span>
                         </div>
                       )}
                    </div>

                    {target.tickets.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-[color:var(--border-subtle)] pt-3">
                        {target.tickets.map((ticket) => (
                          <a
                            key={ticket.key}
                            href={ticket.browseUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-[1rem] p-2 transition-colors hover:bg-surface-low"
                          >
                            <div className="min-w-0">
                               <p className="text-[11px] font-black opacity-70" style={{ color: "var(--on-surface)" }}>{ticket.key}</p>
                               <p className="truncate text-xs font-medium" style={{ color: "var(--text-muted)" }}>{ticket.summary}</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-surface-container px-2 py-0.5 text-[9px] font-black" style={{ color: "var(--text-soft)" }}>
                              {ticket.status}
                            </span>
                          </a>
                        ))}
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

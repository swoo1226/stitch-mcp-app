"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ClimaLogo from "../components/WetherLogo";
import {
  GlassCard,
  MiniStatCard,
  NikoGridHeader,
  NikoMemberRow,
  PrimaryTabToggle,
  SectionHeader,
  WeatherLegend,
} from "../components/ui";
import { STANDARD_SPRING } from "../constants/springs";
import { DEFAULT_TEAM_ID, supabase } from "../../lib/supabase";
import { scoreToStatus, type WeatherStatus } from "../../lib/mood";

// ─── 날짜 유틸 ──────────────────────────────────────────────────────────────
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d: Date): string {
  // 로컬 타임존 기준 YYYY-MM-DD (toISOString은 UTC라 한국에서 날짜가 어긋남)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];
const COL_TEMPLATE = "240px repeat(5, minmax(110px, 1fr))";

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface MoodLogRow {
  user_id: string;
  score: number;
  logged_at: string;
}

interface UserRow {
  id: string;
  name: string;
  avatar_emoji: string;
}

interface MemberRow {
  id: string;
  name: string;
  avatar: string;
  week: Array<{ status: WeatherStatus | null; score: number | null }>;
  todayScore: number | null;
}

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Personal", href: "/personal" },
  { label: "Team", href: "/dashboard" },
  { label: "Niko-Niko", href: "/niko", active: true },
  { label: "Alerts", href: "/alerts" },
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10.5h17" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function TopIcon({ type }: { type: "bell" | "settings" | "profile" }) {
  if (type === "bell") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
        <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
      </svg>
    );
  }
  if (type === "settings") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.5-2.4 1a8 8 0 0 0-1.8-1L14.5 3h-5L9.3 6a8 8 0 0 0-1.8 1l-2.4-1-2 3.5 2 1.6A7 7 0 0 0 5 12c0 .34.03.67.1 1l-2 1.6 2 3.5 2.4-1a8 8 0 0 0 1.8 1l.2 3h5l.2-3a8 8 0 0 0 1.8-1l2.4 1 2-3.5-2-1.6c.07-.33.1-.66.1-1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function NikoPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);
  const todayIso = isoDate(today);

  const todayIndex = weekDays.findIndex((d) => isoDate(d) === todayIso);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const rangeStart = isoDate(weekDays[0]);
      const rangeEnd = isoDate(weekDays[4]);

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, avatar_emoji")
        .eq("team_id", DEFAULT_TEAM_ID);

      if (usersError || !users) {
        setLoading(false);
        return;
      }

      const userIds = (users as UserRow[]).map((u) => u.id);
      const { data: logs } = await supabase
        .from("mood_logs")
        .select("user_id, score, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", `${rangeStart}T00:00:00`)
        .lte("logged_at", `${rangeEnd}T23:59:59`)
        .order("logged_at", { ascending: true });

      const logRows: MoodLogRow[] = (logs as MoodLogRow[]) ?? [];

      const mapped: MemberRow[] = (users as UserRow[]).map((user) => {
        const userLogs = logRows.filter((l) => l.user_id === user.id);

        const week = weekDays.map((day) => {
          const dayIso = isoDate(day);
          const dayLogs = userLogs.filter((l) => l.logged_at.startsWith(dayIso));
          if (dayLogs.length === 0) return { status: null, score: null };
          const latest = dayLogs[dayLogs.length - 1];
          return { status: scoreToStatus(latest.score), score: latest.score };
        });

        const todayScore = todayIndex >= 0 ? (week[todayIndex]?.score ?? null) : null;

        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar_emoji || "🙂",
          week,
          todayScore,
        };
      });

      setMembers(mapped);
      setLoading(false);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  const dateRangeLabel = `${weekDays[0].toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} — ${weekDays[4].toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`;

  const todayScores = members.map((m) => m.todayScore).filter((s): s is number => s !== null);
  const avgToday = todayScores.length
    ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length)
    : null;

  const checkedInCount = members.filter(
    (m) => todayIndex >= 0 && m.week[todayIndex]?.status !== null
  ).length;

  const headerDays = weekDays.map((date, i) => ({ label: DAY_LABELS[i], date }));

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(197,242,237,0.42) 0%, rgba(235,250,236,0.96) 38%, rgba(228,245,229,1) 100%)",
      }}
    >
      {/* ── 헤더 (fixed, h-16, 한 줄) ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-10 bg-white/70 backdrop-blur-[20px] shadow-[0_40px_40px_-10px_rgba(37,50,40,0.06)]"
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ClimaLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1 text-sm font-semibold tracking-tight transition-colors rounded-full"
                style={
                  item.active
                    ? { color: "var(--primary)", borderBottom: "2px solid var(--primary)" }
                    : { color: "rgba(37,50,40,0.55)" }
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2" style={{ color: "rgba(37,50,40,0.7)" }}>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="bell" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="settings" />
          </button>
          <Link href="/personal" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="profile" />
          </Link>
        </div>
      </motion.header>

      {/* ── 본문 ── */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...STANDARD_SPRING, delay: 0.06 }}
        className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 pb-12 pt-20 md:px-8 xl:px-10"
      >
        {/* 타이틀 + 주차 전환 + 통계 */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            icon={<CalendarIcon />}
            title="Niko-Niko Calendar"
            subtitle={dateRangeLabel}
          />
          <div className="flex flex-col gap-3 sm:items-end">
            <PrimaryTabToggle
              tabs={[
                { value: "this", label: "This Week" },
                { value: "last", label: "Last Week" },
              ]}
              active={weekOffset === 0 ? "this" : "last"}
              onChange={(v) => setWeekOffset(v === "this" ? 0 : -1)}
            />
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <MiniStatCard
                label="Today's Check-ins"
                value={loading ? "—" : `${checkedInCount} / ${members.length}`}
              />
              <MiniStatCard
                label="Team Avg Today"
                value={loading ? "—" : avgToday !== null ? `${avgToday}pt` : "—"}
                valueColor="primary"
              />
            </div>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <GlassCard className="overflow-x-auto no-scrollbar px-5 py-6 md:px-8 md:py-8" intensity="low">
          <div className="min-w-[920px]">
            <NikoGridHeader
              days={headerDays}
              todayIso={todayIso}
              colTemplate={COL_TEMPLATE}
            />
            <div className="flex flex-col gap-2">
              {loading
                ? Array.from({ length: 5 }, (_, i) => (
                    <NikoMemberRow
                      key={i}
                      avatar=""
                      name=""
                      week={Array.from({ length: 5 }, () => ({ status: null, score: null }))}
                      todayIndex={todayIndex}
                      colTemplate={COL_TEMPLATE}
                      loading
                    />
                  ))
                : members.map((member) => (
                    <NikoMemberRow
                      key={member.id}
                      avatar={member.avatar}
                      name={member.name}
                      subtitle={
                        member.todayScore !== null
                          ? `${member.todayScore}pt today`
                          : "No entry today"
                      }
                      week={member.week}
                      todayIndex={todayIndex}
                      colTemplate={COL_TEMPLATE}
                    />
                  ))}
            </div>
          </div>
        </GlassCard>

        {/* 범례 */}
        <WeatherLegend className="px-1" />
      </motion.main>
    </div>
  );
}

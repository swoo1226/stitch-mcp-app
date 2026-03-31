"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ClimaLogo from "../components/WetherLogo";
import HeaderNav, { type HeaderNavItem } from "../components/HeaderNav";
import {
  ClimaButton,
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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];
const COL_TEMPLATE = "280px repeat(5, minmax(128px, 1fr))";
const NAV_ITEMS: HeaderNavItem[] = [
  { label: "Current Niko", href: "/niko" },
  { label: "Niko v2", href: "/niko-v2" },
  { label: "Current Dashboard", href: "/dashboard", matchPaths: ["/dashboard", "/team"] },
  { label: "Dashboard v2", href: "/dashboard-v2" },
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10.5h17" />
    </svg>
  );
}

export default function NikoV2Page() {
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
        const userLogs = logRows.filter((log) => log.user_id === user.id);

        const week = weekDays.map((day) => {
          const dayIso = isoDate(day);
          const dayLogs = userLogs.filter((log) => log.logged_at.startsWith(dayIso));
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

  const todayScores = members.map((member) => member.todayScore).filter((score): score is number => score !== null);
  const avgToday = todayScores.length
    ? Math.round(todayScores.reduce((sum, score) => sum + score, 0) / todayScores.length)
    : null;

  const checkedInCount = members.filter(
    (member) => todayIndex >= 0 && member.week[todayIndex]?.status !== null
  ).length;

  const headerDays = weekDays.map((date, i) => ({ label: DAY_LABELS[i], date }));
  const rangeLabel = `${weekDays[0].toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} — ${weekDays[4].toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`;

  return (
    <div
      className="min-h-screen px-3 py-3 md:px-4 md:py-4"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(197,242,237,0.42) 0%, rgba(235,250,236,0.96) 38%, rgba(228,245,229,1) 100%)",
      }}
    >
      <div
        className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1480px] flex-col gap-4 rounded-[2rem] p-2 backdrop-blur-sm md:p-3"
        style={{ background: "rgba(255,255,255,0.38)" }}
      >
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="rounded-[1.7rem] bg-white/78 px-5 py-4 shadow-[0_18px_38px_rgba(37,50,40,0.05)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center">
                <ClimaLogo />
              </Link>
              <nav className="flex flex-wrap items-center gap-1 md:gap-2">
                <HeaderNav items={NAV_ITEMS} />
              </nav>
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.06 }}
          className="flex flex-1 flex-col gap-4 rounded-[2rem] px-5 py-6 md:px-7"
          style={{ background: "rgba(235,250,236,0.88)" }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <SectionHeader
                icon={<CalendarIcon />}
                title="Niko-Niko Calendar v2"
                subtitle={`${rangeLabel} · 캘린더 비중과 데스크톱 가독성을 키운 비교안입니다.`}
              />
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <PrimaryTabToggle
                tabs={[
                  { value: "this", label: "This Week" },
                  { value: "last", label: "Last Week" },
                ]}
                active={weekOffset === 0 ? "this" : "last"}
                onChange={(value) => setWeekOffset(value === "this" ? 0 : -1)}
              />

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <MiniStatCard label="Today's Check-ins" value={loading ? "—" : `${checkedInCount} / ${members.length}`} />
                <MiniStatCard
                  label="Team Avg Today"
                  value={loading ? "—" : avgToday !== null ? `${avgToday}pt` : "—"}
                  valueColor="primary"
                />
              </div>
            </div>
          </div>

          <GlassCard className="flex-1 overflow-x-auto no-scrollbar px-6 py-6 md:px-8 md:py-8" intensity="low">
            <div className="min-w-[980px]">
              <NikoGridHeader
                days={headerDays}
                todayIso={todayIso}
                colTemplate={COL_TEMPLATE}
                className="mb-6"
              />

              <div className="flex flex-col gap-3">
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
                        subtitle={member.todayScore !== null ? `${member.todayScore}pt today` : "No entry today"}
                        week={member.week}
                        todayIndex={todayIndex}
                        colTemplate={COL_TEMPLATE}
                      />
                    ))}
              </div>
            </div>
          </GlassCard>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <WeatherLegend className="px-1 pt-1" />
            <div className="flex flex-wrap items-center gap-3">
              <ClimaButton variant="secondary" href="/niko" className="justify-center px-8">
                Open Current Niko
              </ClimaButton>
              <ClimaButton href="/dashboard-v2" className="justify-center px-8">
                Open Dashboard v2
              </ClimaButton>
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

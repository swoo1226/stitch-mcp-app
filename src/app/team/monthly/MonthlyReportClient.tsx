"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ClimaLogo from "../../components/WetherLogo";
import HeaderNav from "../../components/HeaderNav";
import NotificationBell from "../../components/NotificationBell";
import { getNavItems } from "../../../lib/nav-items";
import { getUserSession, type UserRole } from "../../../lib/auth";
import { displayName as getDisplayName } from "../../../lib/user";
import ThemeToggleButton from "../../components/ThemeToggleButton";
import { MoodTrendChart } from "../../components/MoodTrendChart";
import {
  SectionLabel,
  WeatherLegend,
  TopIcon,
  NikoMemberRow,
  NikoSummaryRow,
  NikoGridHeader,
  type NikoCalendarMember,
  PrimaryTabToggle
} from "../../components/ui";

import { STANDARD_SPRING } from "../../constants/springs";
import { supabase } from "../../../lib/supabase";
import { scoreToStatus, type WeatherStatus } from "../../../lib/mood";
import { DEMO_TEAM_ID, DEMO_PARTS, getDemoMembers, getDemoMonthLogs, getDemoSnapshotDate } from "../../../lib/demo-data";

function withTeamParam(href: string, teamId: string | null): string {
  if (!teamId) return href;
  const [path, existing] = href.split("?");
  const params = new URLSearchParams(existing ?? "");
  params.set("team", teamId);
  return `${path}?${params.toString()}`;
}

// ─── 날짜 유틸 ──────────────────────────────────────────────────────────────
function getMonthDays(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) { // 주말 제외
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function kstDayStart(iso: string): string { return `${iso}T00:00:00+09:00`; }
function kstDayEnd(iso: string): string { return `${iso}T23:59:59+09:00`; }

function utcToKstDate(utcStr: string): string {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEATHER_LABELS: Record<string, string> = {
  Sunny: "맑음",
  PartlyCloudy: "구름조금",
  Cloudy: "흐림",
  Rainy: "비",
  Stormy: "뇌우",
};

// ─── 타입 ───────────────────────────────────────────────────────────────────
interface MoodLogRow {
  user_id: string;
  score: number;
  message: string | null;
  logged_at: string;
}

interface UserRow {
  id: string;
  name: string;
  nickname: string | null;
  avatar_emoji: string;
  part_id: string | null;
}

interface MemberRow {
  id: string;
  name: string;
  avatarEmoji: string;
  part_id: string | null;
  logs: MoodLogRow[];
}

export default function MonthlyReportClient({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0); // 0: 이번 달, -1: 지난 달
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const today = useMemo(() => teamId === DEMO_TEAM_ID ? getDemoSnapshotDate() : new Date(), [teamId]);
  const targetDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1), [today, monthOffset]);
  const monthDays = useMemo(() => getMonthDays(targetDate.getFullYear(), targetDate.getMonth()), [targetDate]);
  
  const monthStartIso = useMemo(() => monthDays.length > 0 ? isoDate(monthDays[0]) : "", [monthDays]);
  const monthEndIso = useMemo(() => monthDays.length > 0 ? isoDate(monthDays[monthDays.length - 1]) : "", [monthDays]);
  const todayIso = useMemo(() => isoDate(today), [today]);

  const colTemplate = `140px repeat(${monthDays.length}, minmax(70px, 1fr))`;

  useEffect(() => {
    getUserSession().then((s) => {
      setUserRole(s?.role ?? null);
      setManagedTeamId(s?.managedTeamId ?? null);
    });
  }, []);

  useEffect(() => {
    if (teamId === DEMO_TEAM_ID) {
      const monthLogs = getDemoMonthLogs(monthOffset);
      const demoMembers = getDemoMembers(0).map(({ avatar, ...member }) => ({
        ...member,
        avatarEmoji: avatar,
        logs: monthLogs.filter((l) => l.user_id === member.id),
      }));
      setMembers(demoMembers);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);

      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, nickname, avatar_emoji, part_id")
        .eq("team_id", teamId);

      if (usersError || !users) {
        setLoading(false);
        return;
      }

      const userIds = users.map((u) => u.id);
      const { data: logs } = await supabase
        .from("mood_logs")
        .select("user_id, score, message, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", kstDayStart(monthStartIso))
        .lte("logged_at", kstDayEnd(monthEndIso))
        .order("logged_at", { ascending: true });

      const logRows: MoodLogRow[] = (logs as MoodLogRow[]) ?? [];

      const mapped: MemberRow[] = users.map((user) => ({
        id: user.id,
        name: getDisplayName(user),
        avatarEmoji: user.avatar_emoji || "",
        part_id: user.part_id ?? null,
        logs: logRows.filter((l) => l.user_id === user.id),
      }));

      setMembers(mapped);
      setLoading(false);
    }

    fetchData();
  }, [monthOffset, teamId, monthStartIso, monthEndIso]);

  const monthLabel = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월`;

  const calendarMembers = useMemo(() => {
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      avatarEmoji: m.avatarEmoji,
      week: monthDays.map((day) => {
        const dayIso = isoDate(day);
        const dayLogs = m.logs.filter((log) => utcToKstDate(log.logged_at) === dayIso);
        if (dayLogs.length === 0) return { status: null, score: null, message: null };
        const latest = dayLogs[dayLogs.length - 1];
        return {
          status: scoreToStatus(latest.score),
          score: latest.score,
          message: latest.message ?? null,
        };
      }),
    }));
  }, [members, monthDays]);

  const averageRow = useMemo(() => {
    return monthDays.map((_, dayIdx) => {
      const dayScores = calendarMembers
        .map((m) => m.week[dayIdx]?.score ?? null)
        .filter((s): s is number => s !== null);
      if (dayScores.length === 0) return { status: null, score: null, message: null };
      const avg = Math.round(dayScores.reduce((a, b) => a + b, 0) / dayScores.length);
      return {
        status: scoreToStatus(avg),
        score: avg,
        message: `${dayScores.length}명 참여`,
      };
    });
  }, [calendarMembers, monthDays]);

  const totalAvg = useMemo(() => {
    const allScores = calendarMembers.flatMap(m => m.week.map(w => w.score).filter((s): s is number => s !== null));
    if (allScores.length === 0) return null;
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }, [calendarMembers]);

  const stats = useMemo(() => {
    const dayAvgs = averageRow.map(r => r.score).filter((s): s is number => s !== null);
    if (dayAvgs.length === 0) return null;

    const highest = Math.max(...dayAvgs);
    const lowest = Math.min(...dayAvgs);
    const highestDayIdx = averageRow.findIndex(r => r.score === highest);
    
    // 기분 분포
    const counts = { Sunny: 0, PartlyCloudy: 0, Cloudy: 0, Rainy: 0, Stormy: 0 };
    let total = 0;
    calendarMembers.forEach(m => m.week.forEach(w => {
      if (w.status) {
        counts[w.status]++;
        total++;
      }
    }));

    const distribution = Object.entries(counts).map(([status, count]) => ({
      status: status as WeatherStatus,
      pct: total > 0 ? Math.round((count / total) * 100) : 0
    })).sort((a, b) => b.pct - a.pct);

    // 안정성 (표준편차 대략적 계산)
    const avg = dayAvgs.reduce((a, b) => a + b, 0) / dayAvgs.length;
    const variance = dayAvgs.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / dayAvgs.length;
    const stdDev = Math.sqrt(variance);
    const stability = stdDev < 10 ? "매우 높음" : stdDev < 20 ? "높음" : "변동성 있음";

    return { highest, lowest, highestDay: monthDays[highestDayIdx], distribution, stability };
  }, [averageRow, calendarMembers, monthDays]);

  return (
    <div className="min-h-screen" style={{ background: "var(--hero-gradient)" }}>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-6 md:px-10"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ClimaLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <HeaderNav items={getNavItems(userRole, managedTeamId)} teamId={teamId} />
          </nav>
        </div>
        <div className="flex items-center gap-2" style={{ color: "var(--header-action-color)" }}>
          <ThemeToggleButton />
          <NotificationBell />
          <Link href="/settings" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="settings" />
          </Link>
          <Link href={withTeamParam("/personal", teamId)} className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="profile" />
          </Link>
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
            onClick={() => setMobileNavOpen(true)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </motion.header>

      {/* 모바일 네비 드로어 */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={STANDARD_SPRING}
              className="fixed right-0 top-0 h-full w-72 z-[70] flex flex-col"
              style={{ background: "var(--drawer-bg)", backdropFilter: "var(--glass-blur)" }}
            >
              <div className="flex items-center justify-between px-6 h-16 shrink-0">
                <ClimaLogo />
                <button onClick={() => setMobileNavOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-low">
                   <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 flex flex-col px-4 py-4 gap-1">
                <HeaderNav items={getNavItems(userRole, managedTeamId)} teamId={teamId} mobile onNavigate={() => setMobileNavOpen(false)} />
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="pt-24 px-4 md:px-8 max-w-[1600px] mx-auto pb-12">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.05 }}
          className="rounded-[2rem] p-4 md:p-6"
          style={{ background: "var(--panel-tint)" }}
        >
          <section className="mb-6 rounded-[2rem] p-6 md:p-8" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 50%, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 100%)" }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-primary mb-2">월간 리포트</h1>
                <p className="text-lg font-bold opacity-70" style={{ color: "var(--text-soft)" }}>{monthLabel} · 팀 인사이트</p>
              </div>
              <div className="flex items-center gap-4">
                <PrimaryTabToggle
                  tabs={[
                    { value: "0", label: "이번 달" },
                    { value: "-1", label: "지난 달" },
                  ]}
                  active={monthOffset.toString()}
                  onChange={(v) => setMonthOffset(parseInt(v))}
                />
              </div>
            </div>

            {stats && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">월간 평균</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-primary">{totalAvg}pt</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">지난달 대비 {totalAvg && totalAvg > 60 ? "안정적" : "주의 요망"}</p>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">최고의 날</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-primary">{stats.highest}pt</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">{stats.highestDay.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">에너지 안정성</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-tertiary">{stats.stability}</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">일자별 점수 변동폭 기준</p>
                </div>
                <div className="rounded-[1.5rem] bg-surface-low p-5">
                  <SectionLabel color="muted">주요 날씨</SectionLabel>
                  <div className="mt-1 text-3xl font-black text-secondary">{stats.distribution[0]?.pct}%</div>
                  <p className="mt-2 text-xs font-semibold opacity-60">{WEATHER_LABELS[stats.distribution[0]?.status] || stats.distribution[0]?.status}이 가장 많았어요</p>
                </div>
              </div>
            )}
          </section>

          <section className="mb-8 grid gap-6 lg:grid-cols-3">
             <div className="lg:col-span-2 rounded-[2rem] bg-[var(--panel-strong)] p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <SectionLabel color="primary">팀 에너지 트렌드</SectionLabel>
                  <span className="text-xs font-bold opacity-40">일자별 팀 평균 점수</span>
                </div>
                <div className="h-40 w-full">
                  <MoodTrendChart 
                    scores={averageRow.map(r => r.score)} 
                    height={160} 
                    className="w-full"
                  />
                </div>
             </div>
             <div className="rounded-[2rem] bg-[var(--panel-strong)] p-6 shadow-sm">
                <SectionLabel color="primary" className="mb-4">날씨 분포</SectionLabel>
                <div className="space-y-3">
                  {stats?.distribution.map(({ status, pct }) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-16 text-xs font-bold opacity-60">{WEATHER_LABELS[status] || status}</div>
                      <div className="flex-1 h-2 bg-surface-low rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-primary"
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-black">{pct}%</div>
                    </div>
                  ))}
                </div>
             </div>
          </section>

          <section className="rounded-[2rem] bg-[var(--surface-lowest)] border border-[var(--border-subtle)] overflow-hidden shadow-xl">
             <div className="overflow-x-auto scrollbar-hide overscroll-contain">
               <div style={{ minWidth: monthDays.length * 70 + 140 }}>
                 <NikoGridHeader
                    days={monthDays.map(d => ({ label: DAY_LABELS[d.getDay()], date: d }))}
                    todayIso={todayIso}
                    colTemplate={colTemplate}
                 />
                 <div className="flex flex-col gap-2 p-2">
                    <NikoSummaryRow
                      week={averageRow}
                      todayIndex={monthDays.findIndex(d => isoDate(d) === todayIso)}
                      colTemplate={colTemplate}
                      loading={loading}
                      label="팀 전체 평균"
                      subtitle="일자별 평균"
                    />
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <NikoMemberRow
                          key={i}
                          name=""
                          week={Array.from({ length: monthDays.length }).map(() => ({ status: null, score: null }))}
                          todayIndex={-1}
                          colTemplate={colTemplate}
                          loading
                        />
                      ))
                    ) : (
                      calendarMembers.map((member) => (
                        <NikoMemberRow
                          key={member.id}
                          avatarEmoji={member.avatarEmoji}
                          name={member.name}
                          week={member.week}
                          todayIndex={monthDays.findIndex(d => isoDate(d) === todayIso)}
                          colTemplate={colTemplate}
                        />
                      ))
                    )}
                 </div>
               </div>
             </div>
          </section>

          <WeatherLegend className="mt-8 px-4" />
        </motion.main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ClimaLogo from "../components/WetherLogo";
import ThemeToggleButton from "../components/ThemeToggleButton";
import HeaderNav from "../components/HeaderNav";
import NotificationBell from "../components/NotificationBell";
import { getNavItems } from "../../lib/nav-items";
import { getUserSession, type UserRole } from "../../lib/auth";
import DynamicBackground from "../components/DynamicBackground";
import { SectionLabel, ViewModeToggle, UserAvatar, TopIcon, PrimaryTabToggle } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { MoodTrendChart } from "../components/MoodTrendChart";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, statusToKo, type WeatherStatus } from "../../lib/mood";
import { DEMO_USER_ID, DEMO_USER, getDemoSnapshotDate } from "../../lib/demo-data";
import { STANDARD_SPRING, RESPONSIVE_SPRING } from "../constants/springs";
import { displayName as getDisplayName } from "../../lib/user";

interface MoodLog {
  score: number;
  message: string | null;
  logged_at: string;
}

interface UserData {
  id: string;
  name: string;
  nickname?: string | null;
  avatar_emoji: string;
  mood_logs: MoodLog[];
}

const DAY_LABELS = ["월", "화", "수", "목", "금"];


function getTodayKst(referenceDate: Date): string {
  return referenceDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function getWeekMonday(referenceDate: Date): Date {
  const today = new Date(getTodayKst(referenceDate));
  const dow = today.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  today.setDate(today.getDate() + diff);
  return today;
}

function getWeekDays(referenceDate: Date): Date[] {
  const monday = getWeekMonday(referenceDate);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthDays(year: number, month: number): Date[] {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const WEATHER_LABELS: Record<string, string> = {
  Sunny: "맑음",
  PartlyCloudy: "구름조금",
  Cloudy: "흐림",
  Rainy: "비",
  Stormy: "뇌우",
};

function isoDate(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function getWeeklyLogs(logs: MoodLog[], referenceDate: Date): (MoodLog | null)[] {
  const days = getWeekDays(referenceDate);
  return days.map((day) => {
    const iso = isoDate(day);
    return logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === iso
    ) ?? null;
  });
}

function getWeekRangeLabel(referenceDate: Date): string {
  const days = getWeekDays(referenceDate);
  const start = days[0].toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  const end = days[4].toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  return `${start} — ${end}`;
}

function getTodayWeekIndex(referenceDate: Date): number {
  const today = getTodayKst(referenceDate);
  return getWeekDays(referenceDate).findIndex((d) => isoDate(d) === today);
}

// 최근 N개의 평일(월~금) 로그 수집
function getRecentLogs(logs: MoodLog[], count: number, referenceDate: Date): { score: number | null, date: Date }[] {
  const result: { score: number | null, date: Date }[] = [];
  let d = new Date(referenceDate);
  
  while (result.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // 0=일요일, 6=토요일 제외
      const iso = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
      const found = logs.find((l) =>
        new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === iso
      );
      result.unshift({ score: found?.score ?? null, date: new Date(d) });
    }
    d.setDate(d.getDate() - 1);
  }
  return result;
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
      <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10.5h17" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 16.5 9 11l4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function withTeamParam(href: string, teamId: string | null): string {
  if (!teamId) return href;
  const [path, existing] = href.split("?");
  const params = new URLSearchParams(existing ?? "");
  params.set("team", teamId);
  return `${path}?${params.toString()}`;
}

export default function PersonalPageClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"icon" | "chart">("icon");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    getUserSession().then((s) => {
      setUserRole(s?.role ?? null);
      setManagedTeamId(s?.managedTeamId ?? null);
    });
  }, []);

  useEffect(() => {
    async function load() {
      if (userId === DEMO_USER_ID) {
        setUser({ id: DEMO_USER_ID, ...DEMO_USER });
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("id, name, nickname, avatar_emoji, mood_logs (score, message, logged_at)")
        .eq("id", userId)
        .order("logged_at", { referencedTable: "mood_logs", ascending: false })
        .limit(100, { referencedTable: "mood_logs" })
        .single();
      if (data) setUser(data as UserData);
      setLoading(false);
    }
    load();
  }, [userId]);

  const currentDate = userId === DEMO_USER_ID ? getDemoSnapshotDate() : new Date();
  const todayKst = getTodayKst(currentDate);
  const todayLabel = currentDate.toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const weeklyLogs = useMemo(
    () => (user ? getWeeklyLogs(user.mood_logs, currentDate) : Array.from({ length: 5 }, () => null)),
    [currentDate, user]
  );
  const recentTrendData = useMemo(
    () => (user ? getRecentLogs(user.mood_logs, 14, currentDate) : Array.from({ length: 14 }, (_, i) => ({ score: null, date: new Date(currentDate) }))),
    [currentDate, user]
  );
  const todayLog = useMemo(
    () => user?.mood_logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKst
    ) ?? null,
    [todayKst, user]
  );

  const todayScore = todayLog?.score ?? null;
  const todayStatus: WeatherStatus | null = todayScore !== null ? scoreToStatus(todayScore) : null;
  const todayIndex = getTodayWeekIndex(currentDate);

  const weeklyScores = weeklyLogs.flatMap((l) => (l ? [l.score] : []));
  const weekAverage = weeklyScores.length
    ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length)
    : null;

  // 전주 같은 요일 점수 (비교용) — 7일 전 기록
  const prevWeekSameDay = useMemo(() => {
    if (!user || todayIndex < 0) return null;
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    const iso = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    return user.mood_logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === iso
    )?.score ?? null;
  }, [currentDate, todayIndex, user]);

  const deltaVsLastWeek = todayScore !== null && prevWeekSameDay !== null
    ? todayScore - prevWeekSameDay
    : null;

  const monthDays = useMemo(() => {
    const target = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    return getMonthDays(target.getFullYear(), target.getMonth());
  }, [currentDate, monthOffset]);

  const monthLabel = useMemo(() => {
    const target = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    return `${target.getFullYear()}년 ${target.getMonth() + 1}월`;
  }, [currentDate, monthOffset]);

  const personalStats = useMemo(() => {
    if (!user) return null;
    const currentMonthDays = monthDays.map(d => isoDate(d));
    const monthLogs = user.mood_logs.filter(l => currentMonthDays.includes(isoDate(new Date(l.logged_at))));
    if (monthLogs.length === 0) return null;

    const scores = monthLogs.map(l => l.score);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    
    const counts: Record<string, number> = {};
    monthLogs.forEach(l => {
      const status = scoreToStatus(l.score);
      counts[status] = (counts[status] || 0) + 1;
    });
    const topStatus = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as WeatherStatus;

    const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    const stability = stdDev < 10 ? "매우 높음" : stdDev < 20 ? "높음" : "변동성 있음";

    // 요일별 분석 (KST 기준)
    const dayStats: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    monthLogs.forEach(l => {
      const d = new Date(l.logged_at);
      // KST 변환
      const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
      const dow = kst.getUTCDay();
      if (dow >= 1 && dow <= 5) {
        dayStats[dow].push(l.score);
      }
    });

    const dayAvgs = Object.entries(dayStats).map(([dow, scs]) => ({
      dow: parseInt(dow),
      avg: scs.length > 0 ? Math.round(scs.reduce((a, b) => a + b, 0) / scs.length) : null,
      count: scs.length
    })).filter(d => d.avg !== null);

    const bestDay = [...dayAvgs].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))[0];
    const toughestDay = [...dayAvgs].sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0))[0];

    // 요일별 변동성 계산 (가장 기복이 심한 요일)
    const dayVolatilities = Object.entries(dayStats).map(([dow, scs]) => {
      if (scs.length < 2) return { dow: parseInt(dow), stdDev: 0 };
      const dAvg = scs.reduce((a, b) => a + b, 0) / scs.length;
      const dVar = scs.reduce((a, b) => a + Math.pow(b - dAvg, 2), 0) / scs.length;
      return { dow: parseInt(dow), stdDev: Math.sqrt(dVar) };
    }).filter(d => d.stdDev > 0);
    const mostVolatileDay = [...dayVolatilities].sort((a, b) => b.stdDev - a.stdDev)[0];

    // 월간 모멘텀 (전반부 vs 후반부 비교)
    const midIdx = Math.floor(monthLogs.length / 2);
    const firstHalf = monthLogs.slice(0, midIdx).map(l => l.score);
    const secondHalf = monthLogs.slice(midIdx).map(l => l.score);
    let momentum = "stable";
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const fAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const sAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const diff = sAvg - fAvg;
      if (diff > 8) momentum = "rising";
      else if (diff < -8) momentum = "falling";
      else {
        // 보합 상태 내 세분화
        if (avg >= 75) momentum = "high-stable";
        else if (avg <= 45) momentum = "low-stable";
        else momentum = "stable";
      }
    }

    return { avg, topStatus, stability, bestDay, toughestDay, mostVolatileDay, momentum };
  }, [user, monthDays]);

  const monthGridItems = useMemo(() => {
    if (monthDays.length === 0) return [];
    const firstDay = monthDays[0];
    const firstDow = firstDay.getDay(); // 1=Mon, 2=Tue...
    const placeholders = firstDow > 1 ? Array.from({ length: firstDow - 1 }) : [];
    return [...placeholders, ...monthDays];
  }, [monthDays]);

  const StatusIcon = todayStatus ? WEATHER_ICON_MAP[todayStatus] : null;

  const insightText = todayScore === null
    ? "오늘 체크인을 남기면 팀 화면과 개인 현황이 같은 용어로 바로 정리돼요."
    : todayScore >= 81
      ? "에너지가 충분한 날이에요. 너무 과열되지 않게 속도를 조절하면 좋아요."
      : todayScore >= 61
        ? "안정적으로 집중하기 좋은 흐름이에요. 오늘 잘 된 포인트를 유지해 보세요."
        : todayScore >= 41
          ? "조금 흐릿한 날이에요. 우선순위를 줄이고 회복 시간을 먼저 챙기는 편이 좋아요."
          : "지금은 무리해서 끌고 가기보다 주변에 도움을 요청하는 편이 좋아 보여요.";

  const bgScore = todayScore ?? 55;

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--hero-gradient)" }}>
        <DynamicBackground score={55} />
        
        {/* Skeleton Header */}
        <div className="fixed top-4 left-0 w-full z-50 px-4 md:px-8">
          <div className="mx-auto max-w-[1200px] h-16 rounded-[2rem] bg-surface-lowest/30 backdrop-blur-md border border-white/10 animate-pulse flex items-center justify-between px-6">
            <div className="h-8 w-32 bg-surface-high/40 rounded-xl" />
            <div className="flex gap-3">
              <div className="h-10 w-10 bg-surface-high/40 rounded-2xl" />
              <div className="h-10 w-10 bg-surface-high/40 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="pt-24 px-4 md:px-8 max-w-[1200px] mx-auto pb-12 relative z-10">
          <div className="flex flex-col gap-8">
            <div className="h-[400px] w-full rounded-[3rem] bg-surface-lowest/20 backdrop-blur-xl border border-white/10 animate-pulse p-10">
              <div className="h-8 w-64 bg-surface-high/40 rounded-xl mb-10" />
              <div className="grid grid-cols-5 gap-6">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="aspect-square rounded-[2rem] bg-surface-high/20" />
                ))}
              </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 h-[450px] rounded-[3rem] bg-surface-lowest/20 animate-pulse" />
              <div className="h-[450px] rounded-[3rem] bg-surface-lowest/30 animate-pulse border border-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = getNavItems(userRole, managedTeamId);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--hero-gradient)" }}>
      <DynamicBackground score={bgScore} />

      {/* 헤더 */}
      <div className="fixed top-4 left-0 w-full z-50 px-4 md:px-8 pointer-events-none">
        <motion.header
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={RESPONSIVE_SPRING}
          className="mx-auto max-w-[1200px] h-16 px-6 flex items-center justify-between rounded-[2rem] pointer-events-auto clay-card overflow-hidden"
          style={{ 
            background: "var(--header-bg)", 
            backdropFilter: "var(--glass-blur-medium)",
          }}
        >
          <div className="glossy-overlay opacity-20" />
          
          <div className="relative z-10 flex items-center gap-6 md:gap-10">
            <motion.div 
              whileHover={{ rotateX: 10, rotateY: 10, scale: 1.1 }}
              transition={RESPONSIVE_SPRING}
            >
              <Link href="/" className="flex shrink-0 items-center"><ClimaLogo /></Link>
            </motion.div>
            <nav className="hidden md:flex items-center gap-1.5">
              <HeaderNav items={navItems} teamId={userId === DEMO_USER_ID ? "demo" : null} />
            </nav>
          </div>

          <div className="relative z-10 flex items-center gap-3" style={{ color: "var(--header-action-color)" }}>
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-2">
              <ThemeToggleButton />
              <NotificationBell />
            </motion.div>
            
            <div className="h-8 w-[1px] bg-border-subtle mx-1 hidden md:block" />
            
            <Link
              href="/settings"
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-2xl transition-all hover:bg-surface-low hover:shadow-inner-soft group"
              aria-label="설정"
            >
              <motion.div whileHover={{ rotate: 90 }} transition={RESPONSIVE_SPRING}>
                <TopIcon type="settings" />
              </motion.div>
            </Link>
            
            <motion.div 
              whileHover={{ scale: 1.1, y: -2 }}
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-2xl overflow-hidden bg-surface-lowest shadow-level-1 border border-white/10"
            >
              <UserAvatar name={user?.name ?? "User"} avatarEmoji={user?.avatar_emoji} size={32} fallbackTextClassName="text-sm font-black" />
            </motion.div>

            <button
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-2xl transition-colors hover:bg-surface-low"
              onClick={() => setMobileNavOpen(true)}
              aria-label="메뉴 열기"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </motion.header>
      </div>

      {/* 모바일 드로어 */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={STANDARD_SPRING}
              className="fixed right-0 top-0 h-full w-72 z-[70] flex flex-col"
              style={{ background: "var(--drawer-bg)", backdropFilter: "var(--glass-blur)" }}
            >
              <div className="flex items-center justify-between px-6 h-16 shrink-0">
                <ClimaLogo />
                <button onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-low transition-colors"
                  style={{ color: "var(--text-soft)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 flex flex-col px-4 py-4 gap-1">
                <HeaderNav items={navItems} teamId={userId === DEMO_USER_ID ? "demo" : null} mobile onNavigate={() => setMobileNavOpen(false)} />
                <Link
                  href="/settings"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-[1.5rem] px-5 py-4 text-base font-semibold tracking-tight transition-all duration-200"
                  style={{ color: "var(--text-muted)" }}
                >
                  설정
                </Link>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="pt-20 px-4 md:px-8 max-w-[1200px] mx-auto pb-12">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.08 }}
          className="rounded-[1.8rem] md:rounded-[2rem] px-3 py-3 md:px-5 md:py-5"
          style={{ background: "var(--panel-tint)" }}
        >
          {/* 히어로 섹션 */}
          <section
            className="mb-5 rounded-[1.9rem] px-4 py-5 md:rounded-[2.25rem] md:px-7 md:py-8"
            style={{
              background: "linear-gradient(90deg, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 50%, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 100%)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-primary md:text-[3.1rem]">
                  개인 현황
                </h1>
                <p className="mt-1 text-sm font-bold" style={{ color: "var(--text-soft)" }}>
                  {todayLabel}
                </p>
                <p className="mt-3 text-base leading-relaxed md:text-lg" style={{ color: "var(--text-muted)" }}>
                  {insightText}
                </p>
              </div>
              <div
                className="flex items-center gap-3 self-start rounded-[1.5rem] px-4 py-3"
                style={{ background: "var(--surface-overlay)", boxShadow: "var(--shadow-level-1)" }}
              >
                <UserAvatar name={user ? getDisplayName(user) : "User"} avatarEmoji={user?.avatar_emoji} size={44} fallbackTextClassName="text-base font-black" />
                <div>
                  <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                    {user ? getDisplayName(user) : "—"}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                    {todayStatus ? statusToKo(todayStatus) : "오늘 미기록"}
                  </p>
                </div>
                {StatusIcon && (
                  <div className="ml-1">
                    <StatusIcon size={32} />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 스탯 카드 4개 */}
          <section className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: "오늘 지수",
                value: todayScore !== null ? `${todayScore}pt` : "—",
              },
              {
                label: "오늘 상태",
                value: statusToKo(todayStatus),
              },
              {
                label: "이번 주 평균",
                value: weekAverage !== null ? `${weekAverage}pt` : "—",
              },
              {
                label: "지난 주 같은 요일 대비",
                value: deltaVsLastWeek !== null
                  ? `${deltaVsLastWeek > 0 ? "+" : ""}${deltaVsLastWeek}pt`
                  : "—",
                color: deltaVsLastWeek === null ? undefined : deltaVsLastWeek > 0 ? "var(--primary)" : deltaVsLastWeek < 0 ? "var(--tertiary)" : undefined,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[1.5rem] px-4 py-4"
                style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
              >
                <SectionLabel color="muted">{stat.label}</SectionLabel>
                <div
                  className="mt-1 text-xl font-black"
                  style={{ color: stat.color ?? "var(--primary)" }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </section>

          {/* 이번 주 흐름 */}
          <section
            className="mb-5 rounded-[2rem] px-3 py-4 md:rounded-[2.5rem] md:px-6 md:py-6"
            style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
          >
            <div className="mb-5 flex flex-col gap-4 lg:mb-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-primary">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-base font-black tracking-tight text-primary md:text-[1.1rem]">
                    이번 주 흐름
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                    {getWeekRangeLabel(currentDate)}
                  </p>
                </div>
              </div>
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {/* 요일 헤더 */}
            <div
              className="grid gap-2 mb-2"
              style={{ gridTemplateColumns: `repeat(5, 1fr)` }}
            >
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span
                    className="text-[10px] font-black tracking-widest"
                    style={{ color: i === todayIndex ? "var(--primary)" : "var(--text-soft)", opacity: i === todayIndex ? 1 : 0.6 }}
                  >
                    {day}
                  </span>
                  {/* 오늘 표시 도트 */}
                  <div
                    className="h-1 w-5 rounded-full transition-colors"
                    style={{ background: i === todayIndex ? "var(--primary)" : "transparent" }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {viewMode === "icon" ? (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={RESPONSIVE_SPRING}
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(5, 1fr)` }}
                >
                  {weeklyLogs.map((log, i) => {
                    const status = log ? scoreToStatus(log.score) : null;
                    const Icon = status ? WEATHER_ICON_MAP[status] : null;
                    const isToday = i === todayIndex;
                    return (
                      <div
                        key={i}
                        className="flex h-[60px] flex-col items-center justify-center rounded-[1.3rem] gap-1"
                        style={{
                          background: isToday
                            ? "color-mix(in srgb, var(--primary) 8%, var(--surface-lowest))"
                            : "color-mix(in srgb, var(--surface-lowest) 70%, transparent)",
                        }}
                      >
                        {Icon
                          ? <Icon size={30} />
                          : <div className="h-7 w-7 rounded-full" style={{ background: "var(--surface-container-high)" }} />
                        }
                        {log?.score != null && (
                          <span className="text-[9px] font-black" style={{ color: "var(--text-soft)" }}>
                            {log.score}pt
                          </span>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={RESPONSIVE_SPRING}
                  className="h-[60px]"
                >
                  <MoodTrendChart
                    scores={weeklyLogs.map((l) => l?.score ?? null)}
                    height={64}
                    className="w-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* 월간 기분 분석 */}
          <section
            className="rounded-[3rem] px-4 py-8 md:px-10 md:py-12 relative overflow-hidden clay-card"
            style={{ 
              background: "var(--panel-strong)", 
            }}
          >
            <div className="glossy-overlay opacity-30" />
            
            <div className="relative z-10">
              <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <motion.div 
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary shadow-inner-soft"
                  >
                    <TrendIcon />
                  </motion.div>
                  <div>
                    <p className="text-xl font-black tracking-tight text-primary md:text-[1.5rem]">
                      월간 기분 분석
                    </p>
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1">
                      {monthLabel} · Personal Deep Insight
                    </p>
                  </div>
                </div>
                <PrimaryTabToggle
                  tabs={[
                    { value: "0", label: "이번 달" },
                    { value: "-1", label: "지난 달" },
                  ]}
                  active={monthOffset.toString()}
                  onChange={(v) => setMonthOffset(parseInt(v))}
                />
              </div>

              <div className="grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="mb-6 flex items-center justify-between px-2">
                    <SectionLabel color="muted">기분 캘린더</SectionLabel>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-lowest shadow-level-1 text-[10px] font-black opacity-60">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]" />
                      Check-in Active
                    </div>
                  </div>
                  
                  {/* 월간 그리드 (5열 요일 기준) */}
                  <div className="grid grid-cols-5 gap-4">
                     {DAY_LABELS.map(day => (
                      <div key={day} className="text-center text-[12px] font-black opacity-20 pb-2 uppercase tracking-[0.2em]">{day}</div>
                    ))}
                    {monthGridItems.map((item, i) => {
                      if (!item) return <div key={`empty-${i}`} className="aspect-square opacity-0" />;
                      
                      const day = item as Date;
                      const iso = isoDate(day);
                      const log = user?.mood_logs.find(l => isoDate(new Date(l.logged_at)) === iso);
                      const status = log ? scoreToStatus(log.score) : null;
                      const Icon = status ? WEATHER_ICON_MAP[status] : null;
                      const isToday = iso === todayKst;
                      
                      return (
                        <motion.div 
                          key={i} 
                          whileHover={{ scale: 1.08, y: -6, rotateX: 5, rotateY: 5, z: 50 }}
                          transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          className="relative aspect-square flex flex-col items-center justify-center rounded-[2rem] transition-all pt-2 group cursor-pointer clay-card"
                          style={{ 
                            background: isToday ? "rgba(var(--primary-rgb), 0.15)" : "var(--surface-lowest)",
                            borderColor: isToday ? "var(--primary)" : "rgba(255, 255, 255, 0.4)",
                            perspective: "1000px",
                            transformStyle: "preserve-3d"
                          }}
                        >
                          <span className="absolute top-3 left-4 text-[11px] font-black opacity-10 group-hover:opacity-40 transition-opacity" style={{ transform: "translateZ(20px)" }}>{day.getDate()}</span>
                          {Icon ? (
                            <div style={{ transform: "translateZ(30px)" }}>
                              <Icon size={40} className="drop-shadow-2xl" />
                            </div>
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-surface-high opacity-20" style={{ transform: "translateZ(10px)" }} />
                          )}
                          {log && (
                            <span className="mt-2 text-[11px] font-black opacity-30 group-hover:opacity-80 transition-opacity" style={{ transform: "translateZ(20px)" }}>{log.score}</span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-8">
                  <motion.div 
                    whileHover={{ y: -10, rotateY: -3, rotateX: 2 }}
                    className="rounded-[3rem] p-8 relative overflow-hidden group clay-card"
                    style={{ 
                      background: "var(--surface-container-low)", 
                    }}
                  >
                    <div className="glossy-overlay opacity-40 group-hover:opacity-60" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <SectionLabel color="primary">월간 분석 리포트</SectionLabel>
                        {personalStats && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black tracking-widest shadow-level-2 ${
                              personalStats.momentum === "rising" ? "bg-primary text-white" : 
                              personalStats.momentum === "falling" ? "bg-tertiary text-white" : 
                              personalStats.momentum === "high-stable" ? "bg-secondary text-white" :
                              personalStats.momentum === "low-stable" ? "bg-amber-500 text-white" :
                              "bg-surface-high text-on-surface/60"
                            }`}
                          >
                            {personalStats.momentum === "rising" ? "📈 상승세" : 
                             personalStats.momentum === "falling" ? "📉 하락세" : 
                             personalStats.momentum === "high-stable" ? "✨ 고점유지" :
                             personalStats.momentum === "low-stable" ? "⚠️ 주의단계" :
                             "➡️ 안정적"}
                          </motion.div>
                        )}
                      </div>

                      {personalStats ? (
                        <>
                          <div className="space-y-10">
                          <div className="flex items-end gap-4">
                            <div className="flex-1">
                              <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em] mb-3">평균 점수</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-black text-primary tracking-tighter drop-shadow-xl">{personalStats.avg}</span>
                                <span className="text-lg font-bold opacity-20 uppercase tracking-widest">pt</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em] mb-3">기분 안정성</p>
                              <p className="text-lg font-black text-secondary tracking-tight">{personalStats.stability}</p>
                            </div>
                          </div>

                          <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-white/20 to-transparent shadow-inner-soft">
                            <div className="p-6 rounded-[2.4rem] bg-surface-lowest/40 backdrop-blur-xl">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2.5 flex-[1.2] min-w-0">
                                  <motion.div 
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                    className="h-10 w-10 rounded-2xl bg-surface-lowest flex items-center justify-center shadow-level-2 flex-shrink-0"
                                  >
                                    {(() => {
                                      const Icon = WEATHER_ICON_MAP[personalStats.topStatus];
                                      return <Icon size={24} />;
                                    })()}
                                  </motion.div>
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5 whitespace-nowrap">최다 기분</p>
                                    <p className="text-[13px] font-black whitespace-nowrap">{WEATHER_LABELS[personalStats.topStatus]}</p>
                                  </div>
                                </div>
                                
                                <div className="h-8 w-[1px] bg-white/10 flex-shrink-0 mx-1" />
                                
                                <div className="flex items-center gap-2.5 flex-[1.3] min-w-0 justify-end">
                                  <div className="min-w-0 text-right">
                                    <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5 whitespace-nowrap">최고의 요일</p>
                                    <p className="text-[13px] font-black whitespace-nowrap">{DAY_LABELS[personalStats.bestDay?.dow! - 1] || "—"}요일</p>
                                  </div>
                                  <motion.div 
                                    whileHover={{ scale: 1.2, rotate: -10 }}
                                    className="h-10 w-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-level-1 flex-shrink-0"
                                  >
                                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M12 8v4l3 3" strokeLinecap="round" />
                                      <circle cx="12" cy="12" r="9" />
                                    </svg>
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-5">
                             <div className="flex items-center gap-2">
                               <p className="text-[11px] font-black opacity-30 uppercase tracking-[0.2em]">요일별 패턴 분석</p>
                               <div className="group/tooltip relative">
                                 <div className="cursor-help opacity-30 hover:opacity-100 transition-opacity p-1">
                                   <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                                     <circle cx="12" cy="12" r="10" />
                                     <path d="M12 16v-4M12 8h.01" />
                                   </svg>
                                 </div>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 p-5 rounded-[2rem] bg-surface-overlay border border-white/20 shadow-level-4 opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-all z-30 scale-90 group-hover/tooltip:scale-100 origin-bottom backdrop-blur-2xl">
                                   <p className="text-sm font-black text-primary mb-2 text-center">패턴 분석 규칙</p>
                                   <p className="text-xs leading-relaxed text-on-surface/70 text-center">
                                     선택한 월의 데이터를 요일별로 그룹화하여 <strong className="text-primary">평균 점수</strong>가 가장 높은 날과 낮은 날을 선정합니다.
                                   </p>
                                   <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-[8px] border-transparent border-t-surface-overlay" />
                                 </div>
                               </div>
                             </div>
                          </div>

                             <div className="grid grid-cols-2 gap-4">
                                <motion.div 
                                  whileHover={{ scale: 1.05, y: -4 }}
                                  className="p-4 rounded-[2rem] bg-surface-lowest shadow-level-2 hover:shadow-level-3 transition-all min-w-0"
                                >
                                  <p className="text-[9px] font-black opacity-30 mb-2 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">기복 심한 요일</p>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[13px] font-black whitespace-nowrap">{personalStats.mostVolatileDay ? `${DAY_LABELS[personalStats.mostVolatileDay.dow - 1]}요일` : "—"}</span>
                                    {personalStats.mostVolatileDay && (
                                      <span className="text-[9px] font-black text-tertiary bg-tertiary/10 px-1.5 py-0.5 rounded-md flex-shrink-0">±{Math.round(personalStats.mostVolatileDay.stdDev)}</span>
                                    )}
                                  </div>
                                </motion.div>
                                <motion.div 
                                  whileHover={{ scale: 1.05, y: -4 }}
                                  className="p-4 rounded-[2rem] bg-surface-lowest shadow-level-2 hover:shadow-level-3 transition-all min-w-0"
                                >
                                  <p className="text-[9px] font-black opacity-30 mb-2 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">가장 힘든 요일</p>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[13px] font-black whitespace-nowrap">{personalStats.toughestDay ? `${DAY_LABELS[personalStats.toughestDay.dow - 1]}요일` : "—"}</span>
                                    {personalStats.toughestDay && (
                                      <span className="text-[10px] font-black opacity-20 flex-shrink-0">{personalStats.toughestDay.avg}pt</span>
                                    )}
                                  </div>
                                </motion.div>
                             </div>
                          </div>

                          <div className="pt-8">
                            <div className="rounded-[2.5rem] bg-surface-high/20 p-8 relative border border-white/10 shadow-inner-soft mt-2">
                              <div className="absolute top-0 left-8 -translate-y-1/2 px-4 py-1.5 rounded-full bg-primary text-[10px] font-black text-white uppercase tracking-[0.3em] shadow-level-3 z-20">Deep Insight</div>
                              {/* 인사이트 배경 장식 */}
                              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary/15 blur-3xl rounded-full" />
                              
                              <div className="relative z-10 text-[13px] font-medium leading-[1.8] tracking-tight text-on-surface/90">
                                {personalStats.bestDay && personalStats.toughestDay && (
                                  <>
                                    <strong className="text-primary">{new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset).getMonth() + 1}월</strong>은 주로 <strong className="text-secondary">{DAY_LABELS[personalStats.bestDay.dow - 1]}요일</strong>에 에너지가 좋았고, 
                                    <strong>{DAY_LABELS[personalStats.toughestDay.dow - 1]}요일</strong>은 조금 힘든 경향이 있었네요.
                                    {personalStats.mostVolatileDay && (
                                      <div className="mt-5 p-5 rounded-[1.5rem] bg-white/30 backdrop-blur-md text-[12px] border border-white/20 shadow-level-1">
                                        특히 <strong>{DAY_LABELS[personalStats.mostVolatileDay.dow - 1]}요일</strong>은 기분 변화가 큰 편이니 집중이 필요한 작업은 다른 요일로 분산해 보는 건 어떨까요?
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="py-32 flex flex-col items-center justify-center gap-6 opacity-10">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="h-20 w-20 rounded-[2.5rem] border-4 border-dashed border-current flex items-center justify-center"
                          >
                             <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.5">
                               <path d="M12 8v4l3 3" strokeLinecap="round" />
                               <circle cx="12" cy="12" r="9" />
                             </svg>
                          </motion.div>
                          <p className="text-md font-black tracking-[0.4em] uppercase">Processing Core...</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        </motion.main>
      </div>
    </div>
  );
}

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
import { SectionLabel, ViewModeToggle, UserAvatar } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { MoodTrendChart } from "../components/MoodTrendChart";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, statusToKo, type WeatherStatus } from "../../lib/mood";
import { DEMO_USER_ID, DEMO_USER } from "../../lib/demo-data";
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

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];


function getTodayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function getWeekMonday(): Date {
  const today = new Date(getTodayKst());
  const dow = today.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  today.setDate(today.getDate() + diff);
  return today;
}

function getWeekDays(): Date[] {
  const monday = getWeekMonday();
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isoDate(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function getWeeklyLogs(logs: MoodLog[]): (MoodLog | null)[] {
  const days = getWeekDays();
  return days.map((day) => {
    const iso = isoDate(day);
    return logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === iso
    ) ?? null;
  });
}

function getWeekRangeLabel(): string {
  const days = getWeekDays();
  const start = days[0].toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  const end = days[4].toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  return `${start} — ${end}`;
}

function getTodayWeekIndex(): number {
  const today = getTodayKst();
  return getWeekDays().findIndex((d) => isoDate(d) === today);
}

// 최근 N일 추이 (개인 이력 차트용)
function getRecentLogs(logs: MoodLog[], days: number): (MoodLog | null)[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const iso = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    return logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === iso
    ) ?? null;
  });
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

export default function PersonalPageClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"icon" | "chart">("icon");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [managedTeamId, setManagedTeamId] = useState<string | null>(null);

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
        .limit(30, { referencedTable: "mood_logs" })
        .single();
      if (data) setUser(data as UserData);
      setLoading(false);
    }
    load();
  }, [userId]);

  const todayKst = getTodayKst();
  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  });

  const weeklyLogs = useMemo(
    () => (user ? getWeeklyLogs(user.mood_logs) : Array.from({ length: 5 }, () => null)),
    [user]
  );
  const recentLogs = useMemo(
    () => (user ? getRecentLogs(user.mood_logs, 14) : Array.from({ length: 14 }, () => null)),
    [user]
  );
  const todayLog = useMemo(
    () => user?.mood_logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKst
    ) ?? null,
    [todayKst, user]
  );

  const todayScore = todayLog?.score ?? null;
  const todayStatus: WeatherStatus | null = todayScore !== null ? scoreToStatus(todayScore) : null;
  const todayIndex = getTodayWeekIndex();

  const weeklyScores = weeklyLogs.flatMap((l) => (l ? [l.score] : []));
  const weekAverage = weeklyScores.length
    ? Math.round(weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length)
    : null;

  // 전주 같은 요일 점수 (비교용) — 7일 전 기록
  const prevWeekSameDay = useMemo(() => {
    if (!user || todayIndex < 0) return null;
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const iso = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    return user.mood_logs.find((l) =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === iso
    )?.score ?? null;
  }, [user, todayIndex]);

  const deltaVsLastWeek = todayScore !== null && prevWeekSameDay !== null
    ? todayScore - prevWeekSameDay
    : null;

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
      <div className="relative min-h-screen" style={{ background: "var(--hero-gradient)" }}>
        <DynamicBackground score={55} />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="h-48 w-full max-w-lg animate-pulse rounded-[2rem] bg-surface-container mx-4" />
        </div>
      </div>
    );
  }

  const navItems = getNavItems(userRole, managedTeamId);

  return (
    <div className="relative min-h-screen" style={{ background: "var(--hero-gradient)" }}>
      <DynamicBackground score={bgScore} />

      {/* 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-4 md:px-8"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex shrink-0 items-center"><ClimaLogo /></Link>
          <nav className="hidden md:flex items-center gap-1">
            <HeaderNav items={navItems} />
          </nav>
        </div>
        <div className="flex items-center gap-2" style={{ color: "var(--header-action-color)" }}>
          <ThemeToggleButton />
          <NotificationBell />
          <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-surface-high">
            <UserAvatar name={user?.name ?? "User"} avatarEmoji={user?.avatar_emoji} size={32} fallbackTextClassName="text-sm font-black" />
          </div>
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
            onClick={() => setMobileNavOpen(true)}
            aria-label="메뉴 열기"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </motion.header>

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
                <HeaderNav items={navItems} mobile onNavigate={() => setMobileNavOpen(false)} />
                <Link
                  href="/settings/notifications"
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-[1.5rem] px-5 py-4 text-base font-semibold tracking-tight transition-all duration-200"
                  style={{ color: "var(--text-muted)" }}
                >
                  알림 설정
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
                    {getWeekRangeLabel()}
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
                    height={44}
                    className="w-full"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* 최근 2주 추이 */}
          <section
            className="rounded-[2rem] px-3 py-4 md:rounded-[2.5rem] md:px-6 md:py-6"
            style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-primary">
                <TrendIcon />
              </div>
              <div>
                <p className="text-base font-black tracking-tight text-primary md:text-[1.1rem]">
                  최근 2주 추이
                </p>
                <p className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                  일별 점수 변화
                </p>
              </div>
            </div>

            <MoodTrendChart
              scores={recentLogs.map((l) => l?.score ?? null)}
              height={80}
              className="w-full"
            />

            {/* 날짜 레이블 */}
            <div className="mt-3 flex justify-between px-1">
              {recentLogs.map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (13 - i));
                const isToday = i === 13;
                return (
                  <span
                    key={i}
                    className="text-[9px] font-bold"
                    style={{ color: isToday ? "var(--primary)" : "var(--text-soft)", opacity: isToday ? 1 : 0.5 }}
                  >
                    {i % 3 === 0 || isToday ? d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : ""}
                  </span>
                );
              })}
            </div>
          </section>
        </motion.main>
      </div>
    </div>
  );
}

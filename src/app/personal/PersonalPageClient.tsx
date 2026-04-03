"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ClimaLogo from "../components/WetherLogo";
import ThemeToggleButton from "../components/ThemeToggleButton";
import HeaderNav, { type HeaderNavItem } from "../components/HeaderNav";
import DynamicBackground from "../components/DynamicBackground";
import {
  Badge,
  GlassCard,
  MiniStatCard,
  SectionHeader,
  ViewModeToggle,
  UserAvatar,
} from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { MoodTrendChart } from "../components/MoodTrendChart";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, statusToKo, type WeatherStatus } from "../../lib/mood";
import { DEMO_USER_ID, DEMO_USER } from "../../lib/demo-data";
import { STANDARD_SPRING } from "../constants/springs";

interface MoodLog {
  score: number;
  message: string | null;
  logged_at: string;
}

interface UserData {
  id: string;
  name: string;
  avatar_emoji: string;
  mood_logs: MoodLog[];
}

const WEEK_DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const BASE_NAV_ITEMS: HeaderNavItem[] = [
  { label: "홈", href: "/" },
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard", matchPaths: ["/dashboard", "/team"] },
  { label: "Niko-Niko", href: "/niko" },
  { label: "알림", href: "/alerts", disabled: true },
];

function getTodayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

function scoreToOffset(score: number) {
  const circumference = 2 * Math.PI * 88;
  return circumference * (1 - score / 100);
}

function getWeeklyLogs(logs: MoodLog[]): (MoodLog | null)[] {
  const today = new Date(getTodayKst());
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const isoDate = day.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    return logs.find((log) =>
      new Date(log.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === isoDate,
    ) ?? null;
  });
}

function getWeekRangeLabel() {
  const today = new Date(getTodayKst());
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return `${monday.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} — ${sunday.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}`;
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

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 16.5 9 11l4 4 7-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonalHeroCard({
  user,
  todayScore,
  todayStatus,
  insightText,
}: {
  user: UserData;
  todayScore: number | null;
  todayStatus: WeatherStatus | null;
  insightText: string;
}) {
  const circumference = 2 * Math.PI * 88;
  const StatusIcon = todayStatus ? WEATHER_ICON_MAP[todayStatus] : null;

  return (
    <GlassCard className="px-6 py-6 md:px-7 md:py-7" intensity="medium">
      <div className="mb-6 flex items-center justify-between gap-4">
        <SectionHeader
          icon={<TopIcon type="profile" />}
          title="오늘 상태"
          subtitle={todayStatus ? `${statusToKo(todayStatus)} 컨디션이에요` : "아직 오늘 체크인이 없어요"}
        />
        <div className="hidden sm:flex rounded-full bg-surface-highest/80 p-1.5">
          <UserAvatar
            name={user.name}
            avatarEmoji={user.avatar_emoji}
            size={48}
            fallbackTextClassName="text-base font-black"
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex justify-center lg:flex-1">
          {todayScore !== null ? (
            <div className="relative flex h-52 w-52 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-lg">
                <circle cx="104" cy="104" r="88" stroke="var(--surface-container-high)" strokeWidth="12" fill="transparent" />
                <motion.circle
                  cx="104"
                  cy="104"
                  r="88"
                  stroke="var(--primary)"
                  strokeWidth="12"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: scoreToOffset(todayScore) }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-extrabold leading-none text-primary">{todayScore}pt</span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-40">TODAY SCORE</span>
              </div>
            </div>
          ) : (
            <div className="flex h-52 w-full max-w-[20rem] flex-col items-center justify-center rounded-[2rem] bg-surface-lowest/70 px-6 text-center">
              <span className="text-5xl opacity-30">🌫️</span>
              <p className="mt-4 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
                오늘 기록이 아직 없어요.
              </p>
            </div>
          )}
        </div>

        <div className="lg:max-w-sm lg:flex-1">
          <div className="mb-4 flex items-center gap-2">
            {todayStatus && <Badge variant="primary">{statusToKo(todayStatus)}</Badge>}
            {StatusIcon ? (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}
              >
                <StatusIcon size={20} />
              </div>
            ) : null}
          </div>
          <p className="text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
            {user.name} 님의 오늘 상태를 한눈에 확인해요.
          </p>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {insightText}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function WeeklyFlowCard({
  weeklyLogs,
  viewMode,
  onViewModeChange,
  subtitle,
}: {
  weeklyLogs: (MoodLog | null)[];
  viewMode: "icon" | "chart";
  onViewModeChange: (mode: "icon" | "chart") => void;
  subtitle: string;
}) {
  return (
    <GlassCard className="px-6 py-6 md:px-7 md:py-7" intensity="medium">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader icon={<TrendIcon />} title="이번 주 흐름" subtitle={subtitle} />
        <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
      </div>

      {viewMode === "icon" ? (
        <div className="grid grid-cols-7 gap-2 text-center">
          {WEEK_DAY_LABELS.map((day) => (
            <span key={day} className="mb-2 block text-[10px] font-black tracking-widest opacity-40">
              {day}
            </span>
          ))}
          {weeklyLogs.map((log, index) => {
            const isToday = index === (new Date().getDay() + 6) % 7;
            const status = log ? scoreToStatus(log.score) : null;
            const Icon = status ? WEATHER_ICON_MAP[status] : null;
            return (
              <div
                key={`${dayLabel(index)}-${index}`}
                className="flex aspect-square items-center justify-center rounded-[1.1rem]"
                style={{
                  background: isToday
                    ? "color-mix(in srgb, var(--primary) 10%, var(--surface-lowest))"
                    : "color-mix(in srgb, var(--surface-lowest) 88%, transparent)",
                  outline: isToday ? "2px solid color-mix(in srgb, var(--primary) 38%, transparent)" : "none",
                  outlineOffset: "-2px",
                }}
              >
                {Icon ? <Icon size={22} /> : <span className="block h-5 w-5 rounded-full bg-surface-container-high" />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-1 pb-2 pt-3">
          <div className="mb-4 grid grid-cols-7 gap-2 text-center">
            {WEEK_DAY_LABELS.map((day) => (
              <span key={day} className="block text-[10px] font-black tracking-widest opacity-40">
                {day}
              </span>
            ))}
          </div>
          <MoodTrendChart scores={weeklyLogs.map((log) => log?.score ?? null)} height={104} className="w-full" />
        </div>
      )}
    </GlassCard>
  );
}

function dayLabel(index: number) {
  return WEEK_DAY_LABELS[index] ?? String(index);
}

export default function PersonalPageClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"icon" | "chart">("icon");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAdmin(!!session));
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
        .select("id, name, avatar_emoji, mood_logs (score, message, logged_at)")
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
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const weeklyLogs = useMemo(() => (user ? getWeeklyLogs(user.mood_logs) : Array.from({ length: 7 }, () => null)), [user]);
  const todayLog = useMemo(
    () => user?.mood_logs.find((log) =>
      new Date(log.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKst
    ) ?? null,
    [todayKst, user],
  );
  const todayScore = todayLog?.score ?? null;
  const todayStatus = todayScore !== null ? scoreToStatus(todayScore) : null;
  const weeklyScores = weeklyLogs.flatMap((log) => (log ? [log.score] : []));
  const weekAverage = weeklyScores.length
    ? Math.round(weeklyScores.reduce((sum, score) => sum + score, 0) / weeklyScores.length)
    : null;
  const bgScore = todayScore ?? 50;
  const insightText =
    todayScore === null
      ? "오늘 체크인을 남기면 팀 화면과 개인 현황이 같은 용어로 바로 정리돼요."
      : todayScore >= 81
        ? "에너지가 충분한 날이에요. 너무 과열되지 않게 속도를 조절하면 좋아요."
        : todayScore >= 61
          ? "안정적으로 집중하기 좋은 흐름이에요. 오늘 잘 된 포인트를 유지해 보세요."
          : todayScore >= 41
            ? "조금 흐릿한 날이에요. 우선순위를 줄이고 회복 시간을 먼저 챙기는 편이 좋아요."
            : "지금은 무리해서 끌고 가기보다 주변에 도움을 요청하는 편이 좋아 보여요.";

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--hero-gradient)" }}>
        <DynamicBackground score={50} />
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] items-center justify-center px-4">
          <div className="h-56 w-full max-w-xl animate-pulse rounded-[2rem] bg-surface-container" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--hero-gradient)" }}>
      <DynamicBackground score={bgScore} />

      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-4 md:px-8"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ClimaLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <HeaderNav items={[...BASE_NAV_ITEMS, ...(isAdmin ? [{ label: "어드민", href: "/admin" }] : [])]} />
          </nav>
        </div>
        <div className="flex items-center gap-2" style={{ color: "var(--header-action-color)" }}>
          <ThemeToggleButton />
          <button className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="bell" />
          </button>
          <button className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="settings" />
          </button>
          <div className="hidden md:flex items-center rounded-full bg-surface-high px-2 py-1.5 shadow-sm">
            <UserAvatar
              name={user?.name ?? "User"}
              avatarEmoji={user?.avatar_emoji}
              size={32}
              fallbackTextClassName="text-sm font-black"
            />
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
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-low transition-colors"
                  style={{ color: "var(--text-soft)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 flex flex-col px-4 py-4 gap-1">
                <HeaderNav items={[...BASE_NAV_ITEMS, ...(isAdmin ? [{ label: "어드민", href: "/admin" }] : [])]} mobile onNavigate={() => setMobileNavOpen(false)} />
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...STANDARD_SPRING, delay: 0.06 }}
        className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-12 pt-20 md:px-8"
      >
        <section
          className="rounded-[1.9rem] px-4 py-5 md:rounded-[2.25rem] md:px-7 md:py-8"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 50%, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 100%)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <SectionHeader
                icon={<TopIcon type="profile" />}
                title="개인 현황"
                subtitle={todayLabel}
              />
            </div>

            <div className="flex items-center gap-3 self-start rounded-full bg-surface-high px-3 py-2 shadow-sm">
              <UserAvatar
                name={user?.name ?? "User"}
                avatarEmoji={user?.avatar_emoji}
                size={44}
                fallbackTextClassName="text-base font-black"
              />
              <div>
                <p className="text-sm font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
                  {user?.name ?? "—"}
                </p>
                <p className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                  {todayStatus ? `오늘 상태 · ${statusToKo(todayStatus)}` : "오늘 상태 · 미기록"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 xl:grid-cols-3">
          <MiniStatCard
            label="오늘 지수"
            value={todayScore !== null ? `${todayScore}pt` : "—"}
            valueColor="primary"
          />
          <MiniStatCard
            label="오늘 상태"
            value={statusToKo(todayStatus)}
            valueColor="primary"
          />
          <MiniStatCard
            label="이번 주 평균"
            value={weekAverage !== null ? `${weekAverage}pt` : "—"}
            valueColor="primary"
          />
        </section>

        {user ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <PersonalHeroCard
              user={user}
              todayScore={todayScore}
              todayStatus={todayStatus}
              insightText={insightText}
            />
            <WeeklyFlowCard
              weeklyLogs={weeklyLogs}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              subtitle={getWeekRangeLabel()}
            />
          </div>
        ) : (
          <GlassCard className="px-6 py-8 text-center" intensity="medium">
            <p className="text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>
              개인 현황을 불러오지 못했어요.
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              사용자 정보가 없거나 접근할 수 없는 상태예요.
            </p>
          </GlassCard>
        )}
      </motion.main>
    </div>
  );
}

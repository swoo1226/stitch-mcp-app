"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ClimaLogo from "../components/WetherLogo";
import ThemeToggleButton from "../components/ThemeToggleButton";
import HeaderNav, { type HeaderNavItem } from "../components/HeaderNav";
import { SectionLabel, PrimaryTabToggle, TabToggle, NikoCalendar, type NikoCalendarMember } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { STANDARD_SPRING } from "../constants/springs";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, statusToKo, checkWarning, WARNING_REASON_KO, type WeatherStatus, type WarningReason } from "../../lib/mood";
import { DEMO_TEAM_ID, DEMO_PARTS, getDemoMembers, getDemoMonthLogs } from "../../lib/demo-data";

type DisplayWeather = WeatherStatus | null;

interface MoodLogRow {
  user_id: string;
  score: number;
  message?: string | null;
  logged_at: string;
}

interface RawUser {
  id: string;
  name: string;
  avatar_emoji: string;
  part_id: string | null;
  mood_logs: Array<{ score: number; message: string | null; logged_at: string }>;
}

interface Member {
  id: string;
  name: string;
  avatarEmoji: string;
  score: number | null;
  status: WeatherStatus | null;
  message: string;
  part_id: string | null;
  week: Array<{ status: WeatherStatus | null; score: number | null; message: string | null }>;
  logs: MoodLogRow[];
}

interface Part {
  id: string;
  name: string;
}

// ─── 날짜 유틸 ───────────────────────────────────────────────────────────────
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

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// KST(+09:00) 기준 날짜 범위 — logged_at이 timestamptz라 오프셋 명시 필요
function kstDayStart(iso: string): string { return `${iso}T00:00:00+09:00`; }
function kstDayEnd(iso: string): string { return `${iso}T23:59:59+09:00`; }

// DB에서 내려온 UTC 타임스탬프를 KST 기준 YYYY-MM-DD로 변환
function utcToKstDate(utcStr: string): string {
  const d = new Date(utcStr);
  // KST = UTC+9
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

const BASE_NAV_ITEMS: HeaderNavItem[] = [
  { label: "홈", href: "/" },
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard", matchPaths: ["/dashboard", "/team"] },
  { label: "Niko-Niko", href: "/niko" },
  { label: "알림", href: "/alerts", disabled: true },
];


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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function buildWeekEntries(logs: MoodLogRow[], weekDays: Date[]) {
  return weekDays.map((day) => {
    const dayIso = isoDate(day);
    const dayLogs = logs.filter((log) => utcToKstDate(log.logged_at) === dayIso);
    if (dayLogs.length === 0) {
      return { status: null as WeatherStatus | null, score: null as number | null, message: null as string | null };
    }

    const latestLog = dayLogs[dayLogs.length - 1];
    return {
      status: scoreToStatus(latestLog.score),
      score: latestLog.score,
      message: latestLog.message ?? null,
    };
  });
}

function getAverageFromScores(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
}

function getDailyScoresInRange(logs: MoodLogRow[], startIso: string, endIso: string) {
  const latestByDay = new Map<string, number>();

  logs.forEach((log) => {
    const dayIso = utcToKstDate(log.logged_at);
    if (dayIso >= startIso && dayIso <= endIso) {
      latestByDay.set(dayIso, log.score);
    }
  });

  return Array.from(latestByDay.values());
}

export default function DashboardPageClient({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekTab, setWeekTab] = useState<"this" | "last">("this");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const weekOffset = weekTab === "this" ? 0 : -1;
  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAdmin(!!session));
  }, []);

  useEffect(() => {
    if (teamId === DEMO_TEAM_ID) {
      const monthLogs = getDemoMonthLogs();
      const demoMembers = getDemoMembers(weekOffset).map(({ avatar, logs: weekLogs, ...member }) => ({
        ...member,
        avatarEmoji: avatar,
        // 주간 logs + 월간 고정 logs 합산 → 전주 대비·월 평균 모두 표시
        logs: [...(weekLogs ?? []), ...monthLogs.filter((l) => l.user_id === member.id)],
      }));
      setMembers(demoMembers);
      setParts(DEMO_PARTS);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const previousMonday = new Date(baseMonday);
      previousMonday.setDate(baseMonday.getDate() - 7);
      const monthStart = getMonthStart(baseMonday);
      const monthEnd = getMonthEnd(baseMonday);
      const rangeStartDate = previousMonday < monthStart ? previousMonday : monthStart;
      const rangeEndDate = monthEnd > weekDays[4] ? monthEnd : weekDays[4];
      const rangeStart = isoDate(rangeStartDate);
      const rangeEnd = isoDate(rangeEndDate);

      const [{ data: users }, { data: partsData }] = await Promise.all([
        supabase
          .from("users")
          .select("id, name, avatar_emoji, part_id, mood_logs (score, message, logged_at)")
          .eq("team_id", teamId)
          .order("logged_at", { referencedTable: "mood_logs", ascending: false }),
        supabase.from("parts").select("id, name").order("name"),
      ]);

      if (!users) {
        setLoading(false);
        return;
      }

      const userIds = (users as RawUser[]).map((u) => u.id);
      const { data: weekLogs } = await supabase
        .from("mood_logs")
        .select("user_id, score, message, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", kstDayStart(rangeStart))
        .lte("logged_at", kstDayEnd(rangeEnd))
        .order("logged_at", { ascending: true });

      const logRows: MoodLogRow[] = (weekLogs as MoodLogRow[]) ?? [];

      const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
      const mapped = (users as RawUser[]).map((user) => {
        const latest = user.mood_logs?.[0];
        const isToday = latest?.logged_at
          ? utcToKstDate(latest.logged_at) === todayKST
          : false;
        const score = isToday ? latest!.score : null;

        const userWeekLogs = logRows.filter((l) => l.user_id === user.id);
        const week = buildWeekEntries(userWeekLogs, weekDays);

        return {
          id: user.id,
          name: user.name,
          avatarEmoji: user.avatar_emoji || "",
          score,
          status: score !== null ? scoreToStatus(score) : null,
          message: isToday ? (latest?.message ?? "") : "오늘 체크인이 아직 없어요.",
          part_id: user.part_id ?? null,
          week,
          logs: userWeekLogs,
        };
      });

      setMembers(mapped);
      if (partsData) setParts(partsData as Part[]);
      setLoading(false);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, weekTab]);

  const visibleMembers = selectedPartId
    ? members.filter(m => m.part_id === selectedPartId)
    : members;

  const teamParts = parts.filter(p => members.some(m => m.part_id === p.id));
  const selectedPart = teamParts.find((part) => part.id === selectedPartId) ?? null;

  const checkedInMembers = visibleMembers.filter(m => m.score !== null);
  const averageScore = checkedInMembers.length
    ? Math.round(checkedInMembers.reduce((sum, m) => sum + m.score!, 0) / checkedInMembers.length)
    : null;
  const previousWeekDays = useMemo(() => {
    const previousMonday = new Date(baseMonday);
    previousMonday.setDate(baseMonday.getDate() - 7);
    return getWeekDays(previousMonday);
  }, [baseMonday]);
  const selectedWeekAverage = useMemo(
    () => getAverageFromScores(
      visibleMembers.flatMap((member) => member.week.map((entry) => entry.score).filter((score): score is number => score !== null))
    ),
    [visibleMembers]
  );
  const teamWeekAverage = useMemo(
    () => getAverageFromScores(
      members.flatMap((member) => member.week.map((entry) => entry.score).filter((score): score is number => score !== null))
    ),
    [members]
  );
  const previousWeekAverage = useMemo(
    () => getAverageFromScores(
      visibleMembers.flatMap((member) =>
        buildWeekEntries(member.logs, previousWeekDays)
          .map((entry) => entry.score)
          .filter((score): score is number => score !== null)
      )
    ),
    [previousWeekDays, visibleMembers]
  );
  const monthAverage = useMemo(() => {
    const monthStartIso = isoDate(getMonthStart(baseMonday));
    const monthEndIso = isoDate(getMonthEnd(baseMonday));
    return getAverageFromScores(
      visibleMembers.flatMap((member) => getDailyScoresInRange(member.logs, monthStartIso, monthEndIso))
    );
  }, [baseMonday, visibleMembers]);
  const weeklyDelta = selectedWeekAverage !== null && previousWeekAverage !== null
    ? selectedWeekAverage - previousWeekAverage
    : null;
  // 경보 배너: 오늘 기록이 있는 팀원 중 경보 조건에 해당하는 사람
  const alertMembers = useMemo(() => {
    return visibleMembers
      .filter((m) => m.score !== null)
      .map((m) => {
        const weekScores = m.week.map((e) => e.score);
        // 오늘은 week의 마지막 날(인덱스 기준 현재 요일)
        const todayIdx = weekScores.findLastIndex((s) => s !== null);
        if (todayIdx < 0) return null;
        const reason = checkWarning(weekScores, todayIdx);
        if (!reason) return null;
        return { member: m, reason };
      })
      .filter((x): x is { member: Member; reason: WarningReason } => x !== null);
  }, [visibleMembers]);
  const [alertBannerDismissed, setAlertBannerDismissed] = useState(false);

  const selectedMonthLabel = `${baseMonday.getMonth() + 1}월 평균`;
  const todayAverageLabel = selectedPart ? "오늘 파트 평균" : "오늘 팀 평균";
  const weekAverageLabel = selectedPart
    ? `${weekTab === "this" ? "이번 주" : "지난 주"} 파트 평균`
    : weekTab === "this" ? "이번 주 평균" : "지난 주 평균";
  const partVsTeamDelta = selectedPart && selectedWeekAverage !== null && teamWeekAverage !== null
    ? selectedWeekAverage - teamWeekAverage
    : null;
  const partVsTeamSummary = selectedPart && partVsTeamDelta !== null
    ? `${selectedPart.name} 평균은 ${weekTab === "this" ? "이번 주" : "지난 주"} 팀 평균보다 ${partVsTeamDelta > 0 ? "+" : ""}${partVsTeamDelta}pt ${partVsTeamDelta > 0 ? "높아요" : partVsTeamDelta < 0 ? "낮아요" : "같아요"}`
    : null;

  const { mostFrequent, mostFrequentPct } = useMemo(() => {
    const counts = new Map<WeatherStatus, number>();
    let total = 0;
    visibleMembers.forEach((member) => {
      member.week.forEach((entry) => {
        if (entry.status) {
          counts.set(entry.status, (counts.get(entry.status) ?? 0) + 1);
          total++;
        }
      });
    });

    if (!counts.size) return {
      mostFrequent: (averageScore !== null ? scoreToStatus(averageScore) : "Cloudy") as WeatherStatus,
      mostFrequentPct: 0,
    };

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return {
      mostFrequent: sorted[0][0],
      mostFrequentPct: Math.round((sorted[0][1] / total) * 100),
    };
  }, [visibleMembers, averageScore]);

  const insightText =
    averageScore === null
      ? "오늘 아직 체크인이 없어요. 팀이 날씨를 공유하길 기다리고 있어요."
      : averageScore >= 70
        ? "팀 날씨가 밝고 안정적이에요. 핵심 기여자에게 과부하가 걸리지 않도록 균형 있게 유지해요."
        : averageScore >= 50
          ? "팀 날씨가 회복세지만, 일부 팀원에게 햇살이 조금 더 필요해 보여요."
          : "지금 팀 날씨가 많이 무거워요. 속도를 올리기 전에 회복 공간을 먼저 확보해요.";

  const averageStatus = averageScore !== null ? scoreToStatus(averageScore) : null;
  const AverageIcon = averageStatus ? WEATHER_ICON_MAP[averageStatus] : null;
  const FrequentIcon = WEATHER_ICON_MAP[mostFrequent];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--hero-gradient)" }}
    >
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
          <Link href="/personal" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <TopIcon type="profile" />
          </Link>
          {/* 햄버거 버튼 (모바일) */}
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

      <div className="pt-20 px-4 md:px-8 max-w-[1200px] mx-auto pb-12">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.08 }}
          className="rounded-[1.8rem] md:rounded-[2rem] px-3 py-3 md:px-5 md:py-5"
          style={{ background: "var(--panel-tint)" }}
        >
          <section
            className="mb-5 rounded-[1.9rem] px-4 py-5 md:rounded-[2.25rem] md:px-7 md:py-8"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 50%, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 100%)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="mb-2 text-[2rem] font-black tracking-tight text-primary md:text-[3.1rem]">
                  팀 날씨
                </h1>
                <p className="mb-3 text-sm font-bold" style={{ color: "var(--text-soft)" }}>
                  {today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                </p>
                <p className="text-base leading-relaxed md:text-lg" style={{ color: "var(--text-muted)" }}>
                  오늘 팀의 날씨는 어떤가요? 서로의 날씨를 살피며 함께 나아가요.
                </p>
              </div>

              <div className="flex items-center self-start">
                {visibleMembers.slice(0, 3).map((member, index) => (
                  <div
                    key={member.id}
                    className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white text-xl shadow-sm first:ml-0"
                    style={{ background: index % 2 === 0 ? "var(--surface-highest)" : "var(--surface-low)" }}
                  >
                    {member.status
                      ? (() => { const Icon = WEATHER_ICON_MAP[member.status]; return <Icon size={24} />; })()
                      : <span className="text-base opacity-30">—</span>
                    }
                  </div>
                ))}
                <div className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-surface-high text-sm font-black text-on-surface">
                  +{Math.max(0, visibleMembers.length - 3)}
                </div>
              </div>
            </div>
          </section>

          {/* 경보 배너 */}
          <AnimatePresence>
            {alertMembers.length > 0 && !alertBannerDismissed && (
              <motion.section
                key="alert-banner"
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="mb-4 overflow-hidden"
              >
                <div
                  className="rounded-[1.5rem] px-4 py-4 flex items-start gap-3"
                  style={{
                    background: "color-mix(in srgb, var(--error-container) 55%, var(--surface-lowest))",
                    boxShadow: "0 2px 12px rgba(186,26,26,0.10)",
                  }}
                >
                  {/* 아이콘 */}
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--error) 14%, transparent)" }}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="var(--error)" strokeWidth="2">
                      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    </svg>
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black" style={{ color: "var(--error)" }}>
                      {alertMembers.length}명의 팀원이 주의가 필요해요
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {alertMembers.map(({ member, reason }) => (
                        <span
                          key={member.id}
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold"
                          style={{
                            background: "color-mix(in srgb, var(--error) 10%, var(--surface-lowest))",
                            color: "var(--error)",
                          }}
                        >
                          {member.avatarEmoji} {member.name}
                          <span className="opacity-60 font-medium">· {WARNING_REASON_KO[reason]}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 닫기 */}
                  <button
                    onClick={() => setAlertBannerDismissed(true)}
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                    style={{ color: "var(--error)" }}
                    aria-label="닫기"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="mb-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.5rem] px-4 py-4" style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}>
              <SectionLabel color="muted">{todayAverageLabel}</SectionLabel>
              <div className="mt-1 text-xl font-black text-primary">
                {averageScore !== null ? `${averageScore}pt` : "—"}
              </div>
            </div>
            <div className="rounded-[1.5rem] px-4 py-4" style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}>
              <SectionLabel color="muted">{weekAverageLabel}</SectionLabel>
              <div className="mt-1 text-xl font-black text-primary">
                {selectedWeekAverage !== null ? `${selectedWeekAverage}pt` : "—"}
              </div>
            </div>
            <div className="rounded-[1.5rem] px-4 py-4" style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}>
              <SectionLabel color="muted">{selectedMonthLabel}</SectionLabel>
              <div className="mt-1 text-xl font-black text-primary">
                {monthAverage !== null ? `${monthAverage}pt` : "—"}
              </div>
            </div>
            <div className="rounded-[1.5rem] px-4 py-4" style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}>
              <SectionLabel color="muted">지난 주 대비</SectionLabel>
              <div
                className="mt-1 text-xl font-black"
                style={{
                  color: weeklyDelta === null
                    ? "var(--on-surface)"
                    : weeklyDelta > 0
                      ? "var(--primary)"
                      : weeklyDelta < 0
                        ? "var(--tertiary)"
                        : "var(--on-surface)"
                }}
              >
                {weeklyDelta === null ? "—" : `${weeklyDelta > 0 ? "+" : ""}${weeklyDelta}pt`}
              </div>
            </div>
          </section>

          <section
            className="mb-6 rounded-[2rem] px-3 py-4 md:rounded-[2.5rem] md:px-6 md:py-6"
            style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-primary">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
                    <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10.5h17" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-black tracking-tight text-primary md:text-[1.1rem]">
                    이번 주 캘린더
                  </div>
                  <div className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                    미리보기 · 상위 {Math.min(3, visibleMembers.length)}명
                  </div>
                </div>
              </div>

              <Link
                href="/niko"
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors hover:opacity-80"
                style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
              >
                전체 보기
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <section>
              <NikoCalendar
                members={visibleMembers.slice(0, 3).map((m): NikoCalendarMember => ({
                  id: m.id,
                  name: m.name,
                  avatarEmoji: m.avatarEmoji,
                  week: m.week,
                }))}
                weekDays={weekDays}
                todayIso={isoDate(today)}
                loading={loading}
                colTemplate="120px repeat(5, minmax(72px, 1fr))"
                viewMode="icon"
                summaryLabel="팀 평균"
              />
            </section>
          </section>

          <section className="mb-6 grid gap-5 xl:grid-cols-2">
            <article
              className="rounded-[2rem] px-5 py-6 md:rounded-[2.3rem] md:px-7 md:py-7"
              style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
            >
              <div className="mb-7 text-center">
                <SectionLabel color="muted">팀 평균</SectionLabel>
              </div>
              <div className="mb-6 flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-surface-low">
                  {AverageIcon
                    ? <AverageIcon size={72} />
                    : <span className="text-4xl opacity-30">🌫️</span>
                  }
                  {AverageIcon && (
                    <div className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-container)] text-xs font-black text-primary">
                      ↗
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-[2.2rem] font-black tracking-tight" style={{ color: "var(--primary)" }}>
                  {statusToKo(averageStatus)}
                </div>
                <div className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {averageScore !== null
                    ? averageScore >= 80
                      ? "팀 전체 분위기가 밝고 편안하게 이어지고 있어요."
                      : averageScore >= 60
                        ? "팀 전체 분위기가 무난하고 안정된 편이에요."
                        : averageScore >= 40
                          ? "팀 분위기에 조금 잔잔한 흔들림이 보여요."
                          : "팀 전체 에너지가 다소 낮아 보여서 천천히 살펴보면 좋겠어요."
                    : `오늘 ${checkedInMembers.length} / ${visibleMembers.length}명 체크인했어요.`
                  }
                </div>
              </div>
            </article>

            <article
              className="rounded-[2rem] px-5 py-6 md:rounded-[2.3rem] md:px-7 md:py-7"
              style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
            >
              <div className="mb-7 text-center">
                <SectionLabel color="muted">가장 많은 날씨</SectionLabel>
              </div>
              <div className="mb-6 flex justify-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-low">
                  <FrequentIcon size={72} />
                </div>
              </div>
              <div className="text-center">
                <div className="mb-2 text-[2.2rem] font-black tracking-tight" style={{ color: "var(--tertiary)" }}>
                  {statusToKo(mostFrequent)}
                </div>
                <div className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {mostFrequentPct > 0
                    ? `이번 주 체크인의 ${mostFrequentPct}%를 차지해요.`
                    : "아직 이번 주 체크인 데이터가 없어요."}
                </div>
              </div>
            </article>
          </section>
        </motion.main>
      </div>
    </div>
  );
}

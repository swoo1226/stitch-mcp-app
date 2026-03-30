"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ClimaLogo from "../components/WetherLogo";
import { ClimaButton, SectionLabel, PrimaryTabToggle, TabToggle, NikoCalendar, type NikoCalendarMember } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { STANDARD_SPRING } from "../constants/springs";
import { DEFAULT_TEAM_ID, supabase } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, statusToKo, type WeatherStatus } from "../../lib/mood";

type DisplayWeather = WeatherStatus | null;

interface MoodLogRow {
  user_id: string;
  score: number;
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
  avatar: string;
  score: number | null;
  status: WeatherStatus | null;
  message: string;
  part_id: string | null;
  week: Array<DisplayWeather>;
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

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// KST(+09:00) 기준 날짜 범위 — logged_at이 timestamptz라 오프셋 명시 필요
function kstDayStart(iso: string): string { return `${iso}T00:00:00+09:00`; }
function kstDayEnd(iso: string): string   { return `${iso}T23:59:59+09:00`; }

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
const NIKO_PAGE_SIZE = 5;
const NAV_ITEMS = [
  { label: "대시보드", href: "/" },
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard", active: true },
  { label: "알림", href: "/alerts" },
];

function SidebarIcon({ type }: { type: "dashboard" | "personal" | "team" | "alerts" }) {
  const stroke = "currentColor";

  if (type === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
      </svg>
    );
  }

  if (type === "personal") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    );
  }

  if (type === "team") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
        <path d="M11.5 19a4.5 4.5 0 0 1 9 0" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={stroke} strokeWidth="1.8">
      <path d="M12 3.8 4.7 16.3a1.1 1.1 0 0 0 .95 1.7h12.7a1.1 1.1 0 0 0 .95-1.7L12 3.8Z" />
      <path d="M12 9v3.8M12 16h.01" />
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function TeamClimateDashboard() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? DEFAULT_TEAM_ID;

  const [members, setMembers] = useState<Member[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekTab, setWeekTab] = useState<"this" | "last">("this");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const weekOffset = weekTab === "this" ? 0 : -1;
  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);


  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const rangeStart = isoDate(weekDays[0]);
      const rangeEnd = isoDate(weekDays[4]);

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
        .select("user_id, score, logged_at")
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
        const week: DisplayWeather[] = weekDays.map((day) => {
          const dayIso = isoDate(day);
          const dayLogs = userWeekLogs.filter((l) => utcToKstDate(l.logged_at) === dayIso);
          if (dayLogs.length === 0) return null;
          const latestLog = dayLogs[dayLogs.length - 1];
          return scoreToStatus(latestLog.score);
        });

        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar_emoji || "",
          score,
          status: score !== null ? scoreToStatus(score) : null,
          message: isToday ? (latest?.message ?? "") : "오늘 체크인이 아직 없어요.",
          part_id: user.part_id ?? null,
          week,
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

  const checkedInMembers = visibleMembers.filter(m => m.score !== null);
  const averageScore = checkedInMembers.length
    ? Math.round(checkedInMembers.reduce((sum, m) => sum + m.score!, 0) / checkedInMembers.length)
    : null;

  const mostFrequent = useMemo(() => {
    const counts = new Map<WeatherStatus, number>();
    visibleMembers.forEach((member) => {
      member.week.forEach((status) => {
        if (status) counts.set(status, (counts.get(status) ?? 0) + 1);
      });
    });

    if (!counts.size) return averageScore !== null ? scoreToStatus(averageScore) : "Foggy";

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }, [visibleMembers, averageScore]);

  const insightText =
    averageScore === null
      ? "오늘 아직 체크인이 없어요. 팀이 날씨를 공유하길 기다리고 있어요."
      : averageScore >= 70
        ? "팀 기후가 밝고 안정적이에요. 핵심 기여자에게 과부하가 걸리지 않도록 균형 있게 유지해요."
        : averageScore >= 50
          ? "팀 기후가 회복세지만, 일부 팀원에게 햇살이 조금 더 필요해 보여요."
          : "지금 팀 기후가 많이 무거워요. 속도를 올리기 전에 회복 공간을 먼저 확보해요.";

  const averageStatus = averageScore !== null ? scoreToStatus(averageScore) : null;
  const AverageIcon = averageStatus ? WEATHER_ICON_MAP[averageStatus] : null;
  const FrequentIcon = WEATHER_ICON_MAP[mostFrequent];

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(197, 242, 237, 0.42) 0%, rgba(235, 250, 236, 0.96) 38%, rgba(228, 245, 229, 1) 100%)",
      }}
    >
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
                      : { color: "rgba(37, 50, 40, 0.55)" }
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2" style={{ color: "rgba(37, 50, 40, 0.7)" }}>
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
                style={{ background: "rgba(37,50,40,0.15)", backdropFilter: "blur(4px)" }}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={STANDARD_SPRING}
                className="fixed right-0 top-0 h-full w-72 z-[70] flex flex-col"
                style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)" }}
              >
                <div className="flex items-center justify-between px-6 h-16 shrink-0">
                  <ClimaLogo />
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-low transition-colors"
                    style={{ color: "rgba(37,50,40,0.5)" }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <nav className="flex-1 flex flex-col px-4 py-4 gap-1">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className="px-5 py-4 rounded-[1.5rem] text-base font-semibold tracking-tight transition-colors hover:bg-surface-low"
                      style={item.active ? { color: "var(--primary)", fontWeight: 700 } : { color: "rgba(37,50,40,0.8)" }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="pt-16">
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] px-4 md:px-8 py-6 max-w-[1440px] mx-auto">
          <motion.aside
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...STANDARD_SPRING, delay: 0.05 }}
            className="rounded-[2rem] bg-white/72 px-5 py-5 shadow-[0_20px_42px_rgba(37,50,40,0.05)]"
          >
            <div className="mb-10 flex items-center gap-4 rounded-[1.8rem] bg-surface-low px-4 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[var(--primary-container)] text-white shadow-[0_16px_28px_rgba(0,102,104,0.22)]">
                {statusToEmoji("Cloudy" as WeatherStatus)}
              </div>
              <div>
                <div className="text-[2rem] font-black tracking-tight leading-none text-primary">Clima</div>
                <div className="mt-1 text-sm font-medium" style={{ color: "rgba(37, 50, 40, 0.6)" }}>팀 마음 건강</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "대시보드", href: "/", icon: "dashboard" as const },
                { label: "개인 현황", href: "/personal", icon: "personal" as const },
                { label: "팀", href: "/dashboard", icon: "team" as const, active: true },
                { label: "알림", href: "/alerts", icon: "alerts" as const },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-full px-5 py-4 text-[1.05rem] font-medium tracking-tight transition-all ${
                    item.active ? "text-white shadow-[0_18px_36px_rgba(0,102,104,0.24)]" : ""
                  }`}
                  style={
                    item.active
                      ? { background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)" }
                      : { color: "rgba(37, 50, 40, 0.82)" }
                  }
                >
                  <span style={item.active ? { color: "#ffffff" } : { color: "rgba(37, 50, 40, 0.7)" }}>
                    <SidebarIcon type={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-10 rounded-[2rem] bg-surface-low px-4 py-4">
              <ClimaButton href="/input" className="w-full justify-center">
                오늘 기록하기
              </ClimaButton>
            </div>
          </motion.aside>

          <motion.main
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...STANDARD_SPRING, delay: 0.08 }}
            className="rounded-[2rem] px-4 py-4 md:px-5 md:py-5"
            style={{ background: "rgba(235, 250, 236, 0.88)" }}
          >
            <section
              className="mb-5 rounded-[2.25rem] px-6 py-7 md:px-7 md:py-8"
              style={{
                background:
                  "linear-gradient(90deg, rgba(228,245,229,0.92) 0%, rgba(235,250,236,0.96) 50%, rgba(228,245,229,0.92) 100%)",
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <h1 className="mb-2 text-[2.4rem] font-black tracking-tight text-primary md:text-[3.1rem]">
                    팀 기후
                  </h1>
                  <p className="mb-3 text-sm font-bold" style={{ color: "rgba(37,50,40,0.4)" }}>
                    {today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
                  </p>
                  <p className="max-w-xl text-lg leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.72)" }}>
                    이번 주 팀의 감정 대기를 함께 들여다봐요. 연결되어 있고, 서로를 살피며 나아가요.
                  </p>
                </div>

                <div className="flex items-center gap-[-0.5rem] self-start">
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

            <section
              className="mb-6 rounded-[2.5rem] px-5 py-5 shadow-[0_24px_48px_rgba(37,50,40,0.04)] md:px-6 md:py-6"
              style={{ background: "rgba(255,255,255,0.86)" }}
            >
              <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-primary">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
                      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10.5h17" />
                    </svg>
                  </div>
                  <div className="text-[1.1rem] md:text-[1.2rem] font-black tracking-tight text-primary">
                    Niko-Niko 캘린더
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {teamParts.length > 0 && (
                    <TabToggle
                      variant="filter"
                      tabs={teamParts.map(p => ({ value: p.id, label: p.name }))}
                      active={selectedPartId}
                      onChange={setSelectedPartId}
                    />
                  )}
                  <PrimaryTabToggle
                    tabs={[
                      { value: "this", label: "이번 주" },
                      { value: "last", label: "지난 주" },
                    ]}
                    active={weekTab}
                    onChange={setWeekTab}
                  />
                </div>
              </div>

              <NikoCalendar
                members={visibleMembers.map((m): NikoCalendarMember => ({
                  id: m.id,
                  name: m.name,
                  week: m.week.map(status => ({ status, score: null })),
                }))}
                weekDays={weekDays}
                todayIso={isoDate(today)}
                loading={loading}
                pageSize={NIKO_PAGE_SIZE}
                colTemplate="220px repeat(5, minmax(90px, 1fr))"
              />
            </section>

            <section className="mb-6 grid gap-5 xl:grid-cols-3">
              <article
                className="rounded-[2.3rem] px-7 py-7 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
                style={{ background: "rgba(255,255,255,0.86)" }}
              >
                <div className="mb-7 text-center">
                  <SectionLabel color="muted">팀 평균</SectionLabel>
                </div>
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-surface-low">
                    {AverageIcon
                      ? <AverageIcon size={56} />
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
                  <div className="text-base leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.62)" }}>
                    {averageScore !== null
                      ? `팀 전체 분위기는 ${averageScore >= 60 ? "안정적" : "혼조"}이에요.`
                      : `오늘 ${checkedInMembers.length} / ${visibleMembers.length}명 체크인했어요.`
                    }
                  </div>
                </div>
              </article>

              <article
                className="rounded-[2.3rem] px-7 py-7 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
                style={{ background: "rgba(255,255,255,0.86)" }}
              >
                <div className="mb-7 text-center">
                  <SectionLabel color="muted">가장 많은 날씨</SectionLabel>
                </div>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-low">
                    <FrequentIcon size={56} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-[2.2rem] font-black tracking-tight" style={{ color: "var(--tertiary)" }}>
                    {statusToKo(mostFrequent)}
                  </div>
                  <div className="text-base leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.62)" }}>
                    전체 체크인의 {checkedInMembers.length ? Math.max(48, Math.min(84, averageScore ?? 64)) : 64}%를 차지해요.
                  </div>
                </div>
              </article>

              <article
                className="rounded-[2.3rem] px-7 py-7 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(189,244,255,0.82) 100%)",
                }}
              >
                <div className="mb-6 flex items-center gap-3 text-primary">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.75)" }}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M7 9.5A2.5 2.5 0 0 1 9.5 7h5A2.5 2.5 0 0 1 17 9.5v5A2.5 2.5 0 0 1 14.5 17h-5A2.5 2.5 0 0 1 7 14.5v-5Z" />
                      <path d="M4.5 10.5h2M17.5 10.5h2M10.5 4.5v2M10.5 17.5v2M13.5 4.5v2M13.5 17.5v2" />
                    </svg>
                  </div>
                  <div className="text-[1.05rem] font-black tracking-tight">기후 인사이트</div>
                </div>
                <p className="mb-8 text-[1.1rem] italic leading-[1.7] text-on-surface">
                  "{insightText}"
                </p>
                <div className="flex items-center gap-3 text-[0.95rem] font-black uppercase tracking-[0.18em] text-primary">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  AI 기반 분석
                </div>
              </article>
            </section>

            <section
              className="rounded-[2.5rem] px-6 py-7 md:px-7 md:py-8 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
              style={{ background: "rgba(228, 245, 229, 0.6)" }}
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-2xl">
                  <h2 className="mb-3 text-[2rem] font-black tracking-tight" style={{ color: "var(--tertiary)" }}>
                    오늘 폭풍 같은 기분인가요?
                  </h2>
                  <p className="text-lg leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.72)" }}>
                    괜찮지 않아도 괜찮아요. 빠른 1:1 대화를 신청하거나 웰니스 브레이크를 한 번의 클릭으로 요청해보세요.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <ClimaButton className="min-w-[170px] justify-center px-8">
                    1:1 대화 신청
                  </ClimaButton>
                  <ClimaButton variant="secondary" className="min-w-[170px] justify-center px-8">
                    브레이크 요청
                  </ClimaButton>
                </div>
              </div>
            </section>
          </motion.main>
        </div>
        </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <TeamClimateDashboard />
    </Suspense>
  );
}

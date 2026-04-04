"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ClimaLogo from "../components/WetherLogo";
import HeaderNav, { type HeaderNavItem } from "../components/HeaderNav";
import ThemeToggleButton from "../components/ThemeToggleButton";
import {
  NikoCalendar,
  type NikoCalendarMember,
  PrimaryTabToggle,
  SectionLabel,
  WeatherLegend,
  ViewModeToggle,
} from "../components/ui";

import { STANDARD_SPRING } from "../constants/springs";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, type WeatherStatus } from "../../lib/mood";
import { DEMO_TEAM_ID, DEMO_PARTS, getDemoMembers, getDemoMonthLogs } from "../../lib/demo-data";

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

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isoDate(d: Date): string {
  // 로컬 타임존 기준 YYYY-MM-DD (toISOString은 UTC라 한국에서 날짜가 어긋남)
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
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];
const COL_TEMPLATE = "120px repeat(5, minmax(80px, 1fr))";

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
  avatar_emoji: string;
  part_id: string | null;
}

interface Part {
  id: string;
  name: string;
}

interface MemberRow {
  id: string;
  name: string;
  avatarEmoji: string;
  part_id: string | null;
  week: Array<{ status: WeatherStatus | null; score: number | null; message: string | null }>;
  todayScore: number | null;
  logs: MoodLogRow[];
}

function buildWeekEntries(logs: MoodLogRow[], weekDays: Date[]) {
  return weekDays.map((day) => {
    const dayIso = isoDate(day);
    const dayLogs = logs.filter((log) => utcToKstDate(log.logged_at) === dayIso);
    if (dayLogs.length === 0) return { status: null, score: null, message: null };
    const latest = dayLogs[dayLogs.length - 1];
    return { status: scoreToStatus(latest.score), score: latest.score, message: latest.message ?? null };
  });
}

function getAverageFromScores(scores: number[]) {
  return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
}


// ─── Nav ────────────────────────────────────────────────────────────────────
const BASE_NAV_ITEMS: HeaderNavItem[] = [
  { label: "홈", href: "/" },
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard", matchPaths: ["/dashboard", "/team"] },
  { label: "Niko-Niko", href: "/niko", matchPaths: ["/niko"] },
  { label: "알림", href: "/alerts", disabled: true },
];

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10.5h17" />
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
export default function NikoPageClient({ teamId }: { teamId: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"icon" | "chart">("icon");
  const [isAdmin, setIsAdmin] = useState(false);

  const today = new Date();
  const baseMonday = getWeekStart(today);
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseMonday);
  const todayIso = isoDate(today);

  const todayIndex = weekDays.findIndex((d) => isoDate(d) === todayIso);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsAdmin(!!session));
  }, []);

  useEffect(() => {
    if (teamId === DEMO_TEAM_ID) {
      const monthLogs = getDemoMonthLogs();
      const demoMembers = getDemoMembers(weekOffset).map(({ avatar, logs: weekLogs, ...member }) => ({
        ...member,
        avatarEmoji: avatar,
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

      const [{ data: users, error: usersError }, { data: partsData }] = await Promise.all([
        supabase.from("users").select("id, name, avatar_emoji, part_id").eq("team_id", teamId),
        supabase.from("parts").select("id, name").order("name"),
      ]);

      if (usersError || !users) {
        setLoading(false);
        return;
      }

      const userIds = (users as UserRow[]).map((u) => u.id);
      const { data: logs } = await supabase
        .from("mood_logs")
        .select("user_id, score, message, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", kstDayStart(rangeStart))
        .lte("logged_at", kstDayEnd(rangeEnd))
        .order("logged_at", { ascending: true });

      const logRows: MoodLogRow[] = (logs as MoodLogRow[]) ?? [];

      const mapped: MemberRow[] = (users as UserRow[]).map((user) => {
        const userLogs = logRows.filter((l) => l.user_id === user.id);
        const week = buildWeekEntries(userLogs, weekDays);

        const todayScore = todayIndex >= 0 ? (week[todayIndex]?.score ?? null) : null;

        return {
          id: user.id,
          name: user.name,
          avatarEmoji: user.avatar_emoji || "",
          part_id: user.part_id ?? null,
          week,
          todayScore,
          logs: userLogs,
        };
      });

      setMembers(mapped);
      if (partsData) setParts(partsData as Part[]);
      setLoading(false);
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, teamId]);

  const todayLabel = today.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  const dateRangeLabel = `${weekDays[0].toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} — ${weekDays[4].toLocaleDateString("ko-KR", { month: "short", day: "numeric" })} · 오늘 ${todayLabel}`;

  const teamParts = parts.filter(p => members.some(m => m.part_id === p.id));
  const selectedPart = teamParts.find((part) => part.id === selectedPartId) ?? null;
  const visibleMembers = selectedPartId
    ? members.filter(m => m.part_id === selectedPartId)
    : members;

  // 파트 vs 팀 비교
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
  const partVsTeamDelta = selectedPart && selectedWeekAverage !== null && teamWeekAverage !== null
    ? selectedWeekAverage - teamWeekAverage
    : null;
  const partVsTeamSummary = selectedPart && partVsTeamDelta !== null
    ? `파트 평균은 ${weekOffset === 0 ? "이번 주" : "지난 주"} 팀 평균보다 ${partVsTeamDelta > 0 ? "+" : ""}${partVsTeamDelta}pt ${partVsTeamDelta > 0 ? "높아요" : partVsTeamDelta < 0 ? "낮아요" : "같아요"}`
    : null;

  const checkedInCount = visibleMembers.filter(
    (m) => todayIndex >= 0 && m.week[todayIndex]?.status !== null
  ).length;

  const headerDays = weekDays.map((date, i) => ({ label: DAY_LABELS[i], date }));

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--hero-gradient)" }}
    >
      {/* ── 헤더 (fixed, h-16, 한 줄) ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-10"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <div className="flex items-center gap-8">
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

      <div className="pt-20 px-4 md:px-8 max-w-[1440px] mx-auto pb-12">
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.06 }}
          className="rounded-[1.8rem] md:rounded-[2rem] px-3 py-3 md:px-5 md:py-5"
          style={{ background: "var(--panel-tint)" }}
        >
          {/* 히어로 */}
          <section
            className="mb-5 rounded-[1.9rem] px-4 py-5 md:rounded-[2.25rem] md:px-7 md:py-8"
            style={{
              background: "linear-gradient(90deg, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 0%, color-mix(in srgb, var(--surface) 96%, transparent) 50%, color-mix(in srgb, var(--surface-container-low) 92%, transparent) 100%)",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <h1 className="mb-2 text-[2rem] font-black tracking-tight text-primary md:text-[3.1rem]">
                  Niko-Niko 캘린더
                </h1>
                <p className="text-sm font-bold" style={{ color: "var(--text-soft)" }}>
                  {dateRangeLabel}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 self-start">
                {teamParts.length > 0 && (
                  <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "var(--surface-overlay)", boxShadow: "var(--button-subtle-shadow)" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPartId(null)}
                      className="rounded-full px-3 py-1.5 text-xs font-black tracking-tight transition-all"
                      style={!selectedPartId
                        ? { background: "var(--primary)", color: "var(--on-primary)", boxShadow: "var(--button-primary-shadow)" }
                        : { color: "var(--text-soft)" }
                      }
                    >
                      전체
                    </button>
                    {teamParts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPartId(p.id)}
                        className="rounded-full px-3 py-1.5 text-xs font-black tracking-tight transition-all"
                        style={selectedPartId === p.id
                          ? { background: "var(--primary)", color: "var(--on-primary)", boxShadow: "var(--button-primary-shadow)" }
                          : { color: "var(--text-soft)" }
                        }
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
                <PrimaryTabToggle
                  tabs={[
                    { value: "this", label: "이번 주" },
                    { value: "last", label: "지난 주" },
                  ]}
                  active={weekOffset === 0 ? "this" : "last"}
                  onChange={(v) => setWeekOffset(v === "this" ? 0 : -1)}
                />
              </div>
            </div>
          </section>

          {/* 캘린더 */}
          <section
            className="mb-5 rounded-[2rem] px-3 py-4 md:rounded-[2.5rem] md:px-6 md:py-6"
            style={{ background: "var(--panel-strong)", boxShadow: "var(--glass-shadow)" }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-primary">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-base font-black tracking-tight text-primary md:text-[1.1rem]">
                    {selectedPart ? `${selectedPart.name} 캘린더` : "팀 캘린더"}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-soft)" }}>
                    체크인 {checkedInCount}/{visibleMembers.length}명
                  </p>
                </div>
              </div>
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {partVsTeamSummary && (
              <div
                className="mb-4 inline-flex max-w-full items-center rounded-full px-3 py-2 text-xs font-black tracking-tight"
                style={{
                  background: partVsTeamDelta! > 0
                    ? "color-mix(in srgb, var(--primary-container) 40%, var(--surface-lowest))"
                    : partVsTeamDelta! < 0
                      ? "color-mix(in srgb, var(--tertiary-container) 42%, var(--surface-lowest))"
                      : "color-mix(in srgb, var(--surface-container-high) 80%, var(--surface-lowest))",
                  color: partVsTeamDelta! > 0 ? "var(--primary)" : partVsTeamDelta! < 0 ? "var(--tertiary)" : "var(--on-surface)",
                }}
              >
                {partVsTeamSummary}
              </div>
            )}

            <section className="min-h-[400px]">
              <NikoCalendar
                members={visibleMembers.map((m): NikoCalendarMember => ({
                  id: m.id,
                  name: m.name,
                  avatarEmoji: m.avatarEmoji,
                  week: m.week,
                }))}
                comparisonMembers={selectedPartId
                  ? members.map((m): NikoCalendarMember => ({
                    id: m.id,
                    name: m.name,
                    avatarEmoji: m.avatarEmoji,
                    week: m.week,
                  }))
                  : undefined}
                weekDays={weekDays}
                todayIso={todayIso}
                loading={loading}
                colTemplate={COL_TEMPLATE}
                viewMode={viewMode}
                summaryLabel={selectedPart ? `파트 평균` : "팀 평균"}
                comparisonLabel="팀 평균"
              />
            </section>
          </section>

          {/* 범례 */}
          <WeatherLegend className="px-1" />
        </motion.main>
      </div>
    </div>
  );
}

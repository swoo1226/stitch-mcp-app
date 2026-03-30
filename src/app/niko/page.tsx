"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, Suspense } from "react";
import ClimaLogo from "../components/WetherLogo";
import {
  GlassCard,
  MiniStatCard,
  NikoCalendar,
  type NikoCalendarMember,
  PrimaryTabToggle,
  SectionHeader,
  WeatherLegend,
} from "../components/ui";
import { STANDARD_SPRING } from "../constants/springs";
import { useSearchParams } from "next/navigation";
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

// KST(+09:00) 기준 날짜 범위 — logged_at이 timestamptz라 오프셋 명시 필요
function kstDayStart(iso: string): string { return `${iso}T00:00:00+09:00`; }
function kstDayEnd(iso: string): string   { return `${iso}T23:59:59+09:00`; }

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
  part_id: string | null;
}

interface Part {
  id: string;
  name: string;
}

interface MemberRow {
  id: string;
  name: string;
  avatar: string;
  part_id: string | null;
  week: Array<{ status: WeatherStatus | null; score: number | null }>;
  todayScore: number | null;
}

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "대시보드", href: "/dashboard" },
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard" },
  { label: "Niko-Niko", href: "/niko", active: true },
  { label: "알림", href: "/alerts" },
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
function NikoPageInner() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? DEFAULT_TEAM_ID;

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
        .select("user_id, score, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", kstDayStart(rangeStart))
        .lte("logged_at", kstDayEnd(rangeEnd))
        .order("logged_at", { ascending: true });

      const logRows: MoodLogRow[] = (logs as MoodLogRow[]) ?? [];

      const mapped: MemberRow[] = (users as UserRow[]).map((user) => {
        const userLogs = logRows.filter((l) => l.user_id === user.id);

        const week = weekDays.map((day) => {
          const dayIso = isoDate(day);
          const dayLogs = userLogs.filter((l) => utcToKstDate(l.logged_at) === dayIso);
          if (dayLogs.length === 0) return { status: null, score: null };
          const latest = dayLogs[dayLogs.length - 1];
          return { status: scoreToStatus(latest.score), score: latest.score };
        });

        const todayScore = todayIndex >= 0 ? (week[todayIndex]?.score ?? null) : null;

        return {
          id: user.id,
          name: user.name,
          avatar: "",
          part_id: user.part_id ?? null,
          week,
          todayScore,
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
  const visibleMembers = selectedPartId
    ? members.filter(m => m.part_id === selectedPartId)
    : members;

  const todayScores = visibleMembers.map((m) => m.todayScore).filter((s): s is number => s !== null);
  const avgToday = todayScores.length
    ? Math.round(todayScores.reduce((a, b) => a + b, 0) / todayScores.length)
    : null;

  const checkedInCount = visibleMembers.filter(
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
            <div className="flex flex-wrap gap-2 sm:justify-end items-center">
              {teamParts.length > 0 && (
                <div className="flex items-center gap-1 rounded-full p-1" style={{ background: "rgba(255,255,255,0.7)" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedPartId(null)}
                    className="rounded-full px-3 py-1.5 text-xs font-black tracking-tight transition-all"
                    style={!selectedPartId
                      ? { background: "var(--primary)", color: "#fff", boxShadow: "0 2px 8px rgba(0,102,104,0.2)" }
                      : { color: "rgba(37,50,40,0.5)" }
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
                        ? { background: "var(--primary)", color: "#fff", boxShadow: "0 2px 8px rgba(0,102,104,0.2)" }
                        : { color: "rgba(37,50,40,0.5)" }
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
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <MiniStatCard
                label="오늘 체크인"
                value={loading ? "—" : `${checkedInCount} / ${visibleMembers.length}`}
                valueColor="primary"
              />
              <MiniStatCard
                label="오늘 팀 평균"
                value={loading ? "—" : avgToday !== null ? `${avgToday}pt` : "—"}
                valueColor="primary"
              />
            </div>
          </div>
        </div>

        {/* 캘린더 그리드 */}
        <GlassCard className="px-5 py-6 md:px-8 md:py-8" intensity="low">
          <NikoCalendar
            members={visibleMembers.map((m): NikoCalendarMember => ({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              subtitle: m.todayScore !== null ? `오늘 ${m.todayScore}pt` : "오늘 기록 없음",
              week: m.week,
            }))}
            weekDays={weekDays}
            todayIso={todayIso}
            loading={loading}
            colTemplate={COL_TEMPLATE}
          />
        </GlassCard>

        {/* 범례 */}
        <WeatherLegend className="px-1" />
      </motion.main>
    </div>
  );
}

export default function NikoPage() {
  return (
    <Suspense>
      <NikoPageInner />
    </Suspense>
  );
}

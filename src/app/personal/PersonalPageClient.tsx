"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import DynamicBackground from "../components/DynamicBackground";
import { PageHeadline, SanctuaryCard, Badge, ViewModeToggle, MarkdownRenderer, UserAvatar } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { MoodTrendChart } from "../components/MoodTrendChart";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, type WeatherStatus } from "../../lib/mood";
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

const WEEK_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function scoreToOffset(score: number) {
  const circumference = 2 * Math.PI * 88;
  return circumference * (1 - score / 100);
}

function getWeeklyLogs(logs: MoodLog[]): (MoodLog | null)[] {
  const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const today = new Date(todayKST);
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isoDate = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    return logs.find((log) =>
      new Date(log.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === isoDate,
    ) ?? null;
  });
}

// ─── 단일 팀원 카드 콘텐츠 ────────────────────────────────────────────────────
function MemberCard({ user, viewMode, onViewModeChange }: {
  user: UserData;
  viewMode: "icon" | "chart";
  onViewModeChange: (m: "icon" | "chart") => void;
}) {
  const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const todayLog = user.mood_logs.find((log) =>
    new Date(log.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST,
  ) ?? null;

  const todayScore = todayLog?.score ?? null;
  const todayStatus: WeatherStatus | null = todayScore !== null ? scoreToStatus(todayScore) : null;
  const weeklyLogs = getWeeklyLogs(user.mood_logs);
  const circumference = 2 * Math.PI * 88;

  const bestLog = weeklyLogs.reduce<MoodLog | null>((best, log) => {
    if (!log) return best;
    if (!best || log.score > best.score) return log;
    return best;
  }, null);
  const bestDayIndex = bestLog
    ? weeklyLogs.findIndex((log) => log?.logged_at === bestLog.logged_at)
    : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={STANDARD_SPRING}
    >
      <section className="mb-8 flex flex-col items-center rounded-[2.5rem] bg-surface-lowest px-6 py-12 text-on-surface shadow-ambient">
        {todayScore !== null ? (
          <>
            <div className="relative flex h-48 w-48 items-center justify-center">
              <svg className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-lg">
                <circle cx="96" cy="96" r="88" stroke="var(--surface-container-high)" strokeWidth="12" fill="transparent" />
                <motion.circle
                  cx="96" cy="96" r="88"
                  stroke="var(--primary)" strokeWidth="12" fill="transparent" strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: scoreToOffset(todayScore) }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                />
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-5xl font-extrabold leading-none text-primary font-[Plus Jakarta Sans]">{todayScore}%</span>
                <span className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-40">오늘 지수</span>
              </div>
            </div>
            {todayStatus && (
              <div className="mt-6"><Badge variant="primary">{todayStatus}</Badge></div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <span className="text-5xl opacity-30">🌫️</span>
            <p className="text-center text-sm font-medium opacity-50">오늘 아직 기록이 없어요.</p>
          </div>
        )}
      </section>

      <section className="mb-8 rounded-[2rem] bg-surface-container p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">이번 주 날씨</p>
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
        {viewMode === "icon" ? (
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEK_DAYS.map((day) => (
              <span key={day} className="mb-3 block text-[10px] font-bold opacity-40">{day}</span>
            ))}
            {weeklyLogs.map((log, i) => {
              const isToday = i === (new Date().getDay() + 6) % 7;
              const status = log ? scoreToStatus(log.score) : null;
              const Icon = status ? WEATHER_ICON_MAP[status] : null;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-[1rem] flex items-center justify-center"
                  style={{
                    background: isToday ? "var(--highlight-soft)" : "transparent",
                    outline: isToday ? "2px solid var(--primary)" : "none",
                    outlineOffset: "-2px",
                  }}
                >
                  {Icon ? <Icon size={22} /> : (
                    <span className="block h-5 w-5 rounded-full" style={{ background: "var(--track-bg)" }} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-32 px-2 py-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {WEEK_DAYS.map((day) => (
                <span key={day} className="block text-[10px] font-bold opacity-40">{day}</span>
              ))}
            </div>
            <MoodTrendChart scores={weeklyLogs.map(l => l?.score ?? null)} height={80} className="w-full" />
          </div>
        )}
      </section>

      {bestLog && bestDayIndex >= 0 && (
        <SanctuaryCard as="section" className="mb-8">
          <span className="mb-4 inline-block rounded-full bg-primary-container/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            Weekly Best
          </span>
          <h2 className="mb-4 text-xl font-bold font-[Plus Jakarta Sans]">
            이번 주 {WEEK_DAYS[bestDayIndex]}요일은<br />가장 맑은 날이었어요
          </h2>
          <div className="flex items-center gap-3">
            {(() => {
              const Icon = WEATHER_ICON_MAP[scoreToStatus(bestLog.score)];
              return <Icon size={28} />;
            })()}
            <span className="text-xs font-bold text-primary">{bestLog.score}점 · {scoreToStatus(bestLog.score)}</span>
          </div>
        </SanctuaryCard>
      )}

      {todayLog?.message && (
        <SanctuaryCard className="mb-8 bg-surface-high">
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest opacity-40">오늘의 한마디</p>
          <div className="text-sm font-medium leading-relaxed opacity-80">
            <MarkdownRenderer content={todayLog.message} color="var(--on-surface)" />
          </div>
        </SanctuaryCard>
      )}
    </motion.div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function PersonalPageClient({ userId, teamId }: { userId: string; teamId: string | null }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [allMembers, setAllMembers] = useState<UserData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"icon" | "chart">("icon");

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── 어드민 세션 체크 + 데이터 로딩 ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      // 데모 모드: team 파라미터가 없을 때만 (team 있으면 실제 DB 조회)
      if (userId === DEMO_USER_ID && !teamId) {
        setUser({ id: DEMO_USER_ID, ...DEMO_USER });
        setLoading(false);
        return;
      }

      // 세션 확인
      const { data: { session } } = await supabase.auth.getSession();
      const authed = !!session;
      setIsAdmin(authed);

      if (teamId) {
        // team 파라미터 있음: 어드민 여부 무관하게 해당 팀 전체 스와이프 뷰
        // (어드민이면 더 넓은 권한이지만 팀 컨텍스트 우선)
        setIsAdmin(true); // 스와이프 뷰 활성화에 재활용
        const { data } = await supabase
          .from("users")
          .select("id, name, avatar_emoji, mood_logs (score, message, logged_at)")
          .eq("team_id", teamId)
          .order("name")
          .order("logged_at", { referencedTable: "mood_logs", ascending: false });

        if (data) {
          const members = data as UserData[];
          setAllMembers(members);
          // user 파라미터가 있으면 해당 멤버부터, 없으면 첫 번째부터
          const startIdx = userId !== DEMO_USER_ID
            ? members.findIndex(m => m.id === userId)
            : -1;
          const idx = startIdx >= 0 ? startIdx : 0;
          setCurrentIndex(idx);
          setUser(members[idx] ?? null);
        }
      } else if (authed) {
        // 어드민 + team 파라미터 없음: 전체 팀원 로드
        const { data } = await supabase
          .from("users")
          .select("id, name, avatar_emoji, mood_logs (score, message, logged_at)")
          .order("name")
          .order("logged_at", { referencedTable: "mood_logs", ascending: false });

        if (data) {
          const members = data as UserData[];
          setAllMembers(members);
          const startIdx = members.findIndex(m => m.id === userId);
          setCurrentIndex(startIdx >= 0 ? startIdx : 0);
          setUser(members[startIdx >= 0 ? startIdx : 0] ?? null);
        }
      } else {
        // user만 있음: 단일 유저 뷰
        const { data } = await supabase
          .from("users")
          .select("id, name, avatar_emoji, mood_logs (score, message, logged_at)")
          .eq("id", userId)
          .order("logged_at", { referencedTable: "mood_logs", ascending: false })
          .limit(30, { referencedTable: "mood_logs" })
          .single();
        if (data) setUser(data as UserData);
      }
      setLoading(false);
    }
    load();
  }, [userId, teamId]);

  // ── admin 스와이프 시 현재 유저 동기화 ──────────────────────────────────────
  useEffect(() => {
    if (isAdmin && allMembers.length > 0) {
      setUser(allMembers[currentIndex] ?? null);
    }
  }, [currentIndex, isAdmin, allMembers]);

  // ── 스크롤 snap 기반 인덱스 추적 ────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isAdmin) return;

    function onScroll() {
      if (!el) return;
      const idx = Math.round(el.scrollLeft / el.offsetWidth);
      setCurrentIndex(idx);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isAdmin]);

  // ── 화살표 이동 ──────────────────────────────────────────────────────────────
  function goTo(idx: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.offsetWidth, behavior: "smooth" });
    setCurrentIndex(idx);
  }

  const bgScore = user?.mood_logs
    ? (() => {
      const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
      const todayLog = user.mood_logs.find(l =>
        new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST
      );
      return todayLog?.score ?? 50;
    })()
    : 50;

  // ── 단일 유저 뷰 ─────────────────────────────────────────────────────────────
  if (!isAdmin || userId === DEMO_USER_ID) {
    return (
      <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
        <DynamicBackground score={bgScore} />
        <div className="relative z-10 mx-auto w-full max-w-lg px-4 pb-24 pt-12 md:px-8 md:pt-16">
          <header className="mb-10 flex w-full items-center justify-between">
            <div className="rounded-full bg-surface-high shadow-ambient">
              <UserAvatar
                name={user?.name ?? "User"}
                avatarEmoji={user?.avatar_emoji}
                size={48}
                fallbackTextClassName="text-base font-black"
              />
            </div>
            <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-high font-bold shadow-ambient transition-transform active:scale-90">
              ✕
            </Link>
          </header>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={STANDARD_SPRING}>
            <div className="mb-10 pt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-40">나의 날씨 정원</p>
              <PageHeadline className="font-black">
                {loading ? "..." : user ? `${user.name}의 오늘` : "나의 비밀 정원"}
              </PageHeadline>
            </div>
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-48 w-48 animate-pulse rounded-full bg-surface-container" />
              </div>
            ) : user ? (
              <MemberCard user={user} viewMode={viewMode} onViewModeChange={setViewMode} />
            ) : null}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── 어드민 스와이프 뷰 ────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden">
      <DynamicBackground score={bgScore} />

      {/* 상단 헤더 */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={STANDARD_SPRING}
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between h-16 px-5 md:px-8"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="rounded-full bg-surface-high shadow-sm">
                <UserAvatar
                  name={user?.name ?? "User"}
                  avatarEmoji={user?.avatar_emoji}
                  size={36}
                  fallbackTextClassName="text-sm font-black"
                />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight leading-none" style={{ color: "var(--on-surface)" }}>
                  {user?.name ?? "—"}
                </p>
                <p className="text-[10px] font-bold mt-0.5 opacity-40">
                  {currentIndex + 1} / {allMembers.length}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high font-bold shadow-sm transition-transform active:scale-90" style={{ color: "var(--text-soft)" }}>
          ✕
        </Link>
      </motion.header>

      {/* 스와이프 트랙 */}
      <div
        ref={scrollRef}
        className="flex h-screen overflow-x-scroll"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {loading ? (
          <div className="w-screen shrink-0 flex items-center justify-center">
            <div className="h-48 w-48 animate-pulse rounded-full bg-surface-container" />
          </div>
        ) : (
          allMembers.map((member, i) => (
            <div
              key={member.id}
              className="w-screen shrink-0 overflow-y-auto"
              style={{ scrollSnapAlign: "start" }}
            >
              <div className="mx-auto w-full max-w-lg px-4 pb-32 pt-24 md:px-8">
                <div className="mb-10 pt-4">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-40">날씨 정원</p>
                  <PageHeadline className="font-black">
                    {member.name}의 오늘
                  </PageHeadline>
                </div>
                {/* 각 슬라이드는 현재 인덱스일 때만 animate 트리거 */}
                {i === currentIndex ? (
                  <MemberCard key={`${member.id}-active`} user={member} viewMode={viewMode} onViewModeChange={setViewMode} />
                ) : (
                  <MemberCard key={member.id} user={member} viewMode={viewMode} onViewModeChange={setViewMode} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 좌우 화살표 (데스크탑) */}
      {!loading && allMembers.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => goTo(currentIndex - 1)}
              className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: "var(--surface-elevated)", color: "var(--primary)", boxShadow: "var(--glass-shadow)" }}
              aria-label="이전 팀원"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {currentIndex < allMembers.length - 1 && (
            <button
              onClick={() => goTo(currentIndex + 1)}
              className="hidden md:flex fixed right-5 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{ background: "var(--surface-elevated)", color: "var(--primary)", boxShadow: "var(--glass-shadow)" }}
              aria-label="다음 팀원"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* 하단 인디케이터 */}
      {!loading && allMembers.length > 1 && (
        <div className="fixed bottom-8 left-1/2 z-20 -translate-x-1/2 flex items-center gap-2">
          {allMembers.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`${allMembers[i].name}으로 이동`}
              className="transition-all"
              style={{
                width: i === currentIndex ? 20 : 6,
                height: 6,
                borderRadius: 999,
                background: i === currentIndex ? "var(--primary)" : "color-mix(in srgb, var(--primary) 28%, transparent)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

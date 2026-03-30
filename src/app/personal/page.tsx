"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import DynamicBackground from "../components/DynamicBackground";
import { PageHeadline, SanctuaryCard, Badge } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { supabase } from "../../lib/supabase";
import { scoreToStatus, type WeatherStatus } from "../../lib/mood";
import { STANDARD_SPRING } from "../constants/springs";

interface MoodLog {
  score: number;
  message: string | null;
  logged_at: string;
}

interface UserData {
  name: string;
  avatar_emoji: string;
  mood_logs: MoodLog[];
}

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 원둘레(r=88) 기준 strokeDashoffset 계산
function scoreToOffset(score: number) {
  const circumference = 2 * Math.PI * 88;
  return circumference * (1 - score / 100);
}

function getWeeklyLogs(logs: MoodLog[]): (MoodLog | null)[] {
  const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const today = new Date(todayKST);
  const dayOfWeek = today.getDay(); // 0=일
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // 이번 주 월요일

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isoDate = d.toLocaleDateString("sv-SE");
    return logs.find(l =>
      new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === isoDate
    ) ?? null;
  });
}

function PersonalPageInner() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user");

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from("users")
      .select("name, avatar_emoji, mood_logs (score, message, logged_at)")
      .eq("id", userId)
      .order("logged_at", { referencedTable: "mood_logs", ascending: false })
      .limit(30, { referencedTable: "mood_logs" })
      .single()
      .then(({ data }) => {
        if (data) setUser(data as UserData);
        setLoading(false);
      });
  }, [userId]);

  const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const todayLog = user?.mood_logs.find(l =>
    new Date(l.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST
  ) ?? null;

  const todayScore = todayLog?.score ?? null;
  const todayStatus: WeatherStatus | null = todayScore !== null ? scoreToStatus(todayScore) : null;
  const weeklyLogs = user ? getWeeklyLogs(user.mood_logs) : Array(7).fill(null);

  // 주간 최고 기록
  const bestLog = weeklyLogs.reduce<MoodLog | null>((best, log) => {
    if (!log) return best;
    if (!best || log.score > best.score) return log;
    return best;
  }, null);
  const bestDayIndex = bestLog
    ? weeklyLogs.findIndex(l => l?.logged_at === bestLog.logged_at)
    : -1;

  const bgScore = todayScore ?? 50;
  const circumference = 2 * Math.PI * 88;

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={bgScore} />
      <div className="px-4 md:px-8 pt-12 md:pt-16 pb-24 w-full max-w-lg mx-auto relative z-10">

        <header className="flex justify-between items-center mb-10 w-full">
          <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center text-xl shadow-ambient">
            {user?.avatar_emoji || "🪴"}
          </div>
          <Link href="/" className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center font-bold shadow-ambient transition-transform active:scale-90">✕</Link>
        </header>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={STANDARD_SPRING}>
          <div className="mb-10 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-primary">나의 기후 정원</p>
            <PageHeadline className="font-black">
              {loading ? "..." : user ? `${user.name}의 오늘` : "나의 비밀 정원"}
            </PageHeadline>
          </div>

          {/* 오늘 점수 링 */}
          <section className="bg-surface-lowest text-on-surface rounded-[2.5rem] flex flex-col items-center py-12 px-6 shadow-ambient mb-8">
            {loading ? (
              <div className="w-48 h-48 rounded-full bg-surface-container animate-pulse" />
            ) : todayScore !== null ? (
              <>
                <p className="text-sm font-medium opacity-60 text-center leading-relaxed mb-8">
                  {todayLog?.message || "오늘의 기후가 기록되었어요."}
                </p>
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-lg">
                    <circle cx="96" cy="96" r="88" stroke="var(--surface-container-high)" strokeWidth="12" fill="transparent" />
                    <motion.circle
                      cx="96" cy="96" r="88"
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
                    <span className="text-5xl font-extrabold font-[Plus Jakarta Sans] leading-none text-primary">{todayScore}%</span>
                    <span className="text-[10px] font-black tracking-widest opacity-40 mt-2 uppercase">오늘 지수</span>
                  </div>
                </div>
                {todayStatus && (
                  <div className="mt-6">
                    <Badge variant="primary">{todayStatus}</Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4">
                <span className="text-5xl opacity-30">🌫️</span>
                <p className="text-sm font-medium opacity-50 text-center">오늘 아직 기록이 없어요.</p>
              </div>
            )}
          </section>

          {/* 이번 주 캘린더 */}
          <section className="bg-surface-container rounded-[2rem] p-6 md:p-8 mb-8">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">이번 주 기후</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEK_DAYS.map(d => (
                <span key={d} className="text-[10px] font-bold opacity-40 mb-3 block">{d}</span>
              ))}
              {weeklyLogs.map((log, i) => {
                const isToday = i === (new Date().getDay() + 6) % 7;
                const status = log ? scoreToStatus(log.score) : null;
                const Icon = status ? WEATHER_ICON_MAP[status] : null;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-center aspect-square rounded-[1rem]"
                    style={{
                      background: isToday ? "rgba(0,102,104,0.08)" : "transparent",
                      outline: isToday ? "2px solid var(--primary)" : "none",
                      outlineOffset: "-2px",
                    }}
                  >
                    {Icon
                      ? <Icon size={22} />
                      : <span className="w-5 h-5 rounded-full block" style={{ background: "rgba(37,50,40,0.07)" }} />
                    }
                  </div>
                );
              })}
            </div>
          </section>

          {/* 이번 주 베스트 */}
          {bestLog && bestDayIndex >= 0 && (
            <SanctuaryCard as="section" className="mb-8">
              <span className="text-[10px] font-black uppercase tracking-widest bg-primary-container/40 text-primary px-3 py-1 rounded-full inline-block mb-4">Weekly Best</span>
              <h2 className="text-xl font-bold mb-4 font-[Plus Jakarta Sans]">
                이번 주 {WEEK_DAYS[bestDayIndex]}요일은<br />가장 맑은 날이었어요
              </h2>
              <div className="flex items-center gap-3">
                {(() => { const Icon = WEATHER_ICON_MAP[scoreToStatus(bestLog.score)]; return <Icon size={28} />; })()}
                <span className="text-xs font-bold text-primary">{bestLog.score}점 · {scoreToStatus(bestLog.score)}</span>
              </div>
            </SanctuaryCard>
          )}

          {/* 최근 메시지 */}
          {todayLog?.message && (
            <SanctuaryCard className="bg-surface-high mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">오늘의 한마디</p>
              <p className="text-sm leading-relaxed italic opacity-80 font-medium">"{todayLog.message}"</p>
            </SanctuaryCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function PersonalGarden() {
  return (
    <Suspense>
      <PersonalPageInner />
    </Suspense>
  );
}

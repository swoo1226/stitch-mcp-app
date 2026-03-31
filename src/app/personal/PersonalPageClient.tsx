"use client";

import { useEffect, useState } from "react";
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

export default function PersonalPageClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("users")
      .select("name, avatar_emoji, mood_logs (score, message, logged_at)")
      .eq("id", userId)
      .order("logged_at", { referencedTable: "mood_logs", ascending: false })
      .limit(30, { referencedTable: "mood_logs" })
      .single()
      .then(({ data }) => {
        if (data) {
          setUser(data as UserData);
        }
        setLoading(false);
      });
  }, [userId]);

  const todayKST = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
  const todayLog = user?.mood_logs.find((log) =>
    new Date(log.logged_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }) === todayKST,
  ) ?? null;

  const todayScore = todayLog?.score ?? null;
  const todayStatus: WeatherStatus | null = todayScore !== null ? scoreToStatus(todayScore) : null;
  const weeklyLogs = user ? getWeeklyLogs(user.mood_logs) : Array(7).fill(null);

  const bestLog = weeklyLogs.reduce<MoodLog | null>((best, log) => {
    if (!log) return best;
    if (!best || log.score > best.score) return log;
    return best;
  }, null);

  const bestDayIndex = bestLog
    ? weeklyLogs.findIndex((log) => log?.logged_at === bestLog.logged_at)
    : -1;

  const bgScore = todayScore ?? 50;
  const circumference = 2 * Math.PI * 88;

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={bgScore} />
      <div className="relative z-10 mx-auto w-full max-w-lg px-4 pb-24 pt-12 md:px-8 md:pt-16">
        <header className="mb-10 flex w-full items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-high text-xl shadow-ambient">
            {user?.avatar_emoji || "🪴"}
          </div>
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-high font-bold shadow-ambient transition-transform active:scale-90"
          >
            ✕
          </Link>
        </header>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={STANDARD_SPRING}>
          <div className="mb-10 pt-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-40">나의 기후 정원</p>
            <PageHeadline className="font-black">
              {loading ? "..." : user ? `${user.name}의 오늘` : "나의 비밀 정원"}
            </PageHeadline>
          </div>

          <section className="mb-8 flex flex-col items-center rounded-[2.5rem] bg-surface-lowest px-6 py-12 text-on-surface shadow-ambient">
            {loading ? (
              <div className="h-48 w-48 animate-pulse rounded-full bg-surface-container" />
            ) : todayScore !== null ? (
              <>
                <p className="mb-8 text-center text-sm font-medium leading-relaxed opacity-60">
                  {todayLog?.message || "오늘의 기후가 기록되었어요."}
                </p>
                <div className="relative flex h-48 w-48 items-center justify-center">
                  <svg className="absolute inset-0 h-full w-full -rotate-90 drop-shadow-lg">
                    <circle cx="96" cy="96" r="88" stroke="var(--surface-container-high)" strokeWidth="12" fill="transparent" />
                    <motion.circle
                      cx="96"
                      cy="96"
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
                    <span className="text-5xl font-extrabold leading-none text-primary font-[Plus Jakarta Sans]">{todayScore}%</span>
                    <span className="mt-2 text-[10px] font-black uppercase tracking-widest opacity-40">오늘 지수</span>
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
                <p className="text-center text-sm font-medium opacity-50">오늘 아직 기록이 없어요.</p>
              </div>
            )}
          </section>

          <section className="mb-8 rounded-[2rem] bg-surface-container p-6 md:p-8">
            <p className="mb-6 text-[10px] font-black uppercase tracking-widest opacity-40">이번 주 기후</p>
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
                    {Icon ? (
                      <Icon size={22} />
                    ) : (
                      <span className="block h-5 w-5 rounded-full" style={{ background: "var(--track-bg)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {bestLog && bestDayIndex >= 0 && (
            <SanctuaryCard as="section" className="mb-8">
              <span className="mb-4 inline-block rounded-full bg-primary-container/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                Weekly Best
              </span>
              <h2 className="mb-4 text-xl font-bold font-[Plus Jakarta Sans]">
                이번 주 {WEEK_DAYS[bestDayIndex]}요일은
                <br />
                가장 맑은 날이었어요
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
              <p className="text-sm font-medium italic leading-relaxed opacity-80">"{todayLog.message}"</p>
            </SanctuaryCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}

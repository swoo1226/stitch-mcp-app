"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase, DEFAULT_TEAM_ID } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, WeatherStatus } from "../../lib/mood";
import { STANDARD_SPRING } from "../constants/springs";

interface Member {
  id: string;
  name: string;
  avatar_emoji: string;
  score: number;
  status: WeatherStatus;
  message: string;
  loggedAt: string | null;
}

interface RawUser {
  id: string;
  name: string;
  avatar_emoji: string;
  mood_logs: Array<{ score: number; message: string | null; logged_at: string }>;
}

type MetricCard = {
  eyebrow: string;
  title: string;
  subtitle: string;
  score: number;
  icon: "backend" | "frontend" | "design";
  accent: string;
  label: string;
  bars: number[];
};

const DAYS = ["MON", "TUE", "WED", "TODAY", "FRI", "SAT"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toRelativeTime(timestamp: string | null) {
  if (!timestamp) return "just now";

  const diff = Math.max(0, Date.now() - new Date(timestamp).getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function chartPath(points: number[]) {
  const width = 560;
  const height = 180;
  const step = width / (points.length - 1);

  return points.reduce((path, point, index) => {
    const x = step * index;
    const y = height - point;

    if (index === 0) {
      return `M ${x} ${y}`;
    }

    const prevX = step * (index - 1);
    const prevY = height - points[index - 1];
    const cp1x = prevX + step / 3;
    const cp1y = prevY;
    const cp2x = x - step / 3;
    const cp2y = y;

    return `${path} C ${cp1x} ${prevY}, ${cp2x} ${y}, ${x} ${y}`;
  }, "");
}

function HeaderIcon({
  children,
  href,
  dot = false,
}: {
  children: React.ReactNode;
  href: string;
  dot?: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex h-9 w-9 items-center justify-center rounded-full transition-transform active:scale-95"
      style={{ color: "var(--on-surface)" }}
    >
      {children}
      {dot ? (
        <span
          className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full"
          style={{ background: "#ff7e74" }}
        />
      ) : null}
    </Link>
  );
}

function PartIcon({ type }: { type: MetricCard["icon"] }) {
  if (type === "backend") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 8.5a5 5 0 0 1 10 0c0 4-5 7-5 7s-5-3-5-7Z" />
        <circle cx="12" cy="8.5" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (type === "frontend") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v3M12 17.5v3M20.5 12h-3M6.5 12h-3M17.7 6.3l-2.1 2.1M8.4 15.6l-2.1 2.1M17.7 17.7l-2.1-2.1M8.4 8.4 6.3 6.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 15c1.8-1.1 3.3-1.7 4.5-1.7 1.9 0 2.8 1.7 4.8 1.7 1 0 1.9-.3 2.7-.8" />
      <path d="M8 10.5c0-1.4 1.1-2.5 2.5-2.5 1 0 1.8.6 2.2 1.4.5-.4 1.1-.7 1.8-.7 1.7 0 3 1.3 3 3" />
      <path d="M6.5 17.5c2-1.3 3.8-1.9 5.5-1.9 2.2 0 3.4 1.6 5.5 1.6" />
    </svg>
  );
}

function TinyBars({ bars, color }: { bars: number[]; color: string }) {
  return (
    <div className="flex items-end gap-1">
      {bars.map((bar, index) => (
        <span
          key={`${color}-${index}`}
          className="w-1 rounded-full"
          style={{
            height: `${bar}px`,
            background: color,
            opacity: 0.28 + index * 0.18,
          }}
        />
      ))}
    </div>
  );
}

function BottomNavIcon({ active = false, type }: { active?: boolean; type: "home" | "map" | "alert" | "profile" }) {
  const stroke = active ? "#ffffff" : "var(--outline)";

  if (type === "home") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M4 15.5A4.5 4.5 0 0 1 8.5 11c1.1 0 2.2.4 3 1.1A5.2 5.2 0 0 1 20 14.8a3.2 3.2 0 0 1-1 6.2H8a4 4 0 0 1-4-4c0-.6.1-1 .3-1.5Z" />
        <path d="M10 17.5h4" />
      </svg>
    );
  }

  if (type === "map") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="M5 6.5 10 4l4 2.5L19 4v13.5L14 20l-4-2.5L5 20V6.5Z" />
        <path d="M10 4v13.5M14 6.5V20" />
      </svg>
    );
  }

  if (type === "alert") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.8">
        <path d="m13 3-6 10h4l-1 8 7-11h-4l1-7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={stroke} strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export default function DashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, avatar_emoji, mood_logs (score, message, logged_at)")
        .eq("team_id", DEFAULT_TEAM_ID)
        .order("logged_at", { referencedTable: "mood_logs", ascending: false });

      if (users) {
        const mapped = (users as RawUser[]).map((user) => {
          const latest = user.mood_logs?.[0];
          const score = latest?.score ?? 50;

          return {
            id: user.id,
            name: user.name,
            avatar_emoji: user.avatar_emoji,
            score,
            status: scoreToStatus(score),
            message: latest?.message ?? "No fresh signal yet. Team check-in is still pending.",
            loggedAt: latest?.logged_at ?? null,
          };
        });

        setMembers(mapped);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const averageScore = members.length
    ? Math.round(members.reduce((total, member) => total + member.score, 0) / members.length)
    : 84;
  const strongestScore = members.length ? Math.max(...members.map((member) => member.score)) : 94;
  const calmScore = members.length
    ? Math.round(
        (members.filter((member) => member.score >= 60).length / members.length) * 100
      )
    : 88;

  const metricCards: MetricCard[] = [
    {
      eyebrow: "PART 01",
      title: "Backend",
      subtitle: "Service Architecture",
      score: clamp(strongestScore, 72, 99),
      icon: "backend",
      accent: "#3ca38d",
      label: "STABILITY RATE",
      bars: [8, 14, 10, 22],
    },
    {
      eyebrow: "PART 02",
      title: "Frontend",
      subtitle: "Interface UX Flow",
      score: clamp(Math.round((averageScore + calmScore) / 2), 68, 96),
      icon: "frontend",
      accent: "#4b7ef2",
      label: "DELIVERY SPEED",
      bars: [10, 18, 14, 24],
    },
    {
      eyebrow: "PART 03",
      title: "Design",
      subtitle: "Brand Visual System",
      score: clamp(Math.round(averageScore * 0.92 + 14), 70, 97),
      icon: "design",
      accent: "#dd7b5e",
      label: "VISUAL CONSISTENCY",
      bars: [7, 12, 18, 15],
    },
  ];

  const weeklyScores = [76, 92, 58, averageScore, 81, 73];
  const solidPath = chartPath(weeklyScores.map((score) => clamp(score * 1.35, 42, 152)));
  const dashedPath = chartPath(
    weeklyScores.map((score, index) => clamp(score * 1.15 + (index % 2 === 0 ? 12 : -4), 36, 148))
  );
  const chartBars = weeklyScores.map((score) => clamp(score * 0.78, 28, 92));
  const peakHour = members.length
    ? `${String(9 + (members.length % 6) + 5).padStart(2, "0")}:30 KST`
    : "14:30 KST";
  const totalImpact = `+${(averageScore / 7).toFixed(1)}%`;

  const pulseMembers = [...members]
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.loggedAt ? new Date(right.loggedAt).getTime() : 0) - (left.loggedAt ? new Date(left.loggedAt).getTime() : 0);
    })
    .slice(0, 3);

  return (
    <div
      className="min-h-screen px-4 pb-28 pt-4 md:px-6"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(214, 243, 229, 0.95) 0%, rgba(240, 248, 236, 1) 42%, rgba(244, 248, 242, 1) 100%)",
        color: "#132321",
        fontFamily: "'Pretendard', 'Public Sans', sans-serif",
      }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="flex items-center justify-between rounded-[1.75rem] px-5 py-4 md:px-6"
          style={{
            background: "rgba(255, 255, 255, 0.78)",
            boxShadow: "0 14px 30px rgba(19, 35, 33, 0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-sm font-black tracking-tight" style={{ color: "#0f2f2c" }}>
              Aether
            </div>
            <span
              className="hidden text-xs font-medium md:block"
              style={{ color: "rgba(19, 35, 33, 0.68)" }}
            >
              팀 기류 대시보드
            </span>
          </div>

          <div className="flex items-center gap-1">
            <HeaderIcon href="/statistics">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </HeaderIcon>
            <HeaderIcon href="/alerts" dot>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
                <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
              </svg>
            </HeaderIcon>
            <Link
              href="/personal"
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: "linear-gradient(135deg, #159d95 0%, #67d8d0 100%)",
                boxShadow: "0 8px 20px rgba(21, 157, 149, 0.28)",
              }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white/95" />
            </Link>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.05 }}
          className="grid gap-4 xl:grid-cols-3"
        >
          {metricCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.8rem] px-5 py-4 md:px-6 md:py-5"
              style={{
                background: "rgba(255, 255, 255, 0.88)",
                boxShadow: "0 18px 40px rgba(19, 35, 33, 0.05)",
              }}
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p
                    className="mb-1 text-[10px] font-bold tracking-[0.22em]"
                    style={{ color: "rgba(19, 35, 33, 0.35)" }}
                  >
                    {card.eyebrow}
                  </p>
                  <h2 className="text-lg font-bold tracking-tight">{card.title}</h2>
                  <p className="text-xs" style={{ color: "rgba(19, 35, 33, 0.55)" }}>
                    {card.subtitle}
                  </p>
                </div>

                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: `${card.accent}18`,
                    color: card.accent,
                  }}
                >
                  <PartIcon type={card.icon} />
                </div>
              </div>

              <div className="flex items-end justify-between gap-6">
                <div>
                  <div className="text-[2rem] font-black tracking-tight">{card.score}%</div>
                  <p
                    className="text-[10px] font-bold tracking-[0.18em]"
                    style={{ color: "rgba(19, 35, 33, 0.38)" }}
                  >
                    {card.label}
                  </p>
                </div>
                <TinyBars bars={card.bars} color={card.accent} />
              </div>
            </article>
          ))}
        </motion.section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...STANDARD_SPRING, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h3 className="text-base font-bold tracking-tight">Weekly Team Resonance</h3>
              <span
                className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.18em]"
                style={{
                  background: "rgba(196, 240, 220, 0.82)",
                  color: "#26796e",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#36af9b]" />
                LIVE ENERGY FLOW
              </span>
            </div>

            <div
              className="rounded-[1.8rem] p-4 md:p-5"
              style={{
                background: "rgba(255, 255, 255, 0.88)",
                boxShadow: "0 18px 40px rgba(19, 35, 33, 0.05)",
              }}
            >
              <div className="relative h-[240px] overflow-hidden rounded-[1.4rem] md:h-[260px]">
                <svg viewBox="0 0 560 180" className="absolute inset-0 h-full w-full">
                  <defs>
                    <linearGradient id="mainWave" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#78c8d4" />
                      <stop offset="50%" stopColor="#67a2f9" />
                      <stop offset="100%" stopColor="#d79a7b" />
                    </linearGradient>
                  </defs>
                  <path
                    d={dashedPath}
                    fill="none"
                    stroke="#bde4ed"
                    strokeWidth="2"
                    strokeDasharray="6 7"
                    strokeLinecap="round"
                  />
                  <path
                    d={solidPath}
                    fill="none"
                    stroke="url(#mainWave)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>

                <div className="absolute inset-x-0 bottom-10 grid grid-cols-6 gap-3 px-4 md:px-6">
                  {chartBars.map((bar, index) => {
                    const isToday = index === 3;

                    return (
                      <div key={DAYS[index]} className="flex flex-col items-center gap-2">
                        <span
                          className="text-[10px] font-bold tracking-[0.22em]"
                          style={{
                            color: isToday ? "#0f2f2c" : "rgba(19, 35, 33, 0.32)",
                          }}
                        >
                          {DAYS[index]}
                        </span>
                        <div className="flex h-[92px] items-end">
                          <span
                            className="w-[6px] rounded-full"
                            style={{
                              height: `${bar}px`,
                              background: isToday
                                ? "linear-gradient(180deg, #64ddd4 0%, #27ada2 100%)"
                                : index < 3
                                  ? "#173632"
                                  : index === 4
                                    ? "#58a0f3"
                                    : "#c48f77",
                              boxShadow: isToday
                                ? "0 0 0 4px rgba(106, 229, 223, 0.14)"
                                : "none",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div
                className="flex items-center justify-between rounded-[1.5rem] px-4 py-4 md:px-5"
                style={{
                  background: "rgba(255, 255, 255, 0.86)",
                  boxShadow: "0 14px 28px rgba(19, 35, 33, 0.04)",
                }}
              >
                <div>
                  <p
                    className="mb-1 text-[10px] font-bold tracking-[0.18em]"
                    style={{ color: "rgba(19, 35, 33, 0.32)" }}
                  >
                    PEAK HOUR
                  </p>
                  <p className="text-lg font-bold tracking-tight">{peakHour}</p>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "rgba(238, 245, 241, 1)", color: "#99a7a4" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="m13 3-6 10h4l-1 8 7-11h-4l1-7Z" />
                  </svg>
                </div>
              </div>

              <div
                className="flex items-center justify-between rounded-[1.5rem] px-4 py-4 md:px-5"
                style={{
                  background: "rgba(255, 255, 255, 0.86)",
                  boxShadow: "0 14px 28px rgba(19, 35, 33, 0.04)",
                }}
              >
                <div>
                  <p
                    className="mb-1 text-[10px] font-bold tracking-[0.18em]"
                    style={{ color: "rgba(19, 35, 33, 0.32)" }}
                  >
                    TOTAL IMPACT
                  </p>
                  <p className="text-lg font-bold tracking-tight">{totalImpact}</p>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: "rgba(255, 242, 238, 1)", color: "#dda992" }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="m7 15 4-4 3 3 4-5" />
                    <path d="M15 9h3v3" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...STANDARD_SPRING, delay: 0.15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold tracking-tight">Atmospheric Pulse</h3>
              <span
                className="text-xl leading-none"
                style={{ color: "rgba(19, 35, 33, 0.35)" }}
              >
                ...
              </span>
            </div>

            <div
              className="rounded-[1.8rem] p-4 md:p-5"
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                boxShadow: "0 18px 40px rgba(19, 35, 33, 0.05)",
              }}
            >
              <div className="space-y-3">
                {loading ? (
                  <div
                    className="rounded-[1.2rem] px-4 py-8 text-sm font-medium"
                    style={{ background: "rgba(244, 248, 242, 0.95)", color: "rgba(19, 35, 33, 0.55)" }}
                  >
                    Loading live pulse...
                  </div>
                ) : pulseMembers.length === 0 ? (
                  <div
                    className="rounded-[1.2rem] px-4 py-8 text-sm font-medium"
                    style={{ background: "rgba(244, 248, 242, 0.95)", color: "rgba(19, 35, 33, 0.55)" }}
                  >
                    아직 표시할 팀 신호가 없습니다.
                  </div>
                ) : (
                  pulseMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="rounded-[1.2rem] px-3 py-3"
                      style={{
                        background: index === 0 ? "rgba(243, 251, 248, 0.98)" : "rgba(248, 250, 247, 0.98)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                          style={{
                            background:
                              index === 0 ? "#6ee3dd" : index === 1 ? "#82a7ff" : "#f09b79",
                          }}
                        >
                          <span>{member.avatar_emoji || statusToEmoji(member.status)}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-xs font-bold">{member.name}</span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-[9px] font-black tracking-[0.12em]"
                                  style={{
                                    background:
                                      index === 0 ? "rgba(23, 166, 158, 0.14)" : "rgba(19, 35, 33, 0.08)",
                                    color: index === 0 ? "#13847d" : "rgba(19, 35, 33, 0.54)",
                                  }}
                                >
                                  {member.status.toUpperCase()}
                                </span>
                              </div>
                              <p
                                className="mt-1 text-xs leading-relaxed"
                                style={{ color: "rgba(19, 35, 33, 0.62)" }}
                              >
                                {member.message}
                              </p>
                            </div>
                            <span
                              className="shrink-0 text-[10px] font-medium"
                              style={{ color: "rgba(19, 35, 33, 0.38)" }}
                            >
                              {toRelativeTime(member.loggedAt)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2 py-1 text-[10px] font-medium"
                              style={{
                                background:
                                  index === 0 ? "rgba(222, 249, 241, 1)" : "rgba(235, 241, 255, 1)",
                                color: index === 0 ? "#1a8e80" : "#5571c8",
                              }}
                            >
                              {index === 0 ? "Fix: optimized token refresh logic" : `Clima score ${member.score}`}
                            </span>
                            <span
                              className="text-[10px] font-bold"
                              style={{
                                color:
                                  member.score >= 60 ? "#20a26f" : member.score >= 40 ? "#6795ce" : "#d27656",
                              }}
                            >
                              {member.score >= 60 ? "SUCCESS INDICATOR" : "REVIEW SIGNAL"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/statistics"
                className="mt-4 flex items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                style={{
                  background: "linear-gradient(90deg, #178e88 0%, #30c7bb 100%)",
                  boxShadow: "0 18px 28px rgba(23, 142, 136, 0.24)",
                }}
              >
                View Full Ecosystem
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          </motion.section>
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-[min(96vw,720px)] items-center justify-between rounded-full px-4 py-3 md:px-5"
        style={{
          background: "rgba(255, 255, 255, 0.86)",
          boxShadow: "0 16px 34px rgba(19, 35, 33, 0.08)",
          backdropFilter: "blur(16px)",
        }}
      >
        {[
          { href: "/dashboard", label: "HOME", icon: "home" as const, active: true },
          { href: "/team", label: "TEAM", icon: "map" as const, active: false },
          { href: "/alerts", label: "ALERTS", icon: "alert" as const, active: false },
          { href: "/personal", label: "PROFILE", icon: "profile" as const, active: false },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex min-w-[68px] flex-col items-center gap-1 rounded-full px-3 py-1.5"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                background: item.active ? "linear-gradient(180deg, #199a93 0%, #13766f 100%)" : "transparent",
              }}
            >
              <BottomNavIcon type={item.icon} active={item.active} />
            </span>
            <span
              className="text-[9px] font-bold tracking-[0.18em]"
              style={{
                color: item.active ? "#1c8b83" : "rgba(19, 35, 33, 0.4)",
              }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

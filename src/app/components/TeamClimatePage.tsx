"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase, DEFAULT_TEAM_ID } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, WeatherStatus } from "../../lib/mood";
import { motion } from "framer-motion";
import { STANDARD_SPRING } from "../constants/springs";
import { UserAvatar } from "./ui";

type MoodLog = {
  score: number;
  message: string | null;
  logged_at: string;
};

type RawUser = {
  id: string;
  name: string;
  avatar_emoji: string;
  mood_logs: MoodLog[];
};

type TeamMember = {
  id: string;
  name: string;
  avatarEmoji: string;
  currentScore: number;
  currentStatus: WeatherStatus;
  message: string;
  recentStatuses: WeatherStatus[];
};

const WEEK_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];

function getFallbackStatuses(score: number): WeatherStatus[] {
  const base = scoreToStatus(score);
  const variants: Record<WeatherStatus, WeatherStatus[]> = {
    Radiant: ["Sunny", "Radiant", "Sunny", "Radiant", "Sunny"],
    Sunny: ["Foggy", "Sunny", "Sunny", "Radiant", "Sunny"],
    Foggy: ["Sunny", "Foggy", "Foggy", "Sunny", "Foggy"],
    Rainy: ["Foggy", "Rainy", "Foggy", "Rainy", "Foggy"],
    Stormy: ["Rainy", "Stormy", "Rainy", "Foggy", "Rainy"],
  };

  return variants[base];
}

function iconForStatus(status: WeatherStatus) {
  switch (status) {
    case "Radiant":
    case "Sunny":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3.8" fill="currentColor" stroke="none" />
          <path d="M12 2.7v3.1M12 18.2v3.1M21.3 12h-3.1M5.8 12H2.7M18.6 5.4l-2.2 2.2M7.6 16.4l-2.2 2.2M18.6 18.6l-2.2-2.2M7.6 7.6 5.4 5.4" />
        </svg>
      );
    case "Foggy":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 10.5a4.5 4.5 0 0 1 8.5-2 3.7 3.7 0 1 1 2.8 6.2H7.3A3.3 3.3 0 0 1 5 10.5Z" />
          <path d="M6 18h12M8 21h8" />
        </svg>
      );
    case "Rainy":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 10.5a4.5 4.5 0 0 1 8.5-2 3.7 3.7 0 1 1 2.8 6.2H7.3A3.3 3.3 0 0 1 5 10.5Z" />
          <path d="M9 18.5v2M13 17.5v3M17 18.5v2" />
        </svg>
      );
    case "Stormy":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M5 10.5a4.5 4.5 0 0 1 8.5-2 3.7 3.7 0 1 1 2.8 6.2H7.3A3.3 3.3 0 0 1 5 10.5Z" />
          <path d="m12 15-2 3h2l-1 3 3-4h-2l1-2Z" />
        </svg>
      );
  }
}

function colorForStatus(status: WeatherStatus) {
  switch (status) {
    case "Radiant":
    case "Sunny":
      return "#f5af0e";
    case "Foggy":
      return "#95a5c8";
    case "Rainy":
      return "#4f8dff";
    case "Stormy":
      return "#293f73";
  }
}

function statusLabel(status: WeatherStatus) {
  if (status === "Radiant") return "Bright";
  if (status === "Sunny") return "Sunny";
  if (status === "Foggy") return "Partly Cloudy";
  if (status === "Rainy") return "Rainy";
  return "Stormy";
}

function buildRecentStatuses(logs: MoodLog[], score: number) {
  const statuses = logs
    .slice()
    .sort((left, right) => new Date(left.logged_at).getTime() - new Date(right.logged_at).getTime())
    .slice(-5)
    .map((log) => scoreToStatus(log.score));

  if (statuses.length === 5) return statuses;

  const fallback = getFallbackStatuses(score);
  return [...fallback.slice(0, 5 - statuses.length), ...statuses];
}

export default function TeamClimatePage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase
        .from("users")
        .select("id, name, avatar_emoji, mood_logs (score, message, logged_at)")
        .eq("team_id", DEFAULT_TEAM_ID)
        .order("logged_at", { referencedTable: "mood_logs", ascending: false });

      if (data) {
        const mapped = (data as RawUser[]).map((user) => {
          const latest = user.mood_logs?.[0];
          const currentScore = latest?.score ?? 64;
          const currentStatus = scoreToStatus(currentScore);

          return {
            id: user.id,
            name: user.name,
            avatarEmoji: user.avatar_emoji || statusToEmoji(currentStatus),
            currentScore,
            currentStatus,
            message: latest?.message ?? "Quiet but steady. No recent blocker signal.",
            recentStatuses: buildRecentStatuses(user.mood_logs ?? [], currentScore),
          };
        });

        setMembers(mapped);
      }

      setLoading(false);
    }

    fetchMembers();
  }, []);

  const visibleMembers = useMemo(() => {
    if (members.length === 0) {
      return [
        {
          id: "fallback-1",
          name: "Minho Kim",
          avatarEmoji: "🧑🏻‍💻",
          currentScore: 86,
          currentStatus: "Sunny" as WeatherStatus,
          message: "Pushed 4 commits to main with zero friction.",
          recentStatuses: ["Sunny", "Sunny", "Foggy", "Sunny", "Sunny"] as WeatherStatus[],
        },
        {
          id: "fallback-2",
          name: "Sasha K.",
          avatarEmoji: "🧑🏽‍🎨",
          currentScore: 68,
          currentStatus: "Foggy" as WeatherStatus,
          message: "Need a lighter review queue before lunch.",
          recentStatuses: ["Rainy", "Rainy", "Foggy", "Sunny", "Sunny"] as WeatherStatus[],
        },
        {
          id: "fallback-3",
          name: "Erik J.",
          avatarEmoji: "🧑🏾‍🔧",
          currentScore: 74,
          currentStatus: "Sunny" as WeatherStatus,
          message: "Resolved API sync with fewer handoffs than expected.",
          recentStatuses: ["Sunny", "Sunny", "Sunny", "Stormy", "Rainy"] as WeatherStatus[],
        },
        {
          id: "fallback-4",
          name: "Liam P.",
          avatarEmoji: "🧪",
          currentScore: 57,
          currentStatus: "Foggy" as WeatherStatus,
          message: "Documentation needs one tighter pass.",
          recentStatuses: ["Foggy", "Foggy", "Foggy", "Foggy", "Foggy"] as WeatherStatus[],
        },
        {
          id: "fallback-5",
          name: "Jiwoo Lee",
          avatarEmoji: "🙂",
          currentScore: 82,
          currentStatus: "Sunny" as WeatherStatus,
          message: "Carried the sprint retro with calm energy.",
          recentStatuses: ["Sunny", "Sunny", "Sunny", "Sunny", "Sunny"] as WeatherStatus[],
        },
      ];
    }

    return members.slice(0, 5);
  }, [members]);

  const averageScore = visibleMembers.length
    ? Math.round(
      visibleMembers.reduce((total, member) => total + member.currentScore, 0) / visibleMembers.length
    )
    : 72;
  const averageStatus = scoreToStatus(averageScore);
  const flattenedStatuses = visibleMembers.flatMap((member) => member.recentStatuses);
  const statusCounts = flattenedStatuses.reduce<Record<WeatherStatus, number>>(
    (accumulator, status) => {
      accumulator[status] += 1;
      return accumulator;
    },
    {
      Radiant: 0,
      Sunny: 0,
      Foggy: 0,
      Rainy: 0,
      Stormy: 0,
    }
  );
  const frequentStatus = (Object.entries(statusCounts).sort((left, right) => (right[1] as number) - (left[1] as number))[0]?.[0] ??
    "Sunny") as WeatherStatus;
  const supportNote =
    averageScore >= 75
      ? "The team climate is stable, but the Backend team needs a little more sunshine."
      : averageScore >= 55
        ? "Momentum is healthy overall, but a few rows still show cloudy drag mid-week."
        : "Collective energy is uneven. Lighten review load before it hardens into fatigue.";

  return (
    <div
      className="min-h-screen px-4 py-4 md:px-5"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(214, 241, 226, 0.88) 0%, rgba(241, 248, 239, 1) 50%, rgba(246, 249, 244, 1) 100%)",
        color: "#17312e",
      }}
    >
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="rounded-[2rem] p-3 md:p-4"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            boxShadow: "0 18px 40px rgba(19, 49, 46, 0.05)",
          }}
        >
          <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-4 rounded-[1.5rem] bg-white/72 p-4 md:p-5">
              <div>
                <div className="text-lg font-black tracking-tight text-[#11847c]">Clima</div>
                <p className="mt-1 text-xs" style={{ color: "rgba(23, 49, 46, 0.48)" }}>
                  Mental Wellness
                </p>
              </div>

              <nav className="space-y-2">
                {[
                  { href: "/dashboard", label: "Dashboard", active: false },
                  { href: "/personal", label: "Personal", active: false },
                  { href: "/team", label: "Team", active: true },
                  { href: "/alerts", label: "Alerts", active: false },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between rounded-full px-4 py-3 text-sm font-bold transition-transform active:scale-[0.98]"
                    style={{
                      background: item.active
                        ? "linear-gradient(90deg, #18b8af 0%, #2cd2c8 100%)"
                        : "transparent",
                      color: item.active ? "#ffffff" : "#32504c",
                      boxShadow: item.active ? "0 12px 24px rgba(24, 184, 175, 0.24)" : "none",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ opacity: item.active ? 1 : 0.45 }}>•</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-auto rounded-[1.5rem] bg-[#effbf8] p-4">
                <p className="text-xs font-bold" style={{ color: "rgba(23, 49, 46, 0.55)" }}>
                  Quick Action
                </p>
                <Link
                  href="/input"
                  className="mt-3 flex items-center justify-center rounded-full px-4 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(90deg, #1ca79f 0%, #28d5c4 100%)",
                    boxShadow: "0 14px 26px rgba(28, 167, 159, 0.22)",
                  }}
                >
                  Daily Check-In
                </Link>
              </div>
            </aside>

            <section className="flex min-w-0 flex-col gap-4">
              <header className="rounded-[1.5rem] bg-white/72 px-4 py-4 md:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-5 text-[11px] font-semibold">
                      {["Dashboard", "Personal", "Team", "Alerts"].map((item) => (
                        <span
                          key={item}
                          style={{
                            color: item === "Team" ? "#11847c" : "rgba(23, 49, 46, 0.5)",
                          }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <h1 className="text-[2rem] font-black tracking-tight text-[#0f5d59]">Team Climate</h1>
                    <p className="mt-1 text-sm" style={{ color: "rgba(23, 49, 46, 0.56)" }}>
                      Visualizing the emotional atmosphere of your collective journey this week.
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className="hidden items-center gap-2 rounded-full px-4 py-2 md:flex"
                      style={{ background: "#eff7f2" }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#6f8b83" strokeWidth="1.8">
                        <circle cx="11" cy="11" r="6.5" />
                        <path d="m16 16 4 4" />
                      </svg>
                      <span className="text-xs" style={{ color: "#7b928b" }}>
                        Search team stats...
                      </span>
                    </div>

                    <div className="flex items-center -space-x-2">
                      {visibleMembers.slice(0, 4).map((member) => (
                        <div
                          key={member.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm"
                          style={{ background: "#fffcf7" }}
                          title={member.name}
                        >
                          <UserAvatar
                            name={member.name}
                            avatarEmoji={member.avatarEmoji}
                            size={32}
                            fallbackTextClassName="text-xs font-black"
                          />
                        </div>
                      ))}
                      <div
                        className="ml-1 flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[10px] font-bold"
                        style={{ background: "#f6efe2", color: "#806747" }}
                      >
                        +{visibleMembers.length + 7}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <article className="rounded-[2rem] bg-white/84 p-4 md:p-6">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-base font-black tracking-tight">Niko-Niko 캘린더</h2>
                    <p className="mt-1 text-xs" style={{ color: "rgba(23, 49, 46, 0.48)" }}>
                      Weekly affect trace by teammate.
                    </p>
                  </div>

                  <div className="inline-flex w-fit rounded-full bg-[#eef5ef] p-1">
                    {["This Week", "Last Week"].map((label, index) => (
                      <span
                        key={label}
                        className="rounded-full px-4 py-2 text-xs font-bold"
                        style={{
                          background: index === 0 ? "#ffffff" : "transparent",
                          color: index === 0 ? "#11847c" : "rgba(23, 49, 46, 0.48)",
                          boxShadow: index === 0 ? "0 8px 18px rgba(18, 132, 124, 0.08)" : "none",
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    <div
                      className="grid items-center gap-y-4 pb-3 text-[10px] font-bold tracking-[0.14em]"
                      style={{
                        gridTemplateColumns: "1.6fr repeat(5, minmax(0, 1fr))",
                        color: "rgba(23, 49, 46, 0.4)",
                      }}
                    >
                      <div>팀원</div>
                      {WEEK_LABELS.map((label) => (
                        <div key={label} className="text-center">
                          {label}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 rounded-[1.6rem] bg-[#fcfffc] p-2">
                      {loading ? (
                        <div className="px-3 py-12 text-sm" style={{ color: "rgba(23, 49, 46, 0.55)" }}>
                          Loading niko traces...
                        </div>
                      ) : (
                        visibleMembers.map((member) => (
                          <div
                            key={member.id}
                            className="grid items-center rounded-[1.25rem] px-3 py-3"
                            style={{
                              gridTemplateColumns: "1.6fr repeat(5, minmax(0, 1fr))",
                              background: "linear-gradient(180deg, rgba(250, 252, 250, 1) 0%, rgba(246, 250, 247, 1) 100%)",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-white shadow-[0_8px_18px_rgba(19,49,46,0.08)]">
                                <UserAvatar
                                  name={member.name}
                                  avatarEmoji={member.avatarEmoji}
                                  size={32}
                                  fallbackTextClassName="text-xs font-black"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="truncate text-sm font-bold">{member.name}</div>
                              </div>
                            </div>

                            {member.recentStatuses.map((status, index) => (
                              <div key={`${member.id}-${index}`} className="flex justify-center">
                                <div
                                  className="flex h-9 w-9 items-center justify-center rounded-full"
                                  style={{
                                    color: colorForStatus(status),
                                    background:
                                      status === "Sunny" || status === "Radiant"
                                        ? "rgba(255, 242, 204, 0.56)"
                                        : status === "Foggy"
                                          ? "rgba(232, 238, 250, 0.7)"
                                          : status === "Rainy"
                                            ? "rgba(222, 236, 255, 0.72)"
                                            : "rgba(221, 229, 244, 0.9)",
                                  }}
                                >
                                  {iconForStatus(status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </article>

              <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)_1.1fr]">
                <div className="hidden xl:block" />

                <article className="rounded-[1.8rem] bg-white/84 p-5">
                  <p className="text-[10px] font-black tracking-[0.18em]" style={{ color: "rgba(23, 49, 46, 0.34)" }}>
                    TEAM AVERAGE
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: "#eef2fb", color: colorForStatus(averageStatus) }}
                    >
                      {iconForStatus(averageStatus)}
                    </div>
                    <div>
                      <div className="text-xl font-black tracking-tight">{statusLabel(averageStatus)}</div>
                      <p className="text-xs" style={{ color: "rgba(23, 49, 46, 0.5)" }}>
                        Overall tone at {averageScore}% stability
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[1.8rem] bg-white/84 p-5">
                  <p className="text-[10px] font-black tracking-[0.18em]" style={{ color: "rgba(23, 49, 46, 0.34)" }}>
                    MOST FREQUENT WEATHER
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full"
                      style={{
                        background: frequentStatus === "Sunny" || frequentStatus === "Radiant" ? "#fff4cf" : "#eef2fb",
                        color: colorForStatus(frequentStatus),
                      }}
                    >
                      {iconForStatus(frequentStatus)}
                    </div>
                    <div>
                      <div className="text-xl font-black tracking-tight">{statusLabel(frequentStatus)}</div>
                      <p className="text-xs" style={{ color: "rgba(23, 49, 46, 0.5)" }}>
                        Occurred {(statusCounts as Record<string, number>)[frequentStatus]} times this week
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[1.8rem] bg-[#f8fcf9] p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: "#eaf7f2", color: "#11847c" }}
                    >
                      ✦
                    </span>
                    <p className="text-sm font-black tracking-tight text-[#0f5d59]">Clima Insights</p>
                  </div>
                  <p className="text-sm italic leading-relaxed" style={{ color: "rgba(23, 49, 46, 0.66)" }}>
                    &ldquo;{supportNote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-[#11847c]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1bb1a5]" />
                    AI POWERED ANALYSIS
                  </div>
                </article>
              </div>

              <footer className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
                <div className="hidden xl:block" />
                <div className="rounded-[1.8rem] bg-white/84 px-5 py-5 md:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-[#0f5d59]">
                        Feeling like a storm today?
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: "rgba(23, 49, 46, 0.55)" }}>
                        It&apos;s okay not to be okay. Reach out for a quick 1:1 or take a softness break.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/alerts"
                        className="rounded-full px-5 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                        style={{
                          background: "#0b6f6c",
                          boxShadow: "0 16px 28px rgba(11, 111, 108, 0.2)",
                        }}
                      >
                        Book a Talk
                      </Link>
                      <Link
                        href="/input"
                        className="rounded-full bg-white px-5 py-3 text-sm font-bold transition-transform active:scale-[0.98]"
                        style={{ color: "#55716d", boxShadow: "0 10px 22px rgba(19, 49, 46, 0.07)" }}
                      >
                        Take a Break
                      </Link>
                    </div>
                  </div>
                </div>
              </footer>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

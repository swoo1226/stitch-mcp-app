"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ClimaLogo from "../components/WetherLogo";
import { ClimaButton, SectionLabel, PrimaryTabToggle } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";
import { STANDARD_SPRING } from "../constants/springs";
import { DEFAULT_TEAM_ID, supabase } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, type WeatherStatus } from "../../lib/mood";

type DisplayWeather = WeatherStatus | "Cloudy";

interface RawUser {
  id: string;
  name: string;
  avatar_emoji: string;
  mood_logs: Array<{ score: number; message: string | null; logged_at: string }>;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  score: number;
  status: WeatherStatus;
  message: string;
}

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Personal", href: "/personal" },
  { label: "Team", href: "/dashboard", active: true },
  { label: "Alerts", href: "/alerts" },
];

function buildWeek(member: Member, index: number): DisplayWeather[] {
  const sunnyBias: DisplayWeather[] = ["Sunny", "Sunny", "Cloudy", "Sunny", "Sunny"];
  const rainyBias: DisplayWeather[] = ["Rainy", "Foggy", "Cloudy", "Cloudy", "Sunny"];
  const stormyBias: DisplayWeather[] = ["Sunny", "Sunny", "Sunny", "Stormy", "Rainy"];
  const foggyBias: DisplayWeather[] = ["Cloudy", "Cloudy", "Cloudy", "Cloudy", "Cloudy"];
  const radiantBias: DisplayWeather[] = ["Sunny", "Sunny", "Sunny", "Sunny", "Sunny"];

  if (member.status === "Radiant") return radiantBias;
  if (member.status === "Sunny") return sunnyBias;
  if (member.status === "Foggy") return index % 2 === 0 ? foggyBias : rainyBias;
  if (member.status === "Rainy") return rainyBias;
  return stormyBias;
}

function scoreToCardStatus(score: number): DisplayWeather {
  if (score >= 80) return "Sunny";
  if (score >= 60) return "Cloudy";
  if (score >= 40) return "Foggy";
  if (score >= 20) return "Rainy";
  return "Stormy";
}

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

export function TeamClimateDashboard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekTab, setWeekTab] = useState<"this" | "last">("this");

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
            avatar: user.avatar_emoji || statusToEmoji(scoreToStatus(score)),
            score,
            status: scoreToStatus(score),
            message: latest?.message ?? "오늘 체크인이 아직 없어요.",
          };
        });

        setMembers(mapped);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const averageScore = members.length
    ? Math.round(members.reduce((sum, member) => sum + member.score, 0) / members.length)
    : 62;

  const mostFrequent = useMemo(() => {
    const counts = new Map<DisplayWeather, number>();
    members.forEach((member, index) => {
      buildWeek(member, index).forEach((status) => {
        counts.set(status, (counts.get(status) ?? 0) + 1);
      });
    });

    if (!counts.size) return "Sunny" as DisplayWeather;

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }, [members]);

  const insightText =
    averageScore >= 70
      ? "The team climate is bright and steady. Keep momentum without overloading your core contributors."
      : averageScore >= 50
        ? "The team climate is stabilizing, but the Backend team needs a little more sunshine."
        : "The team climate is heavy right now. Prioritize recovery space before pushing for speed.";

  const averageStatus = scoreToCardStatus(averageScore);
  const AverageIcon = WEATHER_ICON_MAP[averageStatus];
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
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
              <TopIcon type="bell" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
              <TopIcon type="settings" />
            </button>
            <Link href="/personal" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
              <TopIcon type="profile" />
            </Link>
          </div>
        </motion.header>

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
                <div className="mt-1 text-sm font-medium" style={{ color: "rgba(37, 50, 40, 0.6)" }}>Mental Wellness</div>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: "Dashboard", href: "/", icon: "dashboard" as const },
                { label: "Personal", href: "/personal", icon: "personal" as const },
                { label: "Team", href: "/dashboard", icon: "team" as const, active: true },
                { label: "Alerts", href: "/alerts", icon: "alerts" as const },
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
                Daily Check-in
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
                  <h1 className="mb-3 text-[2.4rem] font-black tracking-tight text-primary md:text-[3.1rem]">
                    Team Climate
                  </h1>
                  <p className="max-w-xl text-lg leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.72)" }}>
                    Visualizing the emotional atmosphere of your collective journey this week. Stay connected, stay mindful.
                  </p>
                </div>

                <div className="flex items-center gap-[-0.5rem] self-start">
                  {members.slice(0, 3).map((member, index) => (
                    <div
                      key={member.id}
                      className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white text-xl shadow-sm first:ml-0"
                      style={{ background: index % 2 === 0 ? "var(--surface-highest)" : "var(--surface-low)" }}
                    >
                      {member.avatar}
                    </div>
                  ))}
                  <div className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-surface-high text-sm font-black text-on-surface">
                    +{Math.max(0, members.length - 3)}
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
                    Niko-Niko Calendar
                  </div>
                </div>

                <PrimaryTabToggle
                  tabs={[
                    { value: "this", label: "This Week" },
                    { value: "last", label: "Last Week" },
                  ]}
                  active={weekTab}
                  onChange={setWeekTab}
                />
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[780px]">
                  <div
                    className="grid grid-cols-[220px_repeat(5,minmax(90px,1fr))] px-3 pb-5 text-sm font-black tracking-[0.08em]"
                    style={{ color: "rgba(37, 50, 40, 0.72)" }}
                  >
                    <div>TEAM MEMBER</div>
                    {DAYS.map((day) => (
                      <div key={day} className="text-center">{day}</div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {(loading ? new Array(5).fill(null) : members.slice(0, 5)).map((member, index) => {
                      if (!member) {
                        return (
                          <div
                            key={`loading-${index}`}
                            className="grid grid-cols-[220px_repeat(5,minmax(90px,1fr))] items-center rounded-[1.6rem] px-3 py-5"
                          >
                            <div className="h-12 w-40 rounded-full bg-surface-low animate-pulse" />
                            {DAYS.map((day) => (
                              <div key={day} className="mx-auto h-8 w-8 rounded-full bg-surface-low animate-pulse" />
                            ))}
                          </div>
                        );
                      }

                      const week = buildWeek(member, index);

                      return (
                        <div
                          key={member.id}
                          className="grid grid-cols-[220px_repeat(5,minmax(90px,1fr))] items-center rounded-[1.8rem] px-3 py-5 transition-colors"
                          style={{ background: "transparent" }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-low text-xl">
                              {member.avatar}
                            </div>
                            <div className="text-[1.05rem] font-extrabold tracking-tight text-on-surface">
                              {member.name}
                            </div>
                          </div>
                          {week.map((status, dayIndex) => {
                            const Icon = WEATHER_ICON_MAP[status];
                            return (
                              <div key={`${member.id}-${dayIndex}`} className="flex justify-center">
                                <Icon size={36} />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6 grid gap-5 xl:grid-cols-3">
              <article
                className="rounded-[2.3rem] px-7 py-7 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
                style={{ background: "rgba(255,255,255,0.86)" }}
              >
                <div className="mb-7 text-center">
                  <SectionLabel color="muted">Team Average</SectionLabel>
                </div>
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-surface-low">
                    <AverageIcon size={56} />
                    <div className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-container)] text-xs font-black text-primary">
                      ↗
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-[2.2rem] font-black tracking-tight text-primary">
                    {averageStatus === "Cloudy" ? "Partly Cloudy" : averageStatus}
                  </div>
                  <div className="text-base leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.62)" }}>
                    Overall team mood is {averageScore >= 60 ? "stable" : "mixed"}.
                  </div>
                </div>
              </article>

              <article
                className="rounded-[2.3rem] px-7 py-7 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
                style={{ background: "rgba(255,255,255,0.86)" }}
              >
                <div className="mb-7 text-center">
                  <SectionLabel color="muted">Most Frequent Weather</SectionLabel>
                </div>
                <div className="mb-6 flex justify-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-low">
                    <FrequentIcon size={56} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-[2.2rem] font-black tracking-tight text-primary">
                    {mostFrequent}
                  </div>
                  <div className="text-base leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.62)" }}>
                    Occurred in {members.length ? Math.max(48, Math.min(84, averageScore)) : 64}% of check-ins.
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
                  <div className="text-[1.05rem] font-black tracking-tight">Climate Insights</div>
                </div>
                <p className="mb-8 text-[1.1rem] italic leading-[1.7] text-on-surface">
                  "{insightText}"
                </p>
                <div className="flex items-center gap-3 text-[0.95rem] font-black uppercase tracking-[0.18em] text-primary">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  AI Powered Analysis
                </div>
              </article>
            </section>

            <section
              className="rounded-[2.5rem] px-6 py-7 md:px-7 md:py-8 shadow-[0_24px_48px_rgba(37,50,40,0.04)]"
              style={{ background: "rgba(228, 245, 229, 0.6)" }}
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-2xl">
                  <h2 className="mb-3 text-[2rem] font-black tracking-tight text-primary">
                    Feeling like a storm today?
                  </h2>
                  <p className="text-lg leading-relaxed" style={{ color: "rgba(37, 50, 40, 0.72)" }}>
                    It's okay to not be okay. Reach out for a quick 1-on-1 talk or request a wellness break with one click.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <ClimaButton className="min-w-[170px] justify-center px-8">
                    Book a Talk
                  </ClimaButton>
                  <ClimaButton variant="secondary" className="min-w-[170px] justify-center px-8">
                    Take a Break
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
  return <TeamClimateDashboard />;
}

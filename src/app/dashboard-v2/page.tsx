"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ClimaLogo from "../components/WetherLogo";
import {
  Badge,
  ClimaButton,
  GlassCard,
  GlassPanel,
  PrimaryTabToggle,
  ProgressBar,
  SectionHeader,
  SectionLabel,
} from "../components/ui";
import { STANDARD_SPRING } from "../constants/springs";
import { DEFAULT_TEAM_ID, supabase } from "../../lib/supabase";
import { scoreToStatus, statusToEmoji, type WeatherStatus } from "../../lib/mood";

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
  loggedAt: string | null;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard-v2", active: true },
  { label: "Current Dashboard", href: "/dashboard" },
  { label: "Niko v2", href: "/niko-v2" },
  { label: "Current Niko", href: "/niko" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
      <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function relativeTime(loggedAt: string | null) {
  if (!loggedAt) return "no record";
  const diff = Math.max(0, Date.now() - new Date(loggedAt).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardV2Page() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [windowTab, setWindowTab] = useState<"today" | "week">("today");

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
            message: latest?.message ?? "아직 오늘 체크인이 없어요.",
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
    ? Math.round(members.reduce((sum, member) => sum + member.score, 0) / members.length)
    : 0;

  const checkedInToday = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayIso = `${y}-${m}-${d}`;
    return members.filter((member) => member.loggedAt?.startsWith(todayIso)).length;
  }, [members]);

  const riskMembers = useMemo(
    () => members.filter((member) => member.score < 40).sort((a, b) => a.score - b.score),
    [members]
  );

  const stableMembers = useMemo(
    () => members.filter((member) => member.score >= 60).sort((a, b) => b.score - a.score),
    [members]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<WeatherStatus, number> = {
      Stormy: 0,
      Rainy: 0,
      Foggy: 0,
      Sunny: 0,
      Radiant: 0,
    };
    members.forEach((member) => {
      counts[member.status] += 1;
    });
    return counts;
  }, [members]);

  const distribution = [
    { label: "Stormy", value: statusCounts.Stormy, tone: "error" as const },
    { label: "Rainy", value: statusCounts.Rainy, tone: "secondary" as const },
    { label: "Foggy", value: statusCounts.Foggy, tone: "surface" as const },
    { label: "Sunny", value: statusCounts.Sunny, tone: "primary" as const },
    { label: "Radiant", value: statusCounts.Radiant, tone: "tertiary" as const },
  ];

  return (
    <div
      className="min-h-screen px-3 py-3 md:px-4 md:py-4"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(197,242,237,0.42) 0%, rgba(235,250,236,0.96) 38%, rgba(228,245,229,1) 100%)",
      }}
    >
      <div
        className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1440px] flex-col gap-4 rounded-[2rem] p-2 backdrop-blur-sm md:p-3"
        style={{ background: "rgba(255,255,255,0.38)" }}
      >
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
          className="rounded-[1.7rem] bg-white/78 px-5 py-4 shadow-[0_18px_38px_rgba(37,50,40,0.05)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center">
                <ClimaLogo />
              </Link>
              <nav className="flex flex-wrap items-center gap-1 md:gap-2">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full px-3 py-2 text-sm font-semibold tracking-tight transition-colors"
                    style={
                      item.active
                        ? { color: "var(--primary)", background: "rgba(0,102,104,0.08)" }
                        : { color: "rgba(37,50,40,0.65)" }
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className="hidden items-center gap-3 rounded-full bg-surface-low px-4 py-2 sm:flex"
                style={{ color: "rgba(37,50,40,0.55)" }}
              >
                <SearchIcon />
                <span className="text-sm font-medium">Search team stats...</span>
              </div>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-low text-on-surface">
                <BellIcon />
              </button>
            </div>
          </div>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...STANDARD_SPRING, delay: 0.06 }}
          className="flex flex-1 flex-col gap-5 rounded-[2rem] px-4 py-5 md:px-6 md:py-6"
          style={{ background: "rgba(235,250,236,0.88)" }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Badge variant="primary" className="mb-3">Comparison Route</Badge>
              <SectionHeader
                icon={<span className="text-lg">📈</span>}
                title="Team Overview"
                subtitle="캘린더를 제거하고 운영 관찰에 필요한 지표만 압축한 dashboard v2입니다."
              />
            </div>

            <PrimaryTabToggle
              tabs={[
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
              ]}
              active={windowTab}
              onChange={setWindowTab}
            />
          </div>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <GlassPanel className="px-5 py-5">
              <SectionLabel color="muted" className="mb-2">Members</SectionLabel>
              <div className="text-4xl font-black text-primary">{loading ? "—" : members.length}</div>
            </GlassPanel>
            <GlassPanel className="px-5 py-5">
              <SectionLabel color="muted" className="mb-2">Avg Score</SectionLabel>
              <div className="text-4xl font-black text-primary">{loading ? "—" : averageScore}</div>
            </GlassPanel>
            <GlassPanel className="px-5 py-5">
              <SectionLabel color="muted" className="mb-2">Checked-in Today</SectionLabel>
              <div className="text-4xl font-black text-on-surface">
                {loading ? "—" : `${checkedInToday}/${members.length}`}
              </div>
            </GlassPanel>
            <GlassPanel className="px-5 py-5">
              <SectionLabel color="muted" className="mb-2">Support Queue</SectionLabel>
              <div className="text-4xl font-black text-tertiary">{loading ? "—" : riskMembers.length}</div>
            </GlassPanel>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <GlassCard className="px-6 py-6" intensity="low">
              <div className="mb-5 flex items-center justify-between gap-4">
                <SectionHeader
                  icon={<span className="text-lg">🌤️</span>}
                  title="Climate Distribution"
                  subtitle="현재 팀 전체의 최신 상태 분포입니다."
                />
                <Link href="/dashboard" className="text-sm font-bold text-primary">
                  View current
                </Link>
              </div>

              <div className="space-y-4">
                {distribution.map((item) => {
                  const total = members.length || 1;
                  const ratio = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label} className="rounded-[1.5rem] bg-white/55 px-4 py-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Badge variant={item.tone}>{item.label}</Badge>
                          <span className="text-sm font-medium text-on-surface/60">
                            {item.value} members
                          </span>
                        </div>
                        <span className="text-sm font-black text-on-surface">{ratio}%</span>
                      </div>
                      <ProgressBar
                        value={ratio}
                        variant={
                          item.tone === "primary"
                            ? "gradient"
                            : item.tone === "secondary"
                              ? "secondary"
                              : item.tone === "error"
                                ? "error"
                                : "primary"
                        }
                        height={10}
                        animate={false}
                      />
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            <GlassCard className="px-6 py-6" intensity="low">
              <div className="mb-5 flex items-center justify-between gap-4">
                <SectionHeader
                  icon={<span className="text-lg">🚨</span>}
                  title="Priority Signals"
                  subtitle="파트 정보가 없으므로 현재는 위험 신호 우선으로 요약합니다."
                />
              </div>

              <div className="space-y-4">
                {(riskMembers.length ? riskMembers : members.slice(0, 3)).map((member) => (
                  <div key={member.id} className="rounded-[1.5rem] bg-white/55 px-4 py-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-low text-xl">
                          {member.avatar}
                        </div>
                        <div>
                          <div className="text-base font-extrabold tracking-tight text-on-surface">{member.name}</div>
                          <div className="text-xs font-medium text-on-surface/50">{relativeTime(member.loggedAt)}</div>
                        </div>
                      </div>
                      <Badge variant={member.score < 40 ? "error" : "secondary"}>{member.status}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface/65">{member.message}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <GlassCard className="px-6 py-6" intensity="low">
              <SectionHeader
                icon={<span className="text-lg">✅</span>}
                title="Stable Core"
                subtitle="현재 상대적으로 안정적인 팀원들입니다."
                className="mb-5"
              />
              <div className="space-y-3">
                {(stableMembers.length ? stableMembers.slice(0, 4) : members.slice(0, 4)).map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-[1.5rem] bg-white/55 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-low text-lg">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-extrabold tracking-tight text-on-surface">{member.name}</div>
                        <div className="text-xs text-on-surface/50">{member.status}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-black text-primary">{member.score}</div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="px-6 py-6" intensity="low">
              <SectionHeader
                icon={<span className="text-lg">💬</span>}
                title="Action Strip"
                subtitle="기존 dashboard보다 CTA 우선순위를 더 분명하게 두는 비교안입니다."
                className="mb-5"
              />
              <div className="rounded-[2rem] bg-surface-low px-5 py-5">
                <p className="mb-5 text-lg leading-relaxed text-on-surface/72">
                  팀 전체 상태를 확인한 뒤 바로 기록을 유도하거나, 기존 dashboard와 비교해서 어떤 정보 구조가 더 읽기 쉬운지 판단할 수 있습니다.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <ClimaButton href="/input" className="min-w-[170px] justify-center px-8">
                    Daily Check-in
                  </ClimaButton>
                  <ClimaButton variant="secondary" href="/dashboard" className="min-w-[170px] justify-center px-8">
                    Open Current Dashboard
                  </ClimaButton>
                </div>
              </div>
            </GlassCard>
          </section>
        </motion.main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ClimaLogo from "./components/WetherLogo";
import { ClimaWave } from "./components/WetherWave";
import { STANDARD_SPRING, HEAVY_SPRING, RESPONSIVE_SPRING } from "./constants/springs";
import DynamicBackground from "./components/DynamicBackground";
import RollingNumber from "./components/RollingNumber";
import { ClimaButton, FAB, Badge, StatCard, SectionLabel, PlayfulGeometry, PageHeadline, SanctuaryCard } from "./components/ui";
import { BottomSheet, BottomSheetOverlay, useBottomSheet } from "./components/BottomSheet";
import { useMotionPreferences } from "./components/useMotionPreferences";
import { supabase, DEFAULT_TEAM_ID } from "../lib/supabase";

interface Team {
  id: string;
  name: string;
}
import { scoreToStatus, WeatherStatus } from "../lib/mood";
import { WEATHER_ICON_MAP } from "./components/WeatherIcons";

interface Member {
  id: string;
  name: string;
  avatar_emoji: string;
  score: number;
  status: WeatherStatus;
  message: string;
}

interface RawUser {
  id: string;
  name: string;
  avatar_emoji: string;
  mood_logs: Array<{ score: number; message: string | null; logged_at: string }>;
}

export default function ClimaDashboard() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team") ?? DEFAULT_TEAM_ID;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { shouldLimitMotion, isMobileLike } = useMotionPreferences();

  useEffect(() => {
    async function fetchData() {
      const [{ data: users }, { data: teamsData }] = await Promise.all([
        supabase
          .from("users")
          .select(`id, name, avatar_emoji, mood_logs (score, message, logged_at)`)
          .eq("team_id", teamId)
          .order("logged_at", { referencedTable: "mood_logs", ascending: false }),
        supabase.from("teams").select("id, name").order("name"),
      ]);

      if (users) {
        const mapped = (users as RawUser[]).map((u) => {
          const latest = u.mood_logs?.[0];
          const score = latest?.score ?? 50;
          const status = scoreToStatus(score);
          return {
            id: u.id,
            name: u.name,
            avatar_emoji: u.avatar_emoji || "",
            score,
            status,
            message: latest?.message ?? "아직 오늘 기록이 없어요.",
          };
        });
        setMembers(mapped);
      }
      if (teamsData) setTeams(teamsData as Team[]);
      setLoading(false);
    }
    fetchData();
  }, [teamId]);

  const averageScore = members.length
    ? Math.round(members.reduce((sum, m) => sum + m.score, 0) / members.length)
    : 50;

  const isStormy = averageScore <= 20;
  const isSunny = averageScore >= 60 && averageScore < 80;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.4 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: STANDARD_SPRING }
  };

  const selectedMember = members.find(m => m.id === selectedId);

  const teamParam = teamId !== DEFAULT_TEAM_ID ? `?team=${teamId}` : "";
  const NAV_ITEMS = [
    { label: "Dashboard", href: `/dashboard${teamParam}` },
    { label: "Personal", href: "/personal" },
    { label: "Team", href: `/dashboard${teamParam}` },
    { label: "Niko-Niko", href: `/niko${teamParam}` },
    { label: "Alerts", href: "/alerts" },
  ];
  const currentTeamName = teams.find(t => t.id === teamId)?.name ?? "팀 선택";

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-surface overflow-x-hidden pb-20">
      <DynamicBackground score={selectedMember ? selectedMember.score : averageScore} />

      {/* ── fixed 헤더 ── */}
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-10 bg-white/70 backdrop-blur-[20px] shadow-[0_40px_40px_-10px_rgba(37,50,40,0.06)]">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ClimaLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {teams.length > 1 && (
              <select
                value={teamId}
                onChange={(e) => {
                  const id = e.target.value;
                  const param = id !== DEFAULT_TEAM_ID ? `?team=${id}` : "";
                  window.location.href = `/${param}`;
                }}
                className="mr-2 rounded-full px-3 py-1.5 text-sm font-semibold border-none outline-none appearance-none cursor-pointer"
                style={{ background: "var(--surface-container-low)", color: "var(--primary)" }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1 text-sm font-semibold tracking-tight transition-colors rounded-full hover:bg-surface-low"
                style={{ color: "rgba(37,50,40,0.55)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2" style={{ color: "rgba(37,50,40,0.7)" }}>
          <Link href="/alerts" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
              <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
            </svg>
          </Link>
          <Link href="/personal" className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="3.2" />
              <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
            </svg>
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
      </header>

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
                    style={{ color: "rgba(37,50,40,0.8)" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          scale: selectedId ? 0.94 : 1,
          borderRadius: selectedId ? "4rem" : "0rem",
          y: selectedId ? -24 : 0,
          opacity: selectedId ? 0.5 : 1,
          x: !shouldLimitMotion && isStormy ? [0, -1, 1, -1, 0] : 0,
          rotateX: !shouldLimitMotion && isSunny ? [0, -2, 2, 0] : 0
        }}
        transition={!shouldLimitMotion && isStormy ? { duration: 0.1, repeat: Infinity } : !shouldLimitMotion && isSunny ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : HEAVY_SPRING}
        className="pt-20 px-10 pb-40 w-full max-w-lg lg:max-w-4xl mx-auto min-h-screen relative z-10"
      >

        <section className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-14 md:mb-20 items-end px-2 relative overflow-hidden">
          <PlayfulGeometry variant="circle" color="var(--primary)" className="w-64 h-64 -top-20 -right-20 lg:hidden" />
          <PlayfulGeometry variant="dots" color="var(--secondary)" className="bottom-0 right-0" />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={STANDARD_SPRING}
          >
            <SectionLabel className="mb-2">The Digital Atrium</SectionLabel>
            <p className="mb-3 text-xs font-bold" style={{ color: "rgba(37,50,40,0.4)" }}>
              {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </p>
            <PageHeadline className="mb-3 md:mb-4 font-black">How is the climate today?</PageHeadline>
            <p className="text-sm md:text-base opacity-60 max-w-sm mb-6 md:mb-8 leading-relaxed font-medium">A sanctuary for team conditions and psychological safety.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={STANDARD_SPRING}
            className="lg:translate-y-12"
          >
            <ClimaWave score={averageScore} />
          </motion.div>
        </section>

        <section>
          <div className="flex justify-between items-end gap-4 mb-8 md:mb-10 pl-2 md:pl-4">
            <h2 className="text-xl md:text-2xl font-bold font-[Plus Jakarta Sans] tracking-tight">Team Garden</h2>
            <span className="text-xs font-black tracking-[0.14em] uppercase opacity-40 text-right">View Historical Trend</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 opacity-40">
              <p className="text-sm font-bold">Loading...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center py-20 opacity-40">
              <p className="text-sm font-bold">아직 팀원이 없어요. 어드민에서 추가해주세요.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-x-12 lg:gap-y-16"
            >
              {members.map((member, index) => (
                <SanctuaryCard
                  key={member.id}
                  as={motion.div}
                  layoutId={member.id}
                  onClick={() => setSelectedId(member.id)}
                  variants={itemVariants}
                  whileHover={isMobileLike ? undefined : { y: -8, scale: 1.02 }}
                  transition={shouldLimitMotion ? STANDARD_SPRING : RESPONSIVE_SPRING}
                  className={`group cursor-pointer ${index % 2 === 1 ? "lg:translate-y-16" : ""}`}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <motion.div
                      layoutId={`icon-${member.id}`}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-[1.75rem] md:rounded-[2rem] bg-surface-container flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:bg-primary/5 transition-colors duration-500"
                    >
                      {member.avatar_emoji
                        ? member.avatar_emoji
                        : (() => { const Icon = WEATHER_ICON_MAP[member.status]; return <Icon size={32} />; })()
                      }
                    </motion.div>
                    <div>
                      <h3 className="font-extrabold text-lg md:text-xl font-[Plus Jakarta Sans] mb-1 tracking-tight">{member.name}</h3>
                      <p className="text-sm font-medium opacity-60 tracking-tight leading-relaxed max-w-[24ch]">{member.message}</p>
                    </div>
                  </div>
                  <div className="absolute top-6 md:top-8 right-6 md:right-10 text-3xl md:text-4xl font-black font-[Plus Jakarta Sans] opacity-[0.05] group-hover:opacity-20 transition-opacity">
                    <RollingNumber value={member.score} />
                  </div>
                  <div className="mt-6 md:mt-8 flex gap-2">
                    <Badge>{member.status}</Badge>
                  </div>
                </SanctuaryCard>
              ))}
            </motion.div>
          )}
        </section>
      </motion.div>

      {!selectedId && (
        <FAB
          href="/input"
          className="fixed bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30 text-sm md:text-base tracking-tight max-w-[calc(100vw-2rem)]"
        >
          Let's Clima
        </FAB>
      )}

      <AnimatePresence>
        {selectedId && selectedMember && (
          <>
            <BottomSheetOverlay onClose={() => setSelectedId(null)} />
            <BottomSheet onClose={() => setSelectedId(null)}>
              {/* 드래그 핸들은 BottomSheet 내부에서 렌더링 */}

              <MemberSheetHeader member={selectedMember} selectedId={selectedId} />

              <div className="flex-1 overflow-y-auto no-scrollbar pb-6 flex flex-col gap-4 md:gap-8 min-h-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...STANDARD_SPRING, delay: 0.1 }}
                  className="bg-surface-low rounded-[1.5rem] md:rounded-[4rem] p-6 md:p-12 shrink-0"
                >
                  <p className="text-sm md:text-2xl font-medium leading-relaxed italic text-on-surface/80 tracking-tight font-[Manrope] break-keep">
                    "{selectedMember.message}"
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 shrink-0">
                  <StatCard
                    label="Clima Score"
                    labelVariant="secondary"
                    value={<><RollingNumber value={selectedMember.score} />%</>}
                  />
                  <StatCard
                    label="Atmosphere"
                    labelVariant="primary"
                    value={selectedMember.status}
                  />
                </div>
              </div>

              <div className="shrink-0 pt-4">
                <ClimaButton variant="tertiary" className="w-full py-4 md:py-7 text-base md:text-xl tracking-tight">
                  Send encouragement
                </ClimaButton>
              </div>
            </BottomSheet>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberSheetHeader({ member, selectedId }: { member: Member; selectedId: string }) {
  const ctx = useBottomSheet();
  return (
    <motion.div
      style={ctx ? { scale: ctx.headerScale, y: ctx.headerY } : undefined}
      className="flex items-center gap-4 md:gap-5 mb-5 md:mb-6 w-full shrink-0"
    >
      <motion.div
        layoutId={`icon-${selectedId}`}
        className="w-16 h-16 md:w-28 md:h-28 shrink-0 rounded-[1.75rem] md:rounded-[3.5rem] bg-surface-container flex items-center justify-center text-3xl md:text-5xl shadow-sm"
      >
        {member.avatar_emoji
          ? member.avatar_emoji
          : (() => { const Icon = WEATHER_ICON_MAP[member.status]; return <Icon size={48} />; })()
        }
      </motion.div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl md:text-4xl font-extrabold tracking-tight mb-1 truncate" style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-surface)" }}>
          {member.name}
        </h2>
        <Badge>{member.status}</Badge>
      </div>
    </motion.div>
  );
}

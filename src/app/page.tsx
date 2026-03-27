"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, Variants } from "framer-motion";
import { useState, useEffect } from "react";
import ClimaLogo from "./components/WetherLogo";
import { ClimaWave } from "./components/WetherWave";
import { STANDARD_SPRING, HEAVY_SPRING, RESPONSIVE_SPRING } from "./constants/springs";
import DynamicBackground from "./components/DynamicBackground";
import RollingNumber from "./components/RollingNumber";
import { ClimaButton } from "./components/ui";
import { useMotionPreferences } from "./components/useMotionPreferences";
import { supabase, DEFAULT_TEAM_ID } from "../lib/supabase";
import { scoreToStatus, statusToEmoji, WeatherStatus } from "../lib/mood";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const dragY = useMotionValue(0);
  const { shouldLimitMotion, isMobileLike } = useMotionPreferences();

  useEffect(() => {
    async function fetchData() {
      // 팀원 목록 + 가장 최근 mood_log 조인
      const { data: users } = await supabase
        .from("users")
        .select(`
          id, name, avatar_emoji,
          mood_logs (score, message, logged_at)
        `)
        .eq("team_id", DEFAULT_TEAM_ID)
        .order("logged_at", { referencedTable: "mood_logs", ascending: false });

      if (users) {
        const mapped = (users as RawUser[]).map((u) => {
          const latest = u.mood_logs?.[0];
          const score = latest?.score ?? 50;
          const status = scoreToStatus(score);
          return {
            id: u.id,
            name: u.name,
            avatar_emoji: u.avatar_emoji,
            score,
            status,
            message: latest?.message ?? "아직 오늘 기록이 없어요.",
          };
        });
        setMembers(mapped);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const averageScore = members.length
    ? Math.round(members.reduce((sum, m) => sum + m.score, 0) / members.length)
    : 50;

  const isStormy = averageScore <= 20;
  const isSunny = averageScore >= 60 && averageScore < 80;

  const headerScale = useTransform(dragY, [0, 300], [0.8, 1]);
  const headerY = useTransform(dragY, [0, 300], [-20, 0]);
  const iconScale = useTransform(dragY, [0, 300], [0.6, 1]);

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

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-surface overflow-x-hidden pb-20">
      <DynamicBackground score={selectedMember ? selectedMember.score : averageScore} />

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
        className="px-4 md:px-8 pt-12 md:pt-16 pb-40 w-full max-w-lg lg:max-w-4xl mx-auto min-h-screen relative z-10"
      >
        <header className="flex justify-between items-center mb-12 md:mb-16 px-2">
          <ClimaLogo />
          <div className="flex gap-4 items-center">
            <ClimaButton variant="icon" href="/statistics">📊</ClimaButton>
            <ClimaButton variant="icon" href="/alerts">⛈️</ClimaButton>
          </div>
        </header>

        <section className="grid lg:grid-cols-2 gap-8 md:gap-12 mb-14 md:mb-20 items-end px-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={STANDARD_SPRING}
          >
            <p className="text-xs font-bold tracking-[0.16em] uppercase mb-3 md:mb-4 text-primary">The Digital Atrium</p>
            <h1 className="headline-sanctuary mb-3 md:mb-4 font-black">How is the climate today?</h1>
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
                <motion.div
                  key={member.id}
                  layoutId={member.id}
                  onClick={() => setSelectedId(member.id)}
                  variants={itemVariants}
                  whileHover={isMobileLike ? undefined : { y: -8, scale: 1.02 }}
                  transition={shouldLimitMotion ? STANDARD_SPRING : RESPONSIVE_SPRING}
                  className={`card-sanctuary group cursor-pointer ${index % 2 === 1 ? "lg:translate-y-16" : ""}`}
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <motion.div
                      layoutId={`icon-${member.id}`}
                      className="w-14 h-14 md:w-16 md:h-16 rounded-[1.75rem] md:rounded-[2rem] bg-surface-container flex items-center justify-center text-2xl md:text-3xl shadow-sm group-hover:bg-primary/5 transition-colors duration-500"
                    >
                      {member.avatar_emoji || statusToEmoji(member.status)}
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
                    <span className="px-3 py-1 rounded-full bg-secondary-container text-xs font-bold text-secondary uppercase tracking-[0.16em]">
                      {member.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </motion.div>

      {!selectedId && (
        <ClimaButton
          href="/input"
          className="fixed bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30 shadow-2xl py-4 md:py-5 whitespace-nowrap text-sm md:text-base tracking-tight max-w-[calc(100vw-2rem)]"
        >
          Let's Clima
        </ClimaButton>
      )}

      <AnimatePresence>
        {selectedId && selectedMember && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className={`fixed inset-0 bg-on-surface/5 z-40 will-change-opacity ${
                shouldLimitMotion ? "" : "backdrop-blur-3xl"
              }`}
            />
            <motion.div
              layoutId={selectedId}
              style={{ y: dragY }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 400 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.y > 150) setSelectedId(null);
              }}
              transition={STANDARD_SPRING}
              className="fixed inset-x-0 bottom-0 z-50 bg-white-sanctuary px-5 md:px-12 pt-5 md:pt-12 pb-8 md:pb-10 shadow-ambient h-[85vh] flex flex-col border-none rounded-t-[2rem] md:rounded-t-[5rem] overflow-hidden will-change-transform"
            >
              <div className="w-12 h-1.5 bg-on-surface/20 rounded-full mx-auto mb-5 md:mb-6 opacity-50 shrink-0" />

              <motion.div
                style={{ scale: headerScale, y: headerY }}
                className="flex items-center gap-4 md:gap-5 mb-5 md:mb-6 w-full shrink-0"
              >
                <motion.div
                  layoutId={`icon-${selectedId}`}
                  style={{ scale: iconScale }}
                  className="w-16 h-16 md:w-28 md:h-28 shrink-0 rounded-[1.75rem] md:rounded-[3.5rem] bg-surface-container flex items-center justify-center text-3xl md:text-5xl shadow-sm"
                >
                  {selectedMember.avatar_emoji || statusToEmoji(selectedMember.status)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-4xl font-extrabold font-[Plus Jakarta Sans] tracking-tight mb-1 truncate text-on-surface">
                    {selectedMember.name}
                  </h2>
                  <span className="px-3 py-1 bg-secondary-container text-xs font-bold text-secondary uppercase tracking-[0.16em] rounded-full inline-block">
                    {selectedMember.status}
                  </span>
                </div>
              </motion.div>

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
                  <motion.div
                    whileHover={isMobileLike ? undefined : { scale: 1.02 }}
                    className="bg-surface-container p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 block mb-2 md:mb-4 text-secondary">Clima Score</span>
                    <div className="text-3xl md:text-5xl font-black font-[Plus Jakarta Sans] text-on-surface">
                      <RollingNumber value={selectedMember.score} />%
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={isMobileLike ? undefined : { scale: 1.02 }}
                    className="bg-surface-container p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 block mb-2 md:mb-4 text-primary">Atmosphere</span>
                    <div className="text-3xl md:text-5xl font-black font-[Plus Jakarta Sans] text-on-surface">{selectedMember.status}</div>
                  </motion.div>
                </div>
              </div>

              <div className="shrink-0 pt-4">
                <ClimaButton variant="tertiary" className="w-full py-4 md:py-7 text-base md:text-xl tracking-tight">
                  Send encouragement
                </ClimaButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

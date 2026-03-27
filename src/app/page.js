"use client";

import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useState } from "react";
import ClimaLogo from "./components/WetherLogo";
import { ClimaWave } from "./components/WetherWave";
import Link from "next/link";
import { STANDARD_SPRING, HEAVY_SPRING, RESPONSIVE_SPRING } from "./constants/springs";
import DynamicBackground from "./components/DynamicBackground";
import RollingNumber from "./components/RollingNumber";
import { ClimaButton } from "./components/ui";

const TEAM_MEMBERS = [
  { id: "1", name: "김태영", status: "Sunny", score: 92, message: "오늘 기분 최고예요!" },
  { id: "2", name: "이서연", status: "Cloudy", score: 65, message: "조금 피곤하네요." },
  { id: "3", name: "박민준", status: "Rainy", score: 45, message: "집중이 잘 안 돼요." },
  { id: "4", name: "정지원", status: "Sunny", score: 88, message: "활기찬 하루입니다." },
];

export default function ClimaDashboard() {
  const [selectedId, setSelectedId] = useState(null);
  const dragY = useMotionValue(0);

  const averageScore = 78; // Calculated average

  // Phase 4: Metaphor-based Jitter/Floating
  const isStormy = averageScore <= 20;
  const isCloudy = averageScore >= 61 && averageScore <= 80;

  // Header Morphing
  const headerScale = useTransform(dragY, [0, 300], [0.8, 1]);
  const headerY = useTransform(dragY, [0, 300], [-20, 0]);
  const iconScale = useTransform(dragY, [0, 300], [0.6, 1]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: STANDARD_SPRING
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-surface overflow-x-hidden pb-20">
      <DynamicBackground score={selectedId ? TEAM_MEMBERS.find(m => m.id === selectedId).score : averageScore} />

      <motion.div
        animate={{
          scale: selectedId ? 0.94 : 1,
          borderRadius: selectedId ? "4rem" : "0rem",
          y: selectedId ? -24 : 0,
          opacity: selectedId ? 0.5 : 1,
          // Jitter for Stormy condition
          x: isStormy ? [0, -1, 1, -1, 0] : 0,
          // Floating for Cloudy condition
          rotateX: isCloudy ? [0, -2, 2, 0] : 0
        }}
        transition={isStormy ? { duration: 0.1, repeat: Infinity } : isCloudy ? { duration: 8, repeat: Infinity, ease: "easeInOut" } : HEAVY_SPRING}
        className="px-4 md:px-8 pt-12 md:pt-16 pb-40 w-full max-w-lg lg:max-w-4xl mx-auto min-h-screen relative z-10"
      >
        <header className="flex justify-between items-center mb-16 px-2">
          <ClimaLogo />
          <div className="flex gap-4 items-center">
            <ClimaButton variant="icon" href="/statistics">📊</ClimaButton>
            <ClimaButton variant="icon" href="/alerts">⛈️</ClimaButton>
          </div>
        </header>

        <section className="grid lg:grid-cols-2 gap-12 mb-20 items-end px-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={STANDARD_SPRING}
          >
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-primary">The Digital Atrium</p>
            <h1 className="headline-sanctuary mb-4 font-black">How is the climate today, Sangwoo?</h1>
            <p className="text-sm opacity-60 max-w-sm mb-8 leading-relaxed font-medium">A sanctuary for team conditions and psychological safety.</p>
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
          <div className="flex justify-between items-end mb-10 pl-4">
            <h2 className="text-2xl font-bold font-[Plus Jakarta Sans] tracking-tight">Team Garden</h2>
            <span className="text-[10px] font-black tracking-widest uppercase opacity-30">View Historical Trend</span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid lg:grid-cols-2 gap-8 lg:gap-x-12 lg:gap-y-16"
          >
            {TEAM_MEMBERS.map((member, index) => (
              <motion.div
                key={member.id}
                layoutId={member.id}
                onClick={() => setSelectedId(member.id)}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={RESPONSIVE_SPRING}
                className={`card-sanctuary group cursor-pointer ${index % 2 === 1 ? "lg:translate-y-16" : ""
                  }`}
              >
                <div className="flex items-center gap-6">
                  <motion.div
                    layoutId={`icon-${member.id}`}
                    className="w-16 h-16 rounded-[2rem] bg-surface-container flex items-center justify-center text-3xl shadow-sm group-hover:bg-primary/5 transition-colors duration-500"
                  >
                    {member.status === "Sunny" ? "☀️" : member.status === "Cloudy" ? "☁️" : "🌧️"}
                  </motion.div>
                  <div>
                    <h3 className="font-extrabold text-xl font-[Plus Jakarta Sans] mb-1 tracking-tight">{member.name}</h3>
                    <p className="text-xs font-medium opacity-50 tracking-tight">{member.message}</p>
                  </div>
                </div>
                <div className="absolute top-8 right-10 text-4xl font-black font-[Plus Jakarta Sans] opacity-[0.05] group-hover:opacity-20 transition-opacity">
                  <RollingNumber value={member.score} />
                </div>

                <div className="mt-8 flex gap-2">
                  <span className="px-3 py-1 rounded-full bg-secondary-container text-[10px] font-bold text-secondary uppercase tracking-widest">
                    {member.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </motion.div>

      {!selectedId && (
        <ClimaButton
          href="/input"
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 px-8 md:px-14 shadow-2xl py-6 whitespace-nowrap text-base tracking-tight"
        >
          Let's Clima
        </ClimaButton>
      )}

      <AnimatePresence>
        {selectedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 bg-on-surface/5 backdrop-blur-3xl z-40 will-change-opacity"
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
              className="fixed inset-x-0 bottom-0 z-50 bg-white-sanctuary px-6 md:px-12 pt-6 md:pt-12 pb-10 shadow-ambient h-[85vh] flex flex-col border-none rounded-t-[2.5rem] md:rounded-t-[5rem] overflow-hidden will-change-transform"
            >
              <div className="w-12 h-1.5 bg-on-surface/20 rounded-full mx-auto mb-6 opacity-50 shrink-0" />

              <motion.div
                style={{ scale: headerScale, y: headerY }}
                className="flex items-center gap-5 mb-6 w-full shrink-0"
              >
                <motion.div
                  layoutId={`icon-${selectedId}`}
                  style={{ scale: iconScale }}
                  className="w-16 h-16 md:w-28 md:h-28 shrink-0 rounded-[2rem] md:rounded-[3.5rem] bg-surface-container flex items-center justify-center text-3xl md:text-5xl shadow-sm"
                >
                  {TEAM_MEMBERS.find(m => m.id === selectedId).status === "Sunny" ? "☀️" : "☁️"}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl md:text-5xl font-extrabold font-[Plus Jakarta Sans] tracking-tight mb-1 truncate text-on-surface">
                    {TEAM_MEMBERS.find(m => m.id === selectedId).name}
                  </h2>
                  <span className="px-3 py-1 bg-secondary-container text-[10px] md:text-xs font-bold text-secondary uppercase tracking-[0.2em] rounded-full inline-block">
                    {TEAM_MEMBERS.find(m => m.id === selectedId).status}
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
                    "{TEAM_MEMBERS.find(m => m.id === selectedId).message} 최근 업무에 대한 몰입도가 매우 높은 상태입니다."
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface-container p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 block mb-2 md:mb-4 text-secondary">Focus Score</span>
                    <div className="text-3xl md:text-5xl font-black font-[Plus Jakarta Sans] text-on-surface">
                      <RollingNumber value={TEAM_MEMBERS.find(m => m.id === selectedId).score} />%
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-surface-container p-6 md:p-10 rounded-[1.5rem] md:rounded-[3rem]"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] opacity-40 block mb-2 md:mb-4 text-primary">Atmosphere</span>
                    <div className="text-3xl md:text-5xl font-black font-[Plus Jakarta Sans] text-on-surface">Calm</div>
                  </motion.div>
                </div>
              </div>

              <div className="shrink-0 pt-4">
                <ClimaButton className="w-full py-4 md:py-7 text-base md:text-xl tracking-tight">
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

"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { IconSunny } from "../WeatherIcons";
import { STANDARD_SPRING } from "../../constants/springs";

export default function LandingHero() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-16 overflow-hidden"
      style={{
        background: "var(--landing-hero-gradient)",
      }}
    >
      {/* Background decoration */}
      <div
        className="absolute top-20 right-0 md:right-10 w-[280px] md:w-[420px] h-[280px] md:h-[420px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--weather-radiant-blob-2) 22%, transparent) 0%, color-mix(in srgb, var(--weather-radiant-blob-2) 8%, transparent) 50%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-10 left-0 w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%)",
        }}
      />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 w-full max-w-[1280px] mx-auto px-6 md:px-10 xl:px-16 py-16 md:py-24"
      >
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Left: text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...STANDARD_SPRING, delay: 0.05 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] mb-6"
              style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              팀 컨디션 관리 도구, 클라이마(Clima)
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...STANDARD_SPRING, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-[3.5rem] xl:text-[4rem] font-black tracking-tight leading-[1.08] mb-6"
              style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-surface)" }}
            >
              우리 팀의 오늘 날씨,
              <br />
              <span
                style={{
                  backgroundImage: "linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 78%, white) 40%, color-mix(in srgb, var(--primary) 58%, white) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                맑음
              </span>
              일까요?
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...STANDARD_SPRING, delay: 0.16 }}
              className="text-base md:text-lg font-medium leading-relaxed mb-8 max-w-md"
              style={{ color: "var(--text-muted)" }}
            >
              팀원은 하루 10초로 컨디션을 공유하고, 팀장은 뇌우가 몰아치기 전에 먼저 알아챌 수 있어요.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...STANDARD_SPRING, delay: 0.22 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                href="/request-access"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
                style={{
                  background: "var(--button-primary-gradient)",
                  color: "var(--on-primary)",
                  boxShadow: "var(--button-primary-shadow)",
                }}
              >
                우리 팀도 써보기
              </Link>
              <Link
                href="/dashboard?team=demo"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:bg-surface-container active:scale-95"
                style={{ background: "var(--surface-overlay)", color: "var(--primary)", backdropFilter: "var(--glass-blur-low)", boxShadow: "var(--button-subtle-shadow)" }}
              >
                대시보드 미리보기
              </Link>
            </motion.div>
          </div>

          {/* Right: Sun icon + floating cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...STANDARD_SPRING, delay: 0.18 }}
            className="relative flex items-center justify-center min-h-[320px] md:min-h-[440px]"
          >
            {/* Main sun */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="relative z-10"
            >
              <div
                className="w-[180px] h-[180px] md:w-[240px] md:h-[240px] rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle at 38% 34%, color-mix(in srgb, var(--weather-radiant-blob-2) 72%, white), var(--weather-radiant-blob-1))",
                  boxShadow: "0 0 60px color-mix(in srgb, var(--weather-radiant-blob-2) 35%, transparent), 0 0 120px color-mix(in srgb, var(--weather-radiant-blob-1) 18%, transparent)",
                }}
              >
                <IconSunny size={136} />
              </div>
            </motion.div>

            {/* Floating score badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...STANDARD_SPRING, delay: 0.4 }}
              className="absolute top-6 right-4 md:right-0 rounded-[1.5rem] px-5 py-3"
              style={{
                background: "var(--surface-elevated)",
                backdropFilter: "var(--glass-blur)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-soft)" }}>팀 컨디션</p>
              <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>82</p>
            </motion.div>

            {/* Floating member card */}
            <motion.div
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ ...STANDARD_SPRING, delay: 0.52 }}
              className="absolute bottom-8 left-0 md:-left-6 rounded-[1.5rem] px-4 py-3 flex items-center gap-3"
              style={{
                background: "var(--surface-elevated)",
                backdropFilter: "var(--glass-blur)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              <div
                className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0"
                style={{ background: "color-mix(in srgb, var(--weather-radiant-blob-2) 16%, var(--surface-overlay))" }}
              >
                <IconSunny size={24} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>오늘 맑음 3명</p>
                <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>전원 체크인 완료 ✓</p>
              </div>
            </motion.div>

            {/* Orbit ring */}
            <div
              className="absolute w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full pointer-events-none"
              style={{ border: "1.5px dashed color-mix(in srgb, var(--primary) 20%, transparent)" }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: "var(--text-soft)" }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em]">스크롤</p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}

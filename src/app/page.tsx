"use client";

import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { useState, useRef } from "react";
import ClimaLogo from "./components/WetherLogo";
import ThemeToggleButton from "./components/ThemeToggleButton";
import { STANDARD_SPRING } from "./constants/springs";
import {
  IconSunny, IconFoggy, IconRainy, IconStormy, IconRadiant,
} from "./components/WeatherIcons";
import { statusToKo } from "../lib/mood";

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "개인 현황", href: "/personal" },
  { label: "팀", href: "/dashboard" },
  { label: "Niko-Niko", href: "/niko" },
  { label: "알림", href: "/alerts", disabled: true },
];

// ─── Weather states data ────────────────────────────────────────────────────
const WEATHER_STATES = [
  {
    icon: IconRadiant,
    status: "Radiant" as const,
    range: "81–100",
    desc: "에너지가 넘쳐흘러요 — 아이디어가 쏟아지고 팀 전체가 들떠 있어요.",
    bg: "color-mix(in srgb, var(--weather-radiant-blob-2) 14%, var(--surface-elevated))",
    accent: "var(--weather-radiant-blob-1)",
  },
  {
    icon: IconSunny,
    status: "Sunny" as const,
    range: "61–80",
    desc: "집중력이 좋고 긍정적인 하루예요 — 맑고 생산적인 기운이 가득해요.",
    bg: "color-mix(in srgb, var(--weather-sunny-blob-2) 12%, var(--surface-elevated))",
    accent: "var(--weather-sunny-blob-1)",
  },
  {
    icon: IconFoggy,
    status: "Foggy" as const,
    range: "41–60",
    desc: "앞이 잘 보이지 않아요 — 에너지가 낮고 방향감이 흐릿한 상태예요.",
    bg: "color-mix(in srgb, var(--weather-foggy-blob-2) 16%, var(--surface-elevated))",
    accent: "var(--weather-foggy-blob-1)",
  },
  {
    icon: IconRainy,
    status: "Rainy" as const,
    range: "21–40",
    desc: "오늘은 많이 힘들어요 — 지지와 관심이 필요한 상태예요.",
    bg: "color-mix(in srgb, var(--weather-rainy-blob-2) 14%, var(--surface-elevated))",
    accent: "var(--weather-rainy-blob-2)",
  },
  {
    icon: IconStormy,
    status: "Stormy" as const,
    range: "0–20",
    desc: "위기 상태예요 — 즉각적인 보살핌과 체크인이 필요해요.",
    bg: "color-mix(in srgb, var(--weather-stormy-blob-2) 18%, var(--surface-elevated))",
    accent: "var(--weather-stormy-blob-2)",
  },
];

// ─── HOW IT WORKS steps ──────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    num: "01",
    title: "팀원이 매일 체크인해요",
    desc: "1~100 사이의 점수 하나면 끝이에요. 부담 없이, 솔직하게.",
  },
  {
    num: "02",
    title: "점수가 날씨로 변환돼요",
    desc: "숫자가 직관적인 날씨 메타포로 바뀌어요 — 설명 없이도 팀 전체가 바로 이해해요.",
  },
  {
    num: "03",
    title: "팀장이 먼저 알아채요",
    desc: "실시간 팀 컨디션과 주간 추이를 보고, 문제가 커지기 전에 선제적으로 움직일 수 있어요.",
  },
];

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...STANDARD_SPRING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--surface)" }}
    >
      {/* ── Header ── */}
      <header
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-6 md:px-10"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
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
                className="px-3 py-1 text-sm font-semibold tracking-tight transition-colors rounded-full hover:bg-surface-low"
                style={{ color: "var(--text-muted)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          <Link
            href="/input"
            className="hidden md:inline-flex items-center h-9 px-5 rounded-full text-sm font-bold transition-all hover:opacity-80"
            style={{
              background: "var(--button-primary-gradient)",
              color: "var(--on-primary)",
              boxShadow: "var(--button-primary-shadow)",
            }}
          >
            오늘 체크인하기
          </Link>
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
            onClick={() => setMobileNavOpen(true)}
            style={{ color: "var(--header-action-color)" }}
            aria-label="메뉴 열기"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={STANDARD_SPRING}
              className="fixed right-0 top-0 h-full w-72 z-[70] flex flex-col"
              style={{ background: "var(--drawer-bg)", backdropFilter: "var(--glass-blur)" }}
            >
              <div className="flex items-center justify-between px-6 h-16 shrink-0">
                <ClimaLogo />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-low transition-colors"
                  style={{ color: "var(--text-soft)" }}
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
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 px-2">
                  <Link
                    href="/input"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center h-14 rounded-[1.5rem] text-base font-bold"
                    style={{ background: "var(--button-primary-gradient)", color: "var(--on-primary)" }}
                  >
                    오늘 체크인하기
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Hero Section ── */}
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
                팀 컨디션 관리 도구
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
                팀원의 컨디션을 날씨로 표현해요. 팀장은 한눈에 팀 분위기를 파악하고, 문제가 커지기 전에 먼저 움직일 수 있어요.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...STANDARD_SPRING, delay: 0.22 }}
                className="flex flex-wrap gap-3"
              >
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
                  style={{
                    background: "var(--button-primary-gradient)",
                    color: "var(--on-primary)",
                    boxShadow: "var(--button-primary-shadow)",
                  }}
                >
                  팀 컨디션 확인하기
                </Link>
                <Link
                  href="/input"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:bg-surface-container active:scale-95"
                  style={{ background: "var(--surface-overlay)", color: "var(--primary)", backdropFilter: "var(--glass-blur-low)", boxShadow: "var(--button-subtle-shadow)" }}
                >
                  오늘 체크인하기
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
                  <IconSunny size={100} />
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

      {/* ── How It Works ── */}
      <section className="py-24 md:py-32 px-6 md:px-10 xl:px-16">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left: feature steps */}
            <div>
              <FadeIn>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
                  이런 식으로 작동해요
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-6" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                  팀 컨디션을
                  <br />
                  <span style={{ color: "var(--primary)" }}>날씨로 읽어요</span>
                </h2>
                <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
                  숫자보다 날씨가 더 빠르게 전달돼요. 팀장은 한눈에 팀의 분위기를 파악하고, 팀원은 부담 없이 솔직하게 표현할 수 있어요.
                </p>
              </FadeIn>
            </div>

            {/* Right: numbered steps */}
            <div className="flex flex-col gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <FadeIn key={step.num} delay={i * 0.1}>
                  <div
                    className="flex gap-5 rounded-[2rem] px-6 py-5"
                    style={{ background: "var(--surface-overlay)", backdropFilter: "var(--glass-blur-low)", boxShadow: "var(--glass-shadow)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 text-sm font-black"
                      style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <p className="font-bold text-base mb-1 tracking-tight" style={{ color: "var(--on-surface)" }}>{step.title}</p>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Weather States ── */}
      <section
        className="py-24 md:py-32 px-6 md:px-10 xl:px-16"
        style={{ background: "color-mix(in srgb, var(--surface-elevated) 65%, transparent)" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
              5가지 날씨 상태
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Public Sans', sans-serif" }}>
              내 마음의 날씨를 읽어요
            </h2>
            <p className="text-base font-medium mt-4 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
              기분 점수가 날씨 상태로 자동 변환돼요 — 팀 전체가 별도 설명 없이 바로 이해할 수 있어요.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {WEATHER_STATES.map((state, i) => (
              <FadeIn key={state.status} delay={i * 0.06}>
                <div
                  className="rounded-[2rem] p-5 md:p-6 flex flex-col gap-3 transition-transform hover:scale-[1.02] cursor-default"
                  style={{
                    background: state.bg,
                    backdropFilter: "var(--glass-blur-low)",
                    boxShadow: "var(--glass-shadow)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <state.icon size={40} />
                    <span
                      className="text-xs font-black rounded-full px-3 py-1"
                      style={{ background: "var(--surface-overlay)", color: state.accent }}
                    >
                      {state.range}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-base tracking-tight mb-1" style={{ color: "var(--on-surface)" }}>{statusToKo(state.status)}</p>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{state.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insights Preview ── */}
      <section className="py-24 md:py-32 px-6 md:px-10 xl:px-16">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left: mock dashboard */}
            <FadeIn y={32}>
              <div
                className="rounded-[2.5rem] overflow-hidden"
                style={{
                  background: "var(--surface-elevated)",
                  backdropFilter: "var(--glass-blur-medium)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                {/* Mock header */}
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--weather-radiant-blob-1)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--primary)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--track-bg)" }} />
                  <span className="ml-2 text-xs font-bold" style={{ color: "var(--text-soft)" }}>팀 대시보드 — 이번 주</span>
                </div>

                {/* Mini stats row */}
                <div className="grid grid-cols-3 gap-px" style={{ background: "var(--border-subtle)" }}>
                  {[
                    { label: "팀 컨디션", value: "78", color: "var(--primary)" },
                    { label: "체크인", value: "8/10", color: "var(--secondary)" },
                    { label: "추이", value: "+12%", color: "color-mix(in srgb, var(--primary) 56%, #27ae60)" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center py-4 px-3" style={{ background: "var(--surface-overlay)" }}>
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-soft)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mock bar chart */}
                <div className="px-6 py-6">
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-soft)" }}>주간 추이</p>
                  <div className="flex items-end gap-2 h-[80px]">
                    {[55, 62, 71, 68, 78, 74, 82].map((val, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${(val / 100) * 80}px` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                        className="flex-1 rounded-t-lg"
                        style={{
                          background: i === 6
                            ? "linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 72%, white))"
                            : "color-mix(in srgb, var(--primary) 18%, transparent)",
                          minHeight: 4,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                      <p key={d} className="flex-1 text-center text-[9px] font-bold" style={{ color: "var(--text-soft)" }}>{d}</p>
                    ))}
                  </div>
                </div>

                {/* Mock member list */}
                <div className="px-6 pb-6 flex flex-col gap-2">
                  {[
                    { name: "팀원 A", status: "Sunny" as const, score: 82, Icon: IconSunny, color: "color-mix(in srgb, var(--weather-sunny-blob-2) 18%, var(--surface-overlay))" },
                    { name: "팀원 B", status: "Foggy" as const, score: 58, Icon: IconFoggy, color: "color-mix(in srgb, var(--weather-foggy-blob-2) 18%, var(--surface-overlay))" },
                    { name: "팀원 C", status: "Rainy" as const, score: 18, Icon: IconRainy, color: "color-mix(in srgb, var(--weather-rainy-blob-2) 14%, var(--surface-overlay))" },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3 rounded-[1.2rem] px-4 py-2.5" style={{ background: "var(--button-subtle-bg)" }}>
                      <div className="w-8 h-8 rounded-[0.75rem] flex items-center justify-center shrink-0" style={{ background: m.color }}>
                        <m.Icon size={18} />
                      </div>
                      <p className="flex-1 text-sm font-bold" style={{ color: "var(--on-surface)" }}>{m.name}</p>
                      <span className="text-xs font-black" style={{ color: "var(--primary)" }}>{m.score}pt</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Right: text */}
            <div className="flex flex-col gap-6">
              <FadeIn>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
                  팀장을 위한 인사이트
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                  팀 컨디션{" "}
                  <span style={{ color: "var(--primary)" }}>한눈에 파악</span>
                </h2>
                <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
                  Niko-Niko 캘린더와 주간 추이를 통해 팀장이 문제가 커지기 전에 패턴을 먼저 발견할 수 있어요.
                </p>
              </FadeIn>

              <div className="flex flex-col gap-4">
                {[
                  { icon: "📅", title: "주간 체크인 기록", desc: "팀 전체의 일별 체크인 패턴을 한눈에 파악해요." },
                  { icon: "⚡", title: "즉각 알림", desc: "팀원의 날씨가 비 또는 번개로 떨어지면 바로 알려줘요." },
                ].map((feat, i) => (
                  <FadeIn key={feat.title} delay={0.1 + i * 0.1}>
                    <div
                      className="flex gap-4 rounded-[1.75rem] px-6 py-5"
                      style={{ background: "var(--surface-overlay)", backdropFilter: "var(--glass-blur-low)", boxShadow: "var(--glass-shadow)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 text-lg"
                        style={{ background: "var(--highlight-soft)" }}
                      >
                        {feat.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: "var(--on-surface)" }}>{feat.title}</p>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{feat.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={0.3}>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:opacity-90 hover:scale-[1.01]"
                  style={{
                    background: "var(--button-primary-gradient)",
                    color: "var(--on-primary)",
                    boxShadow: "var(--button-primary-shadow)",
                  }}
                >
                  대시보드 둘러보기 →
                </Link>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 md:py-28 px-6 md:px-10 xl:px-16">
        <div className="max-w-[1280px] mx-auto">
          <FadeIn>
            <div
              className="rounded-[3rem] px-8 md:px-16 py-12 md:py-16 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, var(--primary-container) 0%, color-mix(in srgb, var(--primary) 64%, var(--primary-container)) 50%, var(--primary) 100%)",
                boxShadow: "var(--button-primary-shadow)",
              }}
            >
              {/* Background circles */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }} />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }} />

              <div className="relative z-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4" style={{ color: "color-mix(in srgb, var(--on-primary) 64%, transparent)" }}>
                  지금 시작해요
                </p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-primary)" }}>
                  우리 팀, 오늘 어때요?
                </h2>
                <p className="text-base md:text-lg font-medium mb-10 max-w-md mx-auto" style={{ color: "color-mix(in srgb, var(--on-primary) 72%, transparent)" }}>
                  10초면 충분해요. 팀장도, 팀원도 지금 바로 시작할 수 있어요.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/input"
                    className="inline-flex items-center gap-2 h-14 px-10 rounded-[1.5rem] text-base font-bold transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: "var(--surface-lowest)", color: "var(--primary)", boxShadow: "var(--glass-shadow)" }}
                  >
                    오늘 체크인하기 ☀️
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 h-14 px-10 rounded-[1.5rem] text-base font-bold transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "color-mix(in srgb, var(--on-primary) 14%, transparent)", color: "var(--on-primary)", backdropFilter: "var(--glass-blur-low)" }}
                  >
                    팀장 대시보드
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-10 xl:px-16 py-10" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <ClimaLogo />
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>
            © 2026 Clima
          </p>
        </div>
      </footer>
    </div>
  );
}

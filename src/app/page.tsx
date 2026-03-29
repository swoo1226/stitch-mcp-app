"use client";

import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform, useInView } from "framer-motion";
import { useState, useRef } from "react";
import ClimaLogo from "./components/WetherLogo";
import { STANDARD_SPRING } from "./constants/springs";
import {
  IconSunny, IconCloudy, IconFoggy, IconRainy, IconStormy, IconRadiant,
} from "./components/WeatherIcons";

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Personal", href: "/personal" },
  { label: "Team", href: "/dashboard" },
  { label: "Niko-Niko", href: "/niko" },
  { label: "Alerts", href: "/alerts" },
];

// ─── Weather states data ────────────────────────────────────────────────────
const WEATHER_STATES = [
  {
    icon: IconRadiant,
    name: "Radiant",
    range: "91–100",
    desc: "Bursting with energy — ideas flow, team lifts up.",
    bg: "rgba(255,220,80,0.12)",
    accent: "#F5A623",
  },
  {
    icon: IconSunny,
    name: "Sunny",
    range: "71–90",
    desc: "Focused and positive — a productive, clear day.",
    bg: "rgba(245,166,35,0.1)",
    accent: "#E8972B",
  },
  {
    icon: IconCloudy,
    name: "Cloudy",
    range: "41–70",
    desc: "Balanced but thoughtful — a little mental weight.",
    bg: "rgba(116,185,232,0.12)",
    accent: "#5b9bd5",
  },
  {
    icon: IconFoggy,
    name: "Foggy",
    range: "21–40",
    desc: "Hard to see ahead — low clarity and drained energy.",
    bg: "rgba(154,165,180,0.12)",
    accent: "#9aa5b4",
  },
  {
    icon: IconRainy,
    name: "Rainy",
    range: "6–20",
    desc: "Struggling today — needs support and attention.",
    bg: "rgba(91,155,213,0.12)",
    accent: "#4a8bc4",
  },
  {
    icon: IconStormy,
    name: "Stormy",
    range: "1–5",
    desc: "Critical — immediate care and a check-in needed.",
    bg: "rgba(45,52,54,0.08)",
    accent: "#2d3436",
  },
];

// ─── HOW IT WORKS steps ──────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    num: "01",
    title: "Check in daily",
    desc: "Team members log their mood in seconds with a simple 1–100 score each morning.",
  },
  {
    num: "02",
    title: "Weather maps to feelings",
    desc: "Scores translate into intuitive weather metaphors — no numbers to interpret.",
  },
  {
    num: "03",
    title: "Leaders act on insights",
    desc: "Admins see real-time team climate and calendar trends to support proactively.",
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
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-6 md:px-10 bg-white/70 backdrop-blur-[20px] shadow-[0_40px_40px_-10px_rgba(37,50,40,0.06)]">
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
                style={{ color: "rgba(37,50,40,0.55)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/input"
            className="hidden md:inline-flex items-center h-9 px-5 rounded-full text-sm font-bold transition-all hover:opacity-80"
            style={{
              background: "linear-gradient(135deg, #006668, #1a9d9f)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(0,102,104,0.25)",
            }}
          >
            Let's Clima
          </Link>
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
            onClick={() => setMobileNavOpen(true)}
            style={{ color: "rgba(37,50,40,0.7)" }}
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
              style={{ background: "rgba(37,50,40,0.15)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
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
                <div className="mt-4 px-2">
                  <Link
                    href="/input"
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center justify-center h-14 rounded-[1.5rem] text-base font-bold"
                    style={{ background: "linear-gradient(135deg, #006668, #1a9d9f)", color: "#fff" }}
                  >
                    Let's Clima
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
          background:
            "radial-gradient(ellipse 80% 60% at 70% 40%, rgba(82,242,245,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 80% at 10% 60%, rgba(0,102,104,0.06) 0%, transparent 60%), var(--surface)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-20 right-0 md:right-10 w-[280px] md:w-[420px] h-[280px] md:h-[420px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(245,166,35,0.18) 0%, rgba(245,166,35,0.06) 50%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-10 left-0 w-[200px] h-[200px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,102,104,0.08) 0%, transparent 70%)",
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
                style={{ background: "rgba(0,102,104,0.08)", color: "var(--primary)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                Team Climate Dashboard
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...STANDARD_SPRING, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-[3.5rem] xl:text-[4rem] font-black tracking-tight leading-[1.08] mb-6"
                style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-surface)" }}
              >
                Check whether{" "}
                <br className="hidden sm:block" />
                your mind is{" "}
                <br />
                <span
                  style={{
                    backgroundImage: "linear-gradient(135deg, #006668 0%, #1a9d9f 40%, #52f2f5 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  sunny.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...STANDARD_SPRING, delay: 0.16 }}
                className="text-base md:text-lg font-medium leading-relaxed mb-8 max-w-md"
                style={{ color: "rgba(37,50,40,0.6)" }}
              >
                Clima translates how your team feels into intuitive weather metaphors — helping leaders notice, understand, and act on team wellbeing before it becomes a problem.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...STANDARD_SPRING, delay: 0.22 }}
                className="flex flex-wrap gap-3"
              >
                <Link
                  href="/input"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02] active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #006668, #1a9d9f)",
                    color: "#fff",
                    boxShadow: "0 8px 24px rgba(0,102,104,0.28)",
                  }}
                >
                  Start Your Forecast
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 h-14 px-8 rounded-[1.5rem] text-base font-bold transition-all hover:bg-surface-container active:scale-95"
                  style={{ background: "rgba(255,255,255,0.7)", color: "var(--primary)", backdropFilter: "blur(12px)" }}
                >
                  View Demo
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
                    background: "radial-gradient(circle at 38% 34%, #FFE580, #F5A623)",
                    boxShadow: "0 0 60px rgba(245,166,35,0.35), 0 0 120px rgba(245,166,35,0.15)",
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
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 24px rgba(37,50,40,0.1)",
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(37,50,40,0.45)" }}>Team Score</p>
                <p className="text-2xl font-black" style={{ color: "var(--primary)" }}>82</p>
              </motion.div>

              {/* Floating member card */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ ...STANDARD_SPRING, delay: 0.52 }}
                className="absolute bottom-8 left-0 md:-left-6 rounded-[1.5rem] px-4 py-3 flex items-center gap-3"
                style={{
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 24px rgba(37,50,40,0.1)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,166,35,0.12)" }}
                >
                  <IconSunny size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>3 Sunny today</p>
                  <p className="text-xs font-medium" style={{ color: "rgba(37,50,40,0.5)" }}>All members checked in</p>
                </div>
              </motion.div>

              {/* Orbit ring */}
              <div
                className="absolute w-[260px] h-[260px] md:w-[340px] md:h-[340px] rounded-full pointer-events-none"
                style={{ border: "1.5px dashed rgba(0,102,104,0.15)" }}
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
          style={{ color: "rgba(37,50,40,0.3)" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Explore</p>
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
                  How it works
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-6" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                  Turning Mental Health
                  <br />
                  into{" "}
                  <span style={{ color: "var(--primary)" }}>Weather Observation</span>
                </h2>
                <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: "rgba(37,50,40,0.6)" }}>
                  Abstract feelings are hard to track. Weather metaphors make team mood immediately legible — for everyone.
                </p>
              </FadeIn>
            </div>

            {/* Right: numbered steps */}
            <div className="flex flex-col gap-6">
              {HOW_IT_WORKS.map((step, i) => (
                <FadeIn key={step.num} delay={i * 0.1}>
                  <div
                    className="flex gap-5 rounded-[2rem] px-6 py-5"
                    style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px -10px rgba(37,50,40,0.06)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 text-sm font-black"
                      style={{ background: "rgba(0,102,104,0.1)", color: "var(--primary)" }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <p className="font-bold text-base mb-1 tracking-tight" style={{ color: "var(--on-surface)" }}>{step.title}</p>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: "rgba(37,50,40,0.6)" }}>{step.desc}</p>
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
        style={{ background: "rgba(255,255,255,0.45)" }}
      >
        <div className="max-w-[1280px] mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
              The 6 climate states
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Public Sans', sans-serif" }}>
              Read Your Inner Climate
            </h2>
            <p className="text-base font-medium mt-4 max-w-lg mx-auto" style={{ color: "rgba(37,50,40,0.6)" }}>
              Each mood score maps to a weather state your whole team immediately understands — no interpretation required.
            </p>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {WEATHER_STATES.map((state, i) => (
              <FadeIn key={state.name} delay={i * 0.06}>
                <div
                  className="rounded-[2rem] p-5 md:p-6 flex flex-col gap-3 transition-transform hover:scale-[1.02] cursor-default"
                  style={{
                    background: state.bg,
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 12px 32px -8px rgba(37,50,40,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <state.icon size={40} />
                    <span
                      className="text-xs font-black rounded-full px-3 py-1"
                      style={{ background: "rgba(255,255,255,0.6)", color: state.accent }}
                    >
                      {state.range}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-base tracking-tight mb-1" style={{ color: "var(--on-surface)" }}>{state.name}</p>
                    <p className="text-xs font-medium leading-relaxed" style={{ color: "rgba(37,50,40,0.6)" }}>{state.desc}</p>
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
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 32px 64px -16px rgba(37,50,40,0.12)",
                }}
              >
                {/* Mock header */}
                <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(37,50,40,0.06)" }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f5a623" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#52f2f5" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(37,50,40,0.15)" }} />
                  <span className="ml-2 text-xs font-bold" style={{ color: "rgba(37,50,40,0.4)" }}>Team Dashboard — This Week</span>
                </div>

                {/* Mini stats row */}
                <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(37,50,40,0.04)" }}>
                  {[
                    { label: "Team Score", value: "78", color: "var(--primary)" },
                    { label: "Check-ins", value: "8/10", color: "var(--secondary)" },
                    { label: "Trend", value: "+12%", color: "#27ae60" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center py-4 px-3" style={{ background: "rgba(255,255,255,0.8)" }}>
                      <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "rgba(37,50,40,0.45)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Mock bar chart */}
                <div className="px-6 py-6">
                  <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "rgba(37,50,40,0.4)" }}>Weekly Trend</p>
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
                            ? "linear-gradient(180deg, #006668, #1a9d9f)"
                            : "rgba(0,102,104,0.15)",
                          minHeight: 4,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                      <p key={d} className="flex-1 text-center text-[9px] font-bold" style={{ color: "rgba(37,50,40,0.3)" }}>{d}</p>
                    ))}
                  </div>
                </div>

                {/* Mock member list */}
                <div className="px-6 pb-6 flex flex-col gap-2">
                  {[
                    { name: "Sangwoo", state: "Sunny", score: 82, Icon: IconSunny, color: "rgba(245,166,35,0.15)" },
                    { name: "Jiyeon", state: "Cloudy", score: 58, Icon: IconCloudy, color: "rgba(116,185,232,0.15)" },
                    { name: "Minho", state: "Rainy", score: 18, Icon: IconRainy, color: "rgba(91,155,213,0.12)" },
                  ].map((m) => (
                    <div key={m.name} className="flex items-center gap-3 rounded-[1.2rem] px-4 py-2.5" style={{ background: "rgba(37,50,40,0.03)" }}>
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
                  Smart insights
                </p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                  Smart Climate{" "}
                  <span style={{ color: "var(--primary)" }}>Insights</span>
                </h2>
                <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: "rgba(37,50,40,0.6)" }}>
                  The Niko-Niko calendar and weekly trends help leaders see patterns before they become crises.
                </p>
              </FadeIn>

              <div className="flex flex-col gap-4">
                {[
                  { icon: "📅", title: "Weekly Night Access", desc: "Track daily check-in patterns across the whole team." },
                  { icon: "⚡", title: "Instant Alerts", desc: "Get notified when a team member's climate drops to Rainy or Stormy." },
                ].map((feat, i) => (
                  <FadeIn key={feat.title} delay={0.1 + i * 0.1}>
                    <div
                      className="flex gap-4 rounded-[1.75rem] px-6 py-5"
                      style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(16px)", boxShadow: "0 12px 28px -8px rgba(37,50,40,0.06)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 text-lg"
                        style={{ background: "rgba(0,102,104,0.08)" }}
                      >
                        {feat.icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm mb-1" style={{ color: "var(--on-surface)" }}>{feat.title}</p>
                        <p className="text-sm font-medium" style={{ color: "rgba(37,50,40,0.6)" }}>{feat.desc}</p>
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
                    background: "linear-gradient(135deg, #006668, #1a9d9f)",
                    color: "#fff",
                    boxShadow: "0 8px 24px rgba(0,102,104,0.28)",
                  }}
                >
                  Explore Dashboard →
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
                background: "linear-gradient(135deg, #006668 0%, #0a8a8c 50%, #1fa8a8 100%)",
                boxShadow: "0 32px 64px -16px rgba(0,102,104,0.35)",
              }}
            >
              {/* Background circles */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "rgba(82,242,245,0.12)" }} />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full" style={{ background: "rgba(82,242,245,0.08)" }} />

              <div className="relative z-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Start today
                </p>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: "'Public Sans', sans-serif", color: "#fff" }}>
                  How is your climate today?
                </h2>
                <p className="text-base md:text-lg font-medium mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
                  It takes 10 seconds. Your team will thank you.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Link
                    href="/input"
                    className="inline-flex items-center gap-2 h-14 px-10 rounded-[1.5rem] text-base font-bold transition-all hover:scale-[1.02] active:scale-95"
                    style={{ background: "#fff", color: "var(--primary)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}
                  >
                    Let's Clima ☀️
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 h-14 px-10 rounded-[1.5rem] text-base font-bold transition-all hover:bg-white/20 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.15)", color: "#fff", backdropFilter: "blur(12px)" }}
                  >
                    Admin Login
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-10 xl:px-16 py-10" style={{ borderTop: "1px solid rgba(37,50,40,0.06)" }}>
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <ClimaLogo />
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: "rgba(37,50,40,0.5)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs font-medium" style={{ color: "rgba(37,50,40,0.35)" }}>
            © 2026 Clima · Region: Horizon-01
          </p>
        </div>
      </footer>
    </div>
  );
}

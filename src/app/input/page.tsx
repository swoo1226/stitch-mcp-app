"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { RESPONSIVE_SPRING, STANDARD_SPRING, HEAVY_SPRING } from "../constants/springs";
import DynamicBackground from "../components/DynamicBackground";
import AtmosphericEffects from "../components/AtmosphericEffects";
import { ClimaButton, WeatherTile } from "../components/ui";
import { WEATHER_ICON_MAP } from "../components/WeatherIcons";

interface WeatherMetaphor {
  score: number;
  label: string;
  ko: string;
}

const WEATHER_METAPHORS: WeatherMetaphor[] = [
  { score: 0, label: "Stormy", ko: "번개" },
  { score: 20, label: "Rainy", ko: "비" },
  { score: 40, label: "Foggy", ko: "안개" },
  { score: 60, label: "Sunny", ko: "맑음" },
  { score: 100, label: "Radiant", ko: "쨍함" },
];

const currentMetaphorFromScore = (score: number): WeatherMetaphor =>
  WEATHER_METAPHORS.reduce((prev, curr) =>
    Math.abs(curr.score - score) < Math.abs(prev.score - score) ? curr : prev
  );

// 날씨별 축하 모달 설정
const CELEBRATION_CONFIG: Record<string, {
  overlayClass: string;
  cardShadow: string;
  btnGradient: string;
  btnShadow: string;
  glowColor: string;
  title: string;
  subtitle: string;
}> = {
  Stormy: {
    overlayClass: "bg-on-surface/20 backdrop-blur-xl",
    cardShadow: "0 28px 72px -24px rgba(51,65,85,0.28)",
    btnGradient: "linear-gradient(135deg, #FFD600 0%, #FFA000 100%)",
    btnShadow: "0 8px 32px -8px rgba(255,160,0,0.5)",
    glowColor: "rgba(251,191,36,0.25)",
    title: "오늘의 마음 관측 완료!",
    subtitle: "폭풍도 지나가면 맑아져요 ⚡",
  },
  Rainy: {
    overlayClass: "bg-on-surface/18 backdrop-blur-xl",
    cardShadow: "0 28px 72px -24px rgba(59,130,246,0.18)",
    btnGradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
    btnShadow: "0 8px 32px -8px rgba(59,130,246,0.45)",
    glowColor: "rgba(59,130,246,0.2)",
    title: "오늘의 마음 관측 완료!",
    subtitle: "빗소리에 마음을 맡겨봐요 🌧️",
  },
  Foggy: {
    overlayClass: "bg-on-surface/18 backdrop-blur-xl",
    cardShadow: "0 28px 72px -24px rgba(45,212,191,0.18)",
    btnGradient: "linear-gradient(135deg, #2DD4BF 0%, #22D3EE 100%)",
    btnShadow: "0 8px 32px -8px rgba(45,212,191,0.45)",
    glowColor: "rgba(148,163,184,0.25)",
    title: "오늘의 마음 관측 완료!",
    subtitle: "안개는 곧 걷혀 나아갈 거예요 🌫️",
  },
  Sunny: {
    overlayClass: "bg-on-surface/18 backdrop-blur-xl",
    cardShadow: "0 28px 72px -24px rgba(255,153,102,0.18)",
    btnGradient: "linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)",
    btnShadow: "0 8px 32px -8px rgba(255,153,102,0.5)",
    glowColor: "rgba(251,191,36,0.2)",
    title: "오늘의 마음은 맑음!",
    subtitle: "따스한 햇살이 기록되었어요 ☀️",
  },
  Radiant: {
    overlayClass: "bg-on-surface/18 backdrop-blur-xl",
    cardShadow: "0 28px 72px -24px rgba(255,153,102,0.22)",
    btnGradient: "linear-gradient(135deg, #FFD600 0%, #FF9966 100%)",
    btnShadow: "0 8px 32px -8px rgba(255,200,0,0.5)",
    glowColor: "rgba(255,209,102,0.3)",
    title: "오늘의 마음은 쨍함!",
    subtitle: "눈부신 에너지가 기록되었어요 🌟",
  },
};

export default function ClimaInput() {
  const [score, setScore] = useState(75);
  const [mode, setMode] = useState<"tile" | "range">("tile");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  const currentMetaphor = currentMetaphorFromScore(score);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScore = parseInt(e.target.value);
    setScore(newScore);
    const id = Date.now();
    setRipples(prev => [...prev, id]);
    setTimeout(() => setRipples(prev => prev.filter(r => r !== id)), 600);
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={score} />
      <AtmosphericEffects score={score} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 glass px-6 md:px-10 w-full flex flex-col min-h-[100dvh]"
      >
        {/* 헤더 */}
        <header className="flex justify-between items-center w-full shrink-0 px-3 md:px-4 pt-4 pb-2">
          <Link href="/"><ClimaLogo /></Link>
          <ClimaButton variant="icon" href="/">✕</ClimaButton>
        </header>

        {/* 중앙 콘텐츠 */}
        <main className="flex-1 flex flex-col items-center justify-center w-full gap-7 md:gap-12">

          {/* 날씨 아이콘 */}
          <AnimatePresence mode="wait">
            {(() => {
              const Icon = WEATHER_ICON_MAP[currentMetaphor.label];
              return (
                <motion.div
                  key={currentMetaphor.label}
                  initial={{ scale: 0.8, opacity: 0, filter: "blur(20px)" }}
                  animate={{
                    scale: isDragging ? 1.1 : 1,
                    opacity: 1,
                    filter: isDragging ? "blur(4px)" : "blur(0px)",
                    rotate: isDragging ? (score - 50) / 4 : 0
                  }}
                  exit={{ scale: 0.9, opacity: 0, filter: "blur(20px)" }}
                  transition={RESPONSIVE_SPRING}
                  className="select-none pointer-events-none drop-shadow-xl will-change-transform"
                >
                  <Icon size={104} />
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <div className="text-center">
            <h1 className="text-3xl md:text-6xl font-black mb-2 md:mb-4 tracking-tight">{currentMetaphor.label}</h1>
            <p className="text-base md:text-xl opacity-50 font-bold tracking-tight">How's your climate today?</p>
          </div>

          {/* 모드 토글 */}
          <div className="flex gap-2 bg-on-surface/5 rounded-full p-1.5">
            {(["tile", "range"] as const).map((m) => (
              <motion.button
                key={m}
                onClick={() => setMode(m)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={RESPONSIVE_SPRING}
                className="relative text-xs md:text-sm font-black uppercase tracking-[0.12em] rounded-[1.5rem]"
                style={{ color: mode === m ? "var(--on-primary)" : "var(--secondary)", paddingLeft: "1.125rem", paddingRight: "1.125rem", paddingTop: "0.7rem", paddingBottom: "0.7rem" }}
              >
                {mode === m && (
                  <motion.div
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-[1.5rem]"
                    style={{ background: "linear-gradient(135deg, #2b6867 0%, #52f2f5 100%)" }}
                    transition={RESPONSIVE_SPRING}
                  />
                )}
                <span className="relative z-10">{m === "tile" ? "Quick" : "Precise"}</span>
              </motion.button>
            ))}
          </div>

          {/* 입력 영역 */}
          <div className="flex items-center justify-center min-h-[300px] md:min-h-[320px] w-full">
            <AnimatePresence mode="wait">
              {mode === "tile" ? (
                <motion.div
                  key="tile"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={STANDARD_SPRING}
                  className="flex flex-col gap-3 md:gap-4 w-full max-w-[18.5rem] md:max-w-sm mx-auto"
                >
                  {/* 첫 행: 3개 */}
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {WEATHER_METAPHORS.slice(0, 3).map((m) => (
                      <WeatherTile
                        key={m.label}
                        Icon={WEATHER_ICON_MAP[m.label]}
                        label={m.ko}
                        isSelected={currentMetaphor.label === m.label}
                        onClick={() => setScore(m.score)}
                      />
                    ))}
                  </div>
                  {/* 둘째 행: 2개, 첫 행 타일 너비와 동일하게 맞춰 중앙 정렬 */}
                  <div className="flex justify-center gap-3 md:gap-4">
                    {WEATHER_METAPHORS.slice(3).map((m) => (
                      <div key={m.label} className="w-[calc(33.333%-0.5rem)] md:w-[calc(33.333%-0.667rem)]">
                        <WeatherTile
                          Icon={WEATHER_ICON_MAP[m.label]}
                          label={m.ko}
                          isSelected={currentMetaphor.label === m.label}
                          onClick={() => setScore(m.score)}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="range"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={STANDARD_SPRING}
                  className="w-[18rem] md:w-96 mx-auto flex flex-col gap-5 md:gap-6"
                >
                  {/* 슬라이더 트랙 + 핸들 */}
                  <div className="relative h-12 w-full" ref={sliderRef}>
                    {/* 트랙 */}
                    <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 rounded-full" style={{ height: "12px", background: "rgba(19,29,29,0.2)" }}>
                      {/* 채워진 부분 */}
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-primary/40 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                      {/* 리플 */}
                      {ripples.map(id => (
                        <motion.div
                          key={id}
                          initial={{ scale: 0, opacity: 0.3 }}
                          animate={{ scale: 3, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          style={{ left: `${score}%` }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/20 blur-xl pointer-events-none"
                        />
                      ))}
                    </div>

                    {/* 투명 input (히트영역) */}
                    <input
                      type="range"
                      min="0" max="100"
                      value={score}
                      onMouseDown={() => setIsDragging(true)}
                      onMouseUp={() => setIsDragging(false)}
                      onTouchStart={() => setIsDragging(true)}
                      onTouchEnd={() => setIsDragging(false)}
                      onChange={handleSliderChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {/* 핸들 */}
                    <motion.div
                      animate={{
                        left: `${score}%`,
                        scale: isDragging ? 1.3 : 1,
                        backgroundColor: isDragging ? "var(--primary)" : "var(--surface-lowest)",
                        boxShadow: isDragging ? "0 4px 20px -4px rgba(43,104,103,0.5)" : "0 2px 12px rgba(0,0,0,0.15)"
                      }}
                      transition={RESPONSIVE_SPRING}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full shadow-lg z-0 will-change-transform flex items-center justify-center"
                    >
                      <motion.span
                        animate={{ opacity: isDragging ? 1 : 0 }}
                        className="text-white text-[10px] font-black"
                      >
                        {score}
                      </motion.span>
                    </motion.div>
                  </div>

                  {/* 레이블 — 트랙과 완전히 분리 */}
                  <div className="flex justify-between text-sm md:text-base font-black opacity-40 tracking-[0.06em]">
                    <span>번개</span>
                    <span>쨍함</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </motion.div>

      {/* 하단 버튼 */}
      <AnimatePresence>
        {!isSubmitted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={STANDARD_SPRING}
            className="fixed bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30"
          >
            <ClimaButton
              onClick={() => setIsSubmitted(true)}
              className="py-4 md:py-5 text-sm md:text-base tracking-tight shadow-2xl max-w-[calc(100vw-2rem)]"
            >
              Clima it
            </ClimaButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 축하 모달 */}
      <AnimatePresence>
        {isSubmitted && (
          <CelebrationModal
            metaphor={currentMetaphor}
            onClose={() => setIsSubmitted(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// 날씨별 CSS 아이콘 조형물
function WeatherIconSculpture({ label }: { label: string }) {
  if (label === "Sunny") {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* glow */}
        <div className="absolute inset-0 rounded-full" style={{ background: "rgba(251,191,36,0.25)", filter: "blur(32px)", transform: "scale(1.5)" }} />
        {/* 광선 — 12초 회전 */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {[0,45,90,135,180,225,270,315].map((deg) => (
            <div key={deg} className="absolute" style={{ transform: `rotate(${deg}deg) translateY(-52px)`, width: 6, height: 18, borderRadius: 9999, background: "linear-gradient(to bottom, #FFD600, transparent)" }} />
          ))}
        </motion.div>
        {/* 본체 */}
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 30% 30%, #fff176 0%, #ffb300 100%)", boxShadow: "inset 0 -6px 16px rgba(0,0,0,0.1), 0 12px 40px -8px rgba(255,153,0,0.4)" }}>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-8 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
        </div>
        {/* 작은 파티클 */}
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute top-4 right-6 w-3 h-3 rounded-full" style={{ background: "#FFD600" }} />
        <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} className="absolute bottom-6 left-5 w-5 h-5 rounded-full" style={{ background: "rgba(255,200,80,0.4)" }} />
      </div>
    );
  }

  if (label === "Radiant") {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,209,102,0.35)", filter: "blur(32px)", transform: "scale(1.5)" }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {[0,36,72,108,144,180,216,252,288,324].map((deg) => (
            <div key={deg} className="absolute" style={{ transform: `rotate(${deg}deg) translateY(-54px)`, width: 5, height: 20, borderRadius: 9999, background: "linear-gradient(to bottom, #FFE066, transparent)" }} />
          ))}
        </motion.div>
        <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "radial-gradient(circle at 30% 30%, #FFE599 0%, #F5A623 100%)", boxShadow: "inset 0 -6px 16px rgba(0,0,0,0.08), 0 12px 48px -8px rgba(255,160,0,0.5)" }}>
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className="w-8 h-8 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
        </div>
        <motion.div animate={{ opacity: [0.6, 1, 0.6], y: [0, -3, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="absolute top-3 right-5 w-4 h-4 rounded-full" style={{ background: "#FFD166" }} />
        <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2.2, repeat: Infinity, delay: 0.5 }} className="absolute bottom-5 left-4 w-6 h-6 rounded-full" style={{ background: "rgba(255,220,80,0.35)" }} />
      </div>
    );
  }

  if (label === "Stormy") {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full" style={{ background: "rgba(251,191,36,0.2)", filter: "blur(32px)", transform: "scale(1.5)" }} />
        {/* CSS 구름 적층 */}
        <div className="relative flex items-end justify-center">
          <div className="w-14 h-14 rounded-full -mr-4" style={{ background: "radial-gradient(circle at 30% 30%, #64748b 0%, #334155 100%)" }} />
          <div className="w-20 h-20 rounded-full z-10" style={{ background: "radial-gradient(circle at 30% 30%, #64748b 0%, #334155 100%)" }} />
          <div className="w-16 h-16 rounded-full -ml-6" style={{ background: "radial-gradient(circle at 30% 30%, #64748b 0%, #334155 100%)" }} />
        </div>
        {/* 번개 */}
        <motion.div
          animate={{ opacity: [1, 0.4, 1, 0.4, 1], filter: ["drop-shadow(0 0 6px #FFD600)", "drop-shadow(0 0 2px #FFD600)", "drop-shadow(0 0 8px #FFD600)", "drop-shadow(0 0 2px #FFD600)", "drop-shadow(0 0 6px #FFD600)"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute"
          style={{ bottom: "14px", left: "50%", transform: "translateX(-50%)" }}
        >
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none">
            <path d="M18 2 L8 18 H15 L10 34 L26 14 H19 Z" fill="#FFD600" />
          </svg>
        </motion.div>
      </div>
    );
  }

  if (label === "Foggy") {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full" style={{ background: "rgba(148,163,184,0.2)", filter: "blur(32px)", transform: "scale(1.5)" }} />
        {/* 수평 원형 3개 */}
        <div className="relative flex items-center -space-x-4">
          <div className="w-16 h-16 rounded-full opacity-80" style={{ background: "radial-gradient(circle at 30% 30%, #ffffff 0%, #e2e8f0 100%)" }} />
          <div className="w-20 h-20 rounded-full z-10" style={{ background: "radial-gradient(circle at 30% 30%, #ffffff 0%, #f1f5f9 100%)" }} />
          <div className="w-16 h-16 rounded-full opacity-70" style={{ background: "radial-gradient(circle at 30% 30%, #ffffff 0%, #e2e8f0 100%)" }} />
        </div>
        {/* 안개 줄기 */}
        <div className="absolute" style={{ bottom: "22px", left: "50%", transform: "translateX(-50%)", width: "9rem", height: "14px", borderRadius: 9999, background: "rgba(255,255,255,0.6)", filter: "blur(10px)" }} />
        <div className="absolute" style={{ bottom: "10px", left: "50%", transform: "translateX(-50%)", width: "11rem", height: "18px", borderRadius: 9999, background: "rgba(255,255,255,0.4)", filter: "blur(12px)" }} />
      </div>
    );
  }

  if (label === "Rainy") {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full" style={{ background: "rgba(59,130,246,0.15)", filter: "blur(32px)", transform: "scale(1.5)" }} />
        {/* 구름 적층 */}
        <div className="relative flex items-end justify-center">
          <div className="w-14 h-14 rounded-full -mr-4" style={{ background: "radial-gradient(circle at 30% 30%, #e0f2fe 0%, #cbd5e1 100%)" }} />
          <div className="w-20 h-20 rounded-full z-10" style={{ background: "radial-gradient(circle at 30% 30%, #e0f2fe 0%, #cbd5e1 100%)" }} />
          <div className="w-16 h-16 rounded-full -ml-6" style={{ background: "radial-gradient(circle at 30% 30%, #e0f2fe 0%, #cbd5e1 100%)" }} />
        </div>
        {/* 빗방울 */}
        {[{ left: "34%", delay: 0.2 }, { left: "46%", delay: 0.5 }, { left: "58%", delay: 0.8 }, { left: "42%", delay: 0.1 }].map(({ left, delay }, i) => (
          <motion.div
            key={i}
            animate={{ y: [-8, 36], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay, ease: "linear" }}
            className="absolute"
            style={{ bottom: "14px", left, width: 3, height: 12, borderRadius: 9999, background: "linear-gradient(to bottom, rgba(59,130,246,0.7), transparent)" }}
          />
        ))}
      </div>
    );
  }

  // fallback
  return <div className="w-24 h-24 rounded-full" style={{ background: "var(--primary-container)" }} />;
}

// 축하 모달 컴포넌트
function CelebrationModal({
  metaphor,
  onClose,
}: {
  metaphor: WeatherMetaphor;
  onClose: () => void;
}) {
  const config = CELEBRATION_CONFIG[metaphor.label];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${config.overlayClass}`}
    >
      {/* 모달 카드 — glassmorphism */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 32 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={HEAVY_SPRING}
        className="relative w-full flex flex-col items-center text-center"
        style={{
          maxWidth: "27rem",
          borderRadius: "2.5rem",
          padding: "2.75rem 2.25rem 2rem",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255,255,255,0.5)",
          boxShadow: config.cardShadow,
        }}
      >
        {/* 아이콘 조형물 */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, ...HEAVY_SPRING }}
          className="mb-7"
        >
          <WeatherIconSculpture label={metaphor.label} />
        </motion.div>

        {/* 텍스트 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, ...STANDARD_SPRING }}
          className="space-y-3 mb-8 px-2"
        >
          <h2 className="font-extrabold tracking-tight leading-tight" style={{ fontSize: "30px", color: "#1a2e2a" }}>
            {config.title}
          </h2>
          <p className="text-[15px] md:text-base font-medium leading-relaxed" style={{ color: "#516b67", maxWidth: "22ch", marginInline: "auto" }}>
            {config.subtitle}
          </p>
        </motion.div>

        {/* 버튼들 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, ...STANDARD_SPRING }}
          className="flex flex-col items-center w-full gap-3"
        >
          {/* 날씨별 네온 CTA */}
          <Link
            href="/personal"
            className="flex items-center justify-center gap-2 font-extrabold text-white transition-transform active:scale-95"
            style={{
              minWidth: "14rem",
              height: 68,
              borderRadius: "1.65rem",
              background: config.btnGradient,
              boxShadow: config.btnShadow,
              fontSize: "16px",
              paddingInline: "1.75rem",
            }}
          >
            나의 예보 보러가기
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 14L14 4M14 4H7M14 4V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          {/* 닫기 */}
          <button
            onClick={onClose}
            className="py-2 text-sm font-bold transition-opacity hover:opacity-70 active:scale-95"
            style={{ color: "#516b67" }}
          >
            닫기
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

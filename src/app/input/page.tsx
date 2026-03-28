"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { RESPONSIVE_SPRING, STANDARD_SPRING, HEAVY_SPRING } from "../constants/springs";
import DynamicBackground from "../components/DynamicBackground";
import AtmosphericEffects from "../components/AtmosphericEffects";
import { ClimaButton, FAB, WeatherTile, PrimaryTabToggle } from "../components/ui";
import GlassModal from "../components/GlassModal";
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
    overlayClass: "backdrop-blur-md",
    cardShadow: "0 30px 100px -20px rgba(51,65,85,0.3)",
    btnGradient: "linear-gradient(135deg, #FFD600 0%, #FFA000 100%)",
    btnShadow: "0 0 20px rgba(255,160,0,0.4)",
    glowColor: "rgba(251,191,36,0.25)",
    title: "오늘의 마음 관측 완료!",
    subtitle: "폭풍도 지나가면 맑아져요 ⚡",
  },
  Rainy: {
    overlayClass: "backdrop-blur-md",
    cardShadow: "0 30px 100px -20px rgba(59,130,246,0.2)",
    btnGradient: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
    btnShadow: "0 0 20px rgba(59,130,246,0.4)",
    glowColor: "rgba(59,130,246,0.2)",
    title: "오늘의 마음 관측 완료!",
    subtitle: "빗소리에 마음을 맡겨봐요 🌧️",
  },
  Foggy: {
    overlayClass: "backdrop-blur-md",
    cardShadow: "0 30px 100px -20px rgba(45,212,191,0.2)",
    btnGradient: "linear-gradient(135deg, #2DD4BF 0%, #22D3EE 100%)",
    btnShadow: "0 0 20px rgba(45,212,191,0.4)",
    glowColor: "rgba(148,163,184,0.25)",
    title: "오늘의 마음 관측 완료!",
    subtitle: "안개는 곧 걷혀 나아갈 거예요 🌫️",
  },
  Sunny: {
    overlayClass: "backdrop-blur-md",
    cardShadow: "0 30px 100px -20px rgba(255,153,102,0.2)",
    btnGradient: "linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)",
    btnShadow: "0 0 20px rgba(255,153,102,0.4)",
    glowColor: "rgba(251,191,36,0.2)",
    title: "오늘의 마음은 맑음!",
    subtitle: "따스한 햇살이 기록되었어요 ☀️",
  },
  Radiant: {
    overlayClass: "backdrop-blur-md",
    cardShadow: "0 30px 100px -20px rgba(255,153,102,0.25)",
    btnGradient: "linear-gradient(135deg, #FFD600 0%, #FF9966 100%)",
    btnShadow: "0 0 20px rgba(255,200,0,0.4)",
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
        className="relative z-10 glass px-6 md:px-10 w-full max-w-lg mx-auto flex flex-col min-h-[100dvh]"
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
          <PrimaryTabToggle
            tabs={[
              { value: "tile" as const, label: "Quick" },
              { value: "range" as const, label: "Precise" },
            ]}
            active={mode}
            onChange={setMode}
          />

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
            <FAB
              onClick={() => setIsSubmitted(true)}
              className="text-sm md:text-base tracking-tight max-w-[calc(100vw-2rem)]"
            >
              Clima it
            </FAB>
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

// 모달용 아이콘 — 타일과 동일한 SVG에 애니메이션만 추가
function ModalWeatherIcon({ label }: { label: string }) {
  const Icon = WEATHER_ICON_MAP[label];

  if (label === "Sunny") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      >
        <Icon size={96} />
      </motion.div>
    );
  }

  if (label === "Radiant") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      >
        <Icon size={96} />
      </motion.div>
    );
  }

  if (label === "Stormy") {
    return (
      <motion.div
        animate={{ x: [-2, 2, -2] }}
        transition={{ duration: 0.15, repeat: Infinity, ease: "linear" }}
      >
        <Icon size={96} />
      </motion.div>
    );
  }

  if (label === "Rainy") {
    return (
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={96} />
      </motion.div>
    );
  }

  if (label === "Foggy") {
    return (
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon size={96} />
      </motion.div>
    );
  }

  return <Icon size={96} />;
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
    <GlassModal onClose={onClose} closeOnOverlay={false}>
      {/* 아이콘 */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...HEAVY_SPRING }}
        className="mb-7 relative"
        style={{ filter: `drop-shadow(0 12px 24px ${config.glowColor})` }}
      >
        <ModalWeatherIcon label={metaphor.label} />
      </motion.div>

      {/* 텍스트 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, ...STANDARD_SPRING }}
        className="space-y-3 mb-8 px-2"
      >
        <h2 className="font-extrabold tracking-tight leading-tight" style={{ fontSize: "28px", color: "#2e1f1a" }}>
          {config.title}
        </h2>
        <p className="text-base font-medium leading-relaxed" style={{ color: "#6b5551", maxWidth: "22ch", marginInline: "auto" }}>
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
        <Link
          href="/personal"
          className="flex items-center justify-center gap-2 font-bold text-white transition-all active:scale-95 w-full"
          style={{
            height: 64,
            borderRadius: "1.5rem",
            background: config.btnGradient,
            boxShadow: config.btnShadow,
            fontSize: "18px",
          }}
        >
          나의 예보 보러가기
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 14L14 4M14 4H7M14 4V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <button
          onClick={onClose}
          className="w-full py-4 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "#92817a" }}
        >
          닫기
        </button>
      </motion.div>
    </GlassModal>
  );
}

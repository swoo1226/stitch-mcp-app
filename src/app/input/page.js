"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { RESPONSIVE_SPRING, STANDARD_SPRING } from "../constants/springs";
import DynamicBackground from "../components/DynamicBackground";
import AtmosphericEffects from "../components/AtmosphericEffects";
import { ClimaButton } from "../components/ui";

const WEATHER_METAPHORS = [
  { score: 0, label: "Stormy", emoji: "⛈️", color: "#f9e8e8" },
  { score: 25, label: "Rainy", emoji: "🌧️", color: "#dfebea" },
  { score: 50, label: "Cloudy", emoji: "☁️", color: "#eaf6f5" },
  { score: 75, label: "Sunny", emoji: "☀️", color: "#f0fcfb" },
  { score: 100, label: "Radiant", emoji: "✨", color: "#ffffff" },
];

export default function ClimaInput() {
  const [score, setScore] = useState(75);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [ripples, setRipples] = useState([]);

  const sliderRef = useRef(null);

  const currentMetaphor = WEATHER_METAPHORS.reduce((prev, curr) =>
    Math.abs(curr.score - score) < Math.abs(prev.score - score) ? curr : prev
  );

  const handleSliderChange = (e) => {
    const newScore = parseInt(e.target.value);
    setScore(newScore);

    const id = Date.now();
    setRipples(prev => [...prev, id]);
    setTimeout(() => setRipples(prev => prev.filter(r => r !== id)), 600);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
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
        <header className="flex justify-between items-center w-full shrink-0 px-4 pt-4 pb-2">
          <Link href="/"><ClimaLogo /></Link>
          <ClimaButton variant="icon" href="/">✕</ClimaButton>
        </header>

        {/* 중앙 콘텐츠 */}
        <main className="flex-1 flex flex-col items-center justify-center w-full gap-10 md:gap-14">
          <AnimatePresence mode="wait">
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
              className="text-[100px] md:text-[140px] select-none pointer-events-none drop-shadow-xl will-change-transform"
            >
              {currentMetaphor.emoji}
            </motion.div>
          </AnimatePresence>

          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-black font-[Plus Jakarta Sans] mb-3 md:mb-4 tracking-tight">{currentMetaphor.label}</h1>
            <p className="text-sm md:text-xl opacity-50 font-bold tracking-tight">How's your climate today?</p>
          </div>

          {/* Slider */}
          <div className="w-72 md:w-96 relative mx-auto">
            <div className="flex justify-between text-[10px] font-black opacity-40 mb-8 tracking-[0.2em] uppercase">
              <span>Stormy</span>
              <span>Radiant</span>
            </div>

            <div className="relative h-3 md:h-2 w-full bg-on-surface/5 rounded-full mx-4" ref={sliderRef}>
              <div className="absolute inset-x-0 h-full pointer-events-none overflow-visible">
                {ripples.map(id => (
                  <motion.div
                    key={id}
                    initial={{ scale: 0, opacity: 0.3 }}
                    animate={{ scale: 3, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ left: `${score}%` }}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary/20 blur-xl"
                  />
                ))}
              </div>

              <motion.div
                className="absolute inset-y-0 left-0 bg-primary/40 rounded-full"
                style={{ width: `${score}%` }}
              />

              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onChange={handleSliderChange}
                className="absolute -inset-x-8 -top-6 bottom-0 h-16 opacity-0 cursor-pointer z-10"
              />

              <motion.div
                animate={{
                  left: `${score}%`,
                  scale: isDragging ? 1.3 : 1,
                  backgroundColor: isDragging ? "var(--primary)" : "var(--surface-lowest)"
                }}
                transition={RESPONSIVE_SPRING}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full shadow-lg border-none z-0 will-change-transform"
              >
                <motion.div
                  animate={{ opacity: isDragging ? 1 : 0 }}
                  className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black"
                >
                  {score}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </main>
      </motion.div>

      {/* 하단 버튼 */}
      {!isSubmitted ? (
        <ClimaButton
          onClick={handleSubmit}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 py-6 text-base tracking-tight shadow-2xl"
        >
          CliMa it!
        </ClimaButton>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={STANDARD_SPRING}
          className="fixed bottom-12 left-1/2 -translate-x-1/2 z-30 text-center"
        >
          <p className="text-2xl md:text-3xl font-black font-[Plus Jakarta Sans] mb-8 tracking-tight text-primary">Atmosphere recorded.</p>
          <ClimaButton href="/" variant="secondary" className="py-4 text-sm">Return to Garden</ClimaButton>
        </motion.div>
      )}
    </div>
  );
}

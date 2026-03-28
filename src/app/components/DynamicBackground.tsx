"use client";

import { motion } from "framer-motion";
import AtmosphericEffects from "./AtmosphericEffects";
import { useMotionPreferences } from "./useMotionPreferences";

interface DynamicBackgroundProps {
  score?: number;
}

export default function DynamicBackground({ score = 85 }: DynamicBackgroundProps) {
  const { shouldLimitMotion } = useMotionPreferences();

  // 날씨별 느낌 색상과 일치하도록 조정
  // Radiant: 황금/크림   Sunny: 따뜻한 복숭아   Foggy: 서늘한 회청   Rainy: 차분한 청남   Stormy: 어두운 남회색
  let bgColor = "#fdf8ec";
  if (score >= 81) bgColor = "#fdf8ec";      // Radiant — 크림 황금
  else if (score >= 61) bgColor = "#fef3e8"; // Sunny   — 복숭아 크림
  else if (score >= 41) bgColor = "#eef1f5"; // Foggy   — 서늘한 회청백
  else if (score >= 21) bgColor = "#e4ecf7"; // Rainy   — 청남 미스트
  else bgColor = "#e8eaf2";                  // Stormy  — 어두운 남회색

  return (
    <motion.div
      animate={shouldLimitMotion ? undefined : { backgroundColor: bgColor }}
      transition={shouldLimitMotion ? undefined : { duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
      style={shouldLimitMotion ? { backgroundColor: bgColor } : undefined}
      className="fixed inset-0 z-[-1]"
    >
      <AtmosphericEffects score={score} />

      {/* Organic Blobs — 날씨별 색조 */}
      {(() => {
        const blob1 =
          score >= 81 ? "#e6a800" // Radiant — 황금
          : score >= 61 ? "#f97316" // Sunny   — 주황
          : score >= 41 ? "#94a3b8" // Foggy   — 회청
          : score >= 21 ? "#3b82f6" // Rainy   — 파랑
          : "#4b5577";              // Stormy  — 남색
        const blob2 =
          score >= 81 ? "#fbbf24" // Radiant — 노랑
          : score >= 61 ? "#fb923c" // Sunny   — 살구
          : score >= 41 ? "#cbd5e1" // Foggy   — 연회
          : score >= 21 ? "#60a5fa" // Rainy   — 하늘
          : "#334155";              // Stormy  — 어두운 청회
        return (
          <>
            <motion.div
              animate={shouldLimitMotion ? undefined : {
                scale: [1, 1.1, 1],
                rotate: [0, 45, 0],
                x: [0, 30, 0],
                y: [0, -20, 0]
              }}
              transition={shouldLimitMotion ? undefined : { duration: 30, repeat: Infinity, ease: "linear" }}
              className={`absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full ${
                shouldLimitMotion ? "blur-[72px]" : "blur-[120px]"
              }`}
              style={{ backgroundColor: blob1, opacity: 0.07 }}
            />
            <motion.div
              animate={shouldLimitMotion ? undefined : {
                scale: [1, 1.3, 1],
                rotate: [0, -30, 0],
                x: [0, -40, 0],
                y: [0, 40, 0]
              }}
              transition={shouldLimitMotion ? undefined : { duration: 35, repeat: Infinity, ease: "linear" }}
              className={`absolute bottom-[-20%] right-[-15%] w-[90%] h-[90%] rounded-full ${
                shouldLimitMotion ? "blur-[88px]" : "blur-[150px]"
              }`}
              style={{ backgroundColor: blob2, opacity: 0.06 }}
            />
          </>
        );
      })()}
    </motion.div>
  );
}

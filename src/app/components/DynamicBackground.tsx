"use client";

import { motion } from "framer-motion";
import AtmosphericEffects from "./AtmosphericEffects";
import { useMotionPreferences } from "./useMotionPreferences";

interface DynamicBackgroundProps {
  score?: number;
}

export default function DynamicBackground({ score = 85 }: DynamicBackgroundProps) {
  const { shouldLimitMotion } = useMotionPreferences();

  let bgColor = "var(--weather-sunny-bg)";
  if (score >= 81) bgColor = "var(--weather-sunny-bg)";
  else if (score >= 61) bgColor = "var(--weather-partlycloudy-bg)";
  else if (score >= 41) bgColor = "var(--weather-cloudy-bg)";
  else if (score >= 21) bgColor = "var(--weather-rainy-bg)";
  else bgColor = "var(--weather-stormy-bg)";

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
          score >= 81 ? "var(--weather-sunny-blob-1)"
          : score >= 61 ? "var(--weather-partlycloudy-blob-1)"
          : score >= 41 ? "var(--weather-cloudy-blob-1)"
          : score >= 21 ? "var(--weather-rainy-blob-1)"
          : "var(--weather-stormy-blob-1)";
        const blob2 =
          score >= 81 ? "var(--weather-sunny-blob-2)"
          : score >= 61 ? "var(--weather-partlycloudy-blob-2)"
          : score >= 41 ? "var(--weather-cloudy-blob-2)"
          : score >= 21 ? "var(--weather-rainy-blob-2)"
          : "var(--weather-stormy-blob-2)";
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

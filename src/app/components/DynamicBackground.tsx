"use client";

import { motion } from "framer-motion";
import AtmosphericEffects from "./AtmosphericEffects";
import { useMotionPreferences } from "./useMotionPreferences";

interface DynamicBackgroundProps {
  score?: number;
}

export default function DynamicBackground({ score = 85 }: DynamicBackgroundProps) {
  const { shouldLimitMotion } = useMotionPreferences();

  let bgColor = "#f0fcfb";
  if (score >= 81) bgColor = "#f0fcfb";
  else if (score >= 61) bgColor = "#eaf6f5";
  else if (score >= 41) bgColor = "#dfebea";
  else if (score >= 21) bgColor = "#dae3f3";
  else bgColor = "#f9e8e8";

  return (
    <motion.div
      animate={shouldLimitMotion ? undefined : { backgroundColor: bgColor }}
      transition={shouldLimitMotion ? undefined : { duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
      style={shouldLimitMotion ? { backgroundColor: bgColor } : undefined}
      className="fixed inset-0 z-[-1]"
    >
      <AtmosphericEffects score={score} />

      {/* Organic Blobs for botanical texture */}
      <motion.div
        animate={shouldLimitMotion ? undefined : {
          scale: [1, 1.1, 1],
          rotate: [0, 45, 0],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={shouldLimitMotion ? undefined : { duration: 30, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full bg-[#2b6867]/5 ${
          shouldLimitMotion ? "blur-[72px]" : "blur-[120px]"
        }`}
      />
      <motion.div
        animate={shouldLimitMotion ? undefined : {
          scale: [1, 1.3, 1],
          rotate: [0, -30, 0],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={shouldLimitMotion ? undefined : { duration: 35, repeat: Infinity, ease: "linear" }}
        className={`absolute bottom-[-20%] right-[-15%] w-[90%] h-[90%] rounded-full bg-[#4e6636]/5 ${
          shouldLimitMotion ? "blur-[88px]" : "blur-[150px]"
        }`}
      />
    </motion.div>
  );
}

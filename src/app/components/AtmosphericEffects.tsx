"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useMemo } from "react";
import { useMotionPreferences } from "./useMotionPreferences";

interface AtmosphericEffectsProps {
  score?: number;
}

interface Particle {
  id: number;
  x: string;
  delay: number;
  duration: number;
  height: number;
}

export default function AtmosphericEffects({ score = 85 }: AtmosphericEffectsProps) {
  const { shouldLimitMotion } = useMotionPreferences();
  const effect = score >= 60 ? "sunny" : score >= 40 ? "foggy" : score >= 20 ? "rainy" : "stormy";
  const particles = useMemo<Particle[]>(
    () => Array.from({ length: shouldLimitMotion ? 10 : 18 }, (_, i) => ({
      id: i,
      x: `${(i * 19) % 100}%`,
      delay: (i % 6) * 0.28,
      duration: 1.2 + (i % 5) * 0.18,
      height: 28 + (i % 4) * 8,
    })),
    [shouldLimitMotion]
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Sunny: Bloom Effect */}
        {effect === "sunny" && (
          <motion.div
            key="sunny"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-white/5 ${shouldLimitMotion ? "blur-[48px]" : "blur-[100px]"}`}
          />
        )}

        {/* Foggy: Backdrop Blur & Contrast */}
        {effect === "foggy" && (
          <motion.div
            key="foggy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-slate-200/10 ${shouldLimitMotion ? "backdrop-blur-[10px]" : "backdrop-blur-[30px]"}`}
          />
        )}

        {/* Rainy: Falling Particles */}
        {effect === "rainy" && (
          <motion.div
            key="rainy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ y: -20, x: particle.x, opacity: 0 }}
                animate={shouldLimitMotion ? { opacity: 0.18 } : { y: "110vh", opacity: [0, 0.35, 0] }}
                transition={shouldLimitMotion ? undefined : {
                  duration: particle.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: particle.delay,
                }}
                className="absolute w-0.5 bg-white/30 rounded-full"
                style={{ height: `${particle.height}px` }}
              />
            ))}
          </motion.div>
        )}

        {/* Stormy: Jitter & Flash */}
        {effect === "stormy" && (
          <motion.div
            key="stormy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-slate-900/10" />

            {/* Lightning Flash */}
            <motion.div
              animate={shouldLimitMotion ? { opacity: 0.08 } : { opacity: [0, 0, 1, 0, 0, 0.5, 0] }}
              transition={shouldLimitMotion ? undefined : {
                duration: 6,
                repeat: Infinity,
                times: [0, 0.8, 0.81, 0.85, 0.9, 0.91, 1]
              }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jitter (Stormy) or Floating (Cloudy) wrapper for children if needed */}
      {/* But since children are outside this absolute container, we should export these as variants or HOC */}
    </div>
  );
}

// Named exports for specific animations
export const atmosphereVariants: Record<string, Variants[string]> = {
    cloudy: {
        y: [0, -10, 0],
        transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
        }
    },
    stormy: {
        x: [0, -1, 1, -1, 0],
        transition: {
            duration: 0.1,
            repeat: Infinity
        }
    },
    default: {
        y: 0,
        x: 0
    }
};

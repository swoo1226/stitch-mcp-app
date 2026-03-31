"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  opacity: number;
}

export default function AtmosphericEffects({ score = 85 }: AtmosphericEffectsProps) {
  const { shouldLimitMotion } = useMotionPreferences();

  const effect =
    score >= 80 ? "radiant"
    : score >= 60 ? "sunny"
    : score >= 40 ? "foggy"
    : score >= 20 ? "rainy"
    : "stormy";

  // Rain particles
  const rainParticles = useMemo<Particle[]>(
    () => Array.from({ length: shouldLimitMotion ? 14 : 32 }, (_, i) => ({
      id: i,
      x: `${(i * 13 + 3) % 100}%`,
      delay: (i % 7) * 0.22,
      duration: 0.9 + (i % 5) * 0.15,
      height: 28 + (i % 4) * 12,
      opacity: 0.38 + (i % 3) * 0.14,
    })),
    [shouldLimitMotion]
  );

  // Sun ray particles
  const sunRays = useMemo(
    () => Array.from({ length: shouldLimitMotion ? 5 : 8 }, (_, i) => ({
      id: i,
      angle: (i * 45) + (i % 2 === 0 ? 0 : 22.5),
      delay: i * 0.3,
      length: 150 + (i % 3) * 80,
    })),
    [shouldLimitMotion]
  );

  // Lightning bolt definitions — 각각 다른 모양/크기/위치/타이밍
  const lightningBolts = useMemo(
    () => [
      // 왼쪽: 크고 선명한 주 번개
      { id: 0, x: "8%",  top: "0%", width: 52, height: 200, points: "36,0 14,88 28,88 6,200",  strokeW: 3.5, delay: 0,   duration: 5.2 },
      // 중앙 오른쪽: 작고 빠른 보조 번개
      { id: 1, x: "58%", top: "0%", width: 28, height: 120, points: "20,0 8,52 16,52 4,120",   strokeW: 2,   delay: 1.8, duration: 4.1 },
      // 오른쪽: 중간 크기, 꺾임 다른 형태
      { id: 2, x: "78%", top: "0%", width: 36, height: 160, points: "10,0 26,60 14,60 30,160", strokeW: 2.5, delay: 3.5, duration: 6.0 },
    ],
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-[25] overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ─── Radiant: 눈부신 광선 + 반짝임 ─── */}
        {effect === "radiant" && (
          <motion.div
            key="radiant"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {/* 중앙 빛 bloom */}
            <motion.div
              animate={shouldLimitMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.28, 0.48, 0.28] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[140%] h-[80%] rounded-full"
              style={{ background: "radial-gradient(ellipse, color-mix(in srgb, var(--weather-radiant-blob-2) 38%, transparent) 0%, transparent 70%)", filter: "blur(40px)" }}
            />
            {/* 광선 */}
            {sunRays.map((ray) => (
              <motion.div
                key={ray.id}
                animate={shouldLimitMotion ? {} : { opacity: [0.06, 0.18, 0.06], scaleY: [0.8, 1.1, 0.8] }}
                transition={{ duration: 3 + ray.delay, repeat: Infinity, ease: "easeInOut", delay: ray.delay }}
                className="absolute top-0 left-1/2 origin-top"
                style={{
                  width: 2,
                  height: ray.length,
                  background: "linear-gradient(180deg, rgba(255,220,80,0.5) 0%, transparent 100%)",
                  transform: `translateX(-50%) rotate(${ray.angle}deg)`,
                  transformOrigin: "top center",
                }}
              />
            ))}
            {/* 반짝이 스파클 */}
            {Array.from({ length: shouldLimitMotion ? 4 : 10 }, (_, i) => (
              <motion.div
                key={i}
                animate={shouldLimitMotion ? {} : {
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                className="absolute rounded-full bg-yellow-200"
                style={{
                  width: 4 + (i % 3) * 2,
                  height: 4 + (i % 3) * 2,
                  top: `${10 + (i * 17) % 60}%`,
                  left: `${5 + (i * 23) % 90}%`,
                  boxShadow: "0 0 8px 2px rgba(255,220,80,0.6)",
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ─── Sunny: 따뜻한 빛 bloom ─── */}
        {effect === "sunny" && (
          <motion.div
            key="sunny"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            {/* 상단 warm glow */}
            <motion.div
              animate={shouldLimitMotion ? {} : { opacity: [0.22, 0.42, 0.22], y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[-10%] right-[-10%] w-[80%] h-[60%] rounded-full"
              style={{ background: "radial-gradient(ellipse, color-mix(in srgb, var(--weather-sunny-blob-2) 32%, transparent) 0%, transparent 70%)", filter: "blur(60px)" }}
            />
            {/* 떠다니는 빛 입자 */}
            {Array.from({ length: shouldLimitMotion ? 5 : 14 }, (_, i) => (
              <motion.div
                key={i}
                animate={shouldLimitMotion ? {} : {
                  y: [0, -30 - (i % 3) * 20, 0],
                  opacity: [0, 0.4 + (i % 3) * 0.1, 0],
                  x: [0, (i % 2 === 0 ? 8 : -8), 0],
                }}
                transition={{
                  duration: 3 + (i % 4) * 0.8,
                  repeat: Infinity,
                  delay: i * 0.35,
                  ease: "easeInOut",
                }}
                className="absolute rounded-full"
                style={{
                  width: 3 + (i % 3),
                  height: 3 + (i % 3),
                  background: "color-mix(in srgb, var(--weather-sunny-blob-2) 72%, white)",
                  bottom: `${5 + (i * 11) % 50}%`,
                  left: `${(i * 17 + 5) % 95}%`,
                  filter: "blur(1px)",
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ─── Foggy: 흘러다니는 안개 레이어 ─── */}
        {effect === "foggy" && (
          <motion.div
            key="foggy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={shouldLimitMotion ? {} : {
                  x: [0, 40 + i * 20, 0],
                  opacity: [0.28, 0.45, 0.28],
                }}
                transition={{
                  duration: 10 + i * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 1.5,
                }}
                className="absolute rounded-full"
                style={{
                  width: "120%",
                  height: `${22 + i * 8}%`,
                  top: `${15 + i * 22}%`,
                  left: "-10%",
                  background: "color-mix(in srgb, var(--weather-foggy-blob-2) 36%, transparent)",
                  filter: "blur(28px)",
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ─── Rainy: 빗줄기 ─── */}
        {effect === "rainy" && (
          <motion.div
            key="rainy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* 전체 어두운 베일 */}
            <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--weather-rainy-blob-1) 14%, transparent)" }} />
            {/* 빗줄기 파티클 */}
            {rainParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ y: "-5%", opacity: 0 }}
                animate={shouldLimitMotion
                  ? { opacity: p.opacity * 0.5 }
                  : { y: "110%", opacity: [0, p.opacity, p.opacity * 0.6, 0] }
                }
                transition={shouldLimitMotion ? undefined : {
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: p.delay,
                  times: [0, 0.1, 0.9, 1],
                }}
                className="absolute rounded-full"
                style={{
                  left: p.x,
                  width: 1.5,
                  height: p.height,
                  background: "linear-gradient(180deg, color-mix(in srgb, var(--weather-rainy-blob-2) 70%, white) 0%, color-mix(in srgb, var(--weather-rainy-blob-1) 45%, transparent) 100%)",
                  transform: "rotate(12deg)",
                }}
              />
            ))}
            {/* 빗방울 튀김 — 하단 */}
            {Array.from({ length: shouldLimitMotion ? 0 : 8 }, (_, i) => (
              <motion.div
                key={i}
                animate={{ scaleX: [0, 1, 0], opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.45 + 0.2, ease: "easeOut" }}
                className="absolute rounded-full"
                style={{
                  width: 12 + (i % 3) * 6,
                  height: 3,
                  bottom: `${2 + (i % 4) * 3}%`,
                  left: `${(i * 23 + 8) % 90}%`,
                  background: "color-mix(in srgb, var(--weather-rainy-blob-2) 36%, transparent)",
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ─── Stormy: 번개 + 어두운 플래시 ─── */}
        {effect === "stormy" && (
          <motion.div
            key="stormy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {/* 어두운 베일 */}
            <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--weather-stormy-blob-2) 28%, transparent)" }} />

            {/* 번개 섬광 — 화면 전체 */}
            <motion.div
              animate={shouldLimitMotion
                ? { opacity: 0.08 }
                : { opacity: [0, 0, 0, 0.92, 0, 0.5, 0, 0] }
              }
              transition={shouldLimitMotion ? undefined : {
                duration: 4.5,
                repeat: Infinity,
                times: [0, 0.6, 0.75, 0.76, 0.78, 0.79, 0.82, 1],
                ease: "linear",
              }}
              className="absolute inset-0 bg-white"
            />

            {/* 번개 볼트 SVG */}
            {lightningBolts.map((bolt) => (
              <motion.div
                key={bolt.id}
                animate={shouldLimitMotion
                  ? { opacity: 0 }
                  : { opacity: [0, 0, 0, 1, 0, 0.6, 0, 0] }
                }
                transition={{
                  duration: bolt.duration,
                  repeat: Infinity,
                  delay: bolt.delay,
                  times: [0, 0.55, 0.74, 0.75, 0.77, 0.78, 0.81, 1],
                  ease: "linear",
                }}
                className="absolute"
                style={{ left: bolt.x, top: bolt.top }}
              >
                <svg width={bolt.width} height={bolt.height} viewBox={`0 0 ${bolt.width} ${bolt.height}`} fill="none">
                  <polyline
                    points={bolt.points}
                    stroke="rgba(255,240,100,0.92)"
                    strokeWidth={bolt.strokeW}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#bolt-glow)"
                  />
                  <defs>
                    <filter id="bolt-glow" x="-80%" y="-10%" width="260%" height="120%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                  </defs>
                </svg>
              </motion.div>
            ))}

            {/* 천둥 진동 — 섬광 후 화면 아래 흔들림 효과 */}
            <motion.div
              animate={shouldLimitMotion ? {} : {
                y: [0, 0, 0, -3, 2, -1, 0],
                opacity: [0.06, 0.06, 0.06, 0.12, 0.06, 0.06, 0.06],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0, 0.74, 0.77, 0.78, 0.80, 0.82, 1],
              }}
              className="absolute inset-0"
              style={{ background: "rgba(80,80,120,0.08)" }}
            />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

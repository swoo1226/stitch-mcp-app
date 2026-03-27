"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useMotionPreferences } from "./useMotionPreferences";

interface WaveConfig {
  color: string;
  speed: number;
  amplitude: number;
}

function getWaveConfig(score: number): WaveConfig {
  if (score >= 80) return { color: "rgba(250, 204, 21, 0.45)", speed: 0.012, amplitude: 18 };
  if (score >= 60) return { color: "rgba(148, 163, 184, 0.45)", speed: 0.008, amplitude: 22 };
  if (score >= 40) return { color: "rgba(96, 165, 250, 0.45)",  speed: 0.006, amplitude: 28 };
  return              { color: "rgba(99,  102, 241, 0.55)",  speed: 0.018, amplitude: 36 };
}

interface ClimaWaveProps {
  score?: number;
}

export const ClimaWave = ({ score = 80 }: ClimaWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const phaseRef  = useRef<number>(0);
  const { shouldLimitMotion } = useMotionPreferences();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = shouldLimitMotion ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const { color, speed, amplitude } = getWaveConfig(score);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      const waveY = height * 0.55;

      // 두 번째 파(뒤) — 약간 반투명하게
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x++) {
        const y = waveY
          + Math.sin(x * 0.018 + phaseRef.current * 0.7 + 1.2) * amplitude * 0.7
          + Math.sin(x * 0.009 + phaseRef.current * 0.4)        * amplitude * 0.4;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = color.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.5})`);
      ctx.fill();

      // 첫 번째 파(앞)
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x++) {
        const y = waveY
          + Math.sin(x * 0.015 + phaseRef.current)             * amplitude
          + Math.sin(x * 0.008 + phaseRef.current * 0.6 + 2.5) * amplitude * 0.5;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      phaseRef.current += speed;
      if (!shouldLimitMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [score, shouldLimitMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldLimitMotion ? { duration: 0.2 } : undefined}
      className={`overflow-hidden rounded-3xl bg-white/30 h-40 relative border border-white/20 shadow-sm ${
        shouldLimitMotion ? "" : "backdrop-blur-md"
      }`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center mix-blend-overlay pointer-events-none">
        <span className="text-6xl font-black">{score}</span>
        <span className="text-xs font-bold tracking-widest uppercase opacity-60">Clima Score</span>
      </div>
    </motion.div>
  );
};

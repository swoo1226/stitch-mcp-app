"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

function getWaveConfig(score) {
  if (score >= 80) return { color: "rgba(250, 204, 21, 0.45)", speed: 0.012, amplitude: 18 };
  if (score >= 60) return { color: "rgba(148, 163, 184, 0.45)", speed: 0.008, amplitude: 22 };
  if (score >= 40) return { color: "rgba(96, 165, 250, 0.45)",  speed: 0.006, amplitude: 28 };
  return              { color: "rgba(99,  102, 241, 0.55)",  speed: 0.018, amplitude: 36 };
}

export const ClimaWave = ({ score = 80 }) => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const phaseRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const { color, speed, amplitude } = getWaveConfig(score);

    const draw = () => {
      const { width, height } = canvas;
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
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [score]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl bg-white/30 backdrop-blur-md h-40 relative border border-white/20 shadow-sm"
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

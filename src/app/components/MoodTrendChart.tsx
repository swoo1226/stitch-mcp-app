"use client";

import { motion } from "framer-motion";
import { RESPONSIVE_SPRING } from "../constants/springs";
import { scoreToStatus, checkWarning, type WeatherStatus } from "../../lib/mood";

interface MoodTrendChartProps {
  scores: Array<number | null>;
  height?: number;
  className?: string;
}

function getWeatherColor(status: WeatherStatus): { fill: string; glow: string } {
  switch (status) {
    case "Stormy":       return { fill: "#2d3a52", glow: "rgba(45,58,82,0.45)" };
    case "Rainy":        return { fill: "#4a72b0", glow: "rgba(74,114,176,0.4)" };
    case "Cloudy":       return { fill: "#7fa3c0", glow: "rgba(127,163,192,0.35)" };
    case "PartlyCloudy": return { fill: "#4ab0e8", glow: "rgba(74,176,232,0.4)" };
    case "Sunny":        return { fill: "#1e9de0", glow: "rgba(30,157,224,0.45)" };
    default:             return { fill: "var(--primary)", glow: "transparent" };
  }
}

// score 0~100을 height의 6%~94% 범위에 매핑해 시각적 해상도를 높임
function pillCenterY(score: number, height: number, pillH: number): number {
  const pad = height * 0.06;
  const usable = height - pad * 2;
  const bottomPx = pad + (score / 100) * usable - pillH / 2;
  const clamped = Math.max(0, Math.min(height - pillH, bottomPx));
  return height - clamped - pillH / 2;
}

function pillCenterX(index: number, total: number): number {
  return (index + 0.5) / total;
}

// 제어점을 수직 방향으로 당겨 곡률 확보
function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const cpX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const tension = 0.4;
  const cp1Y = y1 + (midY - y1) * tension;
  const cp2Y = y2 + (midY - y2) * tension;
  return `M ${x1} ${y1} C ${cpX} ${cp1Y}, ${cpX} ${cp2Y}, ${x2} ${y2}`;
}

const LEVEL_CONFIG = [
  { level: 80, label: "맑음", color: "#1e9de0" },
  { level: 60, label: "구름조금", color: "#4ab0e8" },
  { level: 40, label: "흐림", color: "#7fa3c0" },
  { level: 20, label: "비", color: "#4a72b0" },
  { level: 0,  label: "뇌우", color: "#2d3a52" },
];

export function MoodTrendChart({ scores, height = 44, className = "" }: MoodTrendChartProps) {
  const PILL_H = 14; // 높이를 살짝 줄여 공간 확보
  const PILL_W = 10;
  const n = scores.length;
  const W = 100;

  const segments = [];
  let lastValidIdx = -1;
  for (let i = 0; i < n; i++) {
    const curr = scores[i];
    if (curr !== null) {
      if (lastValidIdx !== -1) {
        const x1 = pillCenterX(lastValidIdx, n) * W;
        const y1 = pillCenterY(scores[lastValidIdx]!, height, PILL_H);
        const x2 = pillCenterX(i, n) * W;
        const y2 = pillCenterY(curr, height, PILL_H);
        segments.push({ path: cubicPath(x1, y1, x2, y2), idx: i });
      }
      lastValidIdx = i;
    }
  }

  return (
    <div className={`relative w-full ${className}`} style={{ height: `${height}px` }}>
      {/* 배경 섹션 가이드 */}
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none rounded-[1rem] overflow-hidden opacity-[0.03]">
        <div className="h-1/5 w-full bg-[#1e9de0]" />
        <div className="h-1/5 w-full bg-[#4ab0e8]" />
        <div className="h-1/5 w-full bg-[#7fa3c0]" />
        <div className="h-1/5 w-full bg-[#4a72b0]" />
        <div className="h-1/5 w-full bg-[#2d3a52]" />
      </div>

      {/* 가이드라인 & 라벨 */}
      {LEVEL_CONFIG.map(({ level, label, color }) => (
        <div key={level} className="absolute w-full pointer-events-none" style={{ bottom: `${level}%` }}>
          <div
            className="w-full border-t border-dashed"
            style={{ borderColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
          />
          {height >= 60 && (
            <span
              className="absolute left-0 bottom-1 text-[8px] font-black tracking-tighter opacity-25"
              style={{ color }}
            >
              {label}
            </span>
          )}
        </div>
      ))}

      {/* 곡선 SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
        viewBox={`0 0 ${W} ${height}`}
        preserveAspectRatio="none"
      >
        {segments.map((seg, i) => (
          <motion.path
            key={i}
            d={seg.path}
            fill="none"
            stroke="color-mix(in srgb, var(--on-surface) 22%, transparent)"
            strokeWidth={1.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.12 + i * 0.07, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* 캡슐 레이어 */}
      {scores.map((score, i) => {
        const hasScore = score !== null;
        const prev = scores[i - 1];
        const isDropping = checkWarning(scores, i) !== null;

        const xPct = pillCenterX(i, n) * 100;
        const bottomPx = hasScore
          ? (() => {
              const pad = height * 0.06;
              const usable = height - pad * 2;
              return Math.max(0, Math.min(height - PILL_H, pad + (score! / 100) * usable - PILL_H / 2));
            })()
          : (height - PILL_H) / 2;

        const status = hasScore ? scoreToStatus(score!) : null;
        const { fill, glow } = status
          ? getWeatherColor(status)
          : { fill: "color-mix(in srgb, var(--on-surface) 15%, transparent)", glow: "transparent" };

        return (
          <div
            key={i}
            className="absolute group"
            style={{ left: `${xPct}%`, transform: "translateX(-50%)", width: PILL_W + 16, height: `${height}px` }}
          >
            {/* 세로 트랙 */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-px"
              style={{
                top: 0,
                height: `${height}px`,
                background: "color-mix(in srgb, var(--on-surface) 5%, transparent)",
              }}
            />

            {/* 캡슐 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: hasScore ? 1 : 0.2, scale: 1, bottom: bottomPx }}
              transition={{ ...RESPONSIVE_SPRING, delay: 0.08 + i * 0.06 }}
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                width: PILL_W,
                height: PILL_H,
                borderRadius: 999,
                background: fill,
                boxShadow: isDropping
                  ? `0 0 12px 4px rgba(239,68,68,0.35), 0 2px 6px ${glow}`
                  : `0 2px 8px ${glow}`,
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 rounded-t-full bg-gradient-to-b from-white/25 to-transparent" />
              {isDropping && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    borderRadius: 999,
                    boxShadow: "0 0 16px 6px rgba(239,68,68,0.6), 0 0 32px 12px rgba(239,68,68,0.25)",
                  }}
                  animate={{ opacity: [0.1, 1, 0.1] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: [0.45, 0, 0.55, 1],
                    times: [0, 0.4, 1],
                    repeatType: "loop",
                  }}
                />
              )}
            </motion.div>

            {/* hover 툴팁 */}
            {hasScore && (
              <div
                className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"
                style={{
                  bottom: bottomPx + PILL_H + 5,
                  background: "var(--surface-elevated)",
                  borderRadius: 6,
                  padding: "2px 6px",
                  fontSize: 10,
                  fontWeight: 900,
                  color: "var(--on-surface)",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                }}
              >
                {score}pt
                {prev !== null && prev !== undefined && score! !== prev && (
                  <span style={{ color: score! > prev ? "#1e9de0" : "#EF4444", marginLeft: 4 }}>
                    {score! > prev ? "↑" : "↓"}{Math.abs(score! - prev)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

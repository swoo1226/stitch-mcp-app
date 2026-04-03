"use client";

import { motion } from "framer-motion";
import { RESPONSIVE_SPRING } from "../constants/springs";
import { scoreToStatus, type WeatherStatus } from "../../lib/mood";

interface MoodTrendChartProps {
  scores: Array<number | null>; // 5일간의 점수 (월~금)
  height?: number;
  className?: string;
}

type TrendDirection = "up" | "down" | "flat";

function getDeltaFromPrevious(scores: Array<number | null>, index: number) {
  const previous = scores[index - 1];
  const current = scores[index];
  if (previous === null || current === null || previous === undefined) return null;

  const delta = current - previous;
  const direction: TrendDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { delta, direction };
}

function TrendArrow({ direction }: { direction: TrendDirection }) {
  if (direction === "flat") {
    return <span className="block h-[2px] w-[9px] rounded-full bg-current" />;
  }

  const path = direction === "down" ? "M6 2v8 M3 7l3 3 3-3" : "M6 10V2 M3 5l3-3 3 3";

  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="block h-[10px] w-[10px] shrink-0 overflow-visible"
      fill="none"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 5일간의 무드를 이산적인 기둥(Bar)으로 표현하는 초경량 차트.
 * 연속적인 선보다 하루 단위의 기록을 더 명확하게 전달하며 색상으로 상태를 개별 표현.
 */
export function MoodTrendChart({ scores, height = 40, className = "" }: MoodTrendChartProps) {
  const getBarColor = (score: number | null) => {
    if (score === null) return "var(--surface-container-high)";
    const status: WeatherStatus = scoreToStatus(score);
    switch (status) {
      case "Radiant": return "#FBBF24";
      case "Sunny": return "#FDE047";
      case "Foggy": return "#94A3B8";
      case "Rainy": return "#60A5FA";
      case "Stormy": return "#818CF8";
      default: return "var(--primary)";
    }
  };

  return (
    <div className={`relative w-full flex items-end justify-between gap-1 px-1 ${className}`} style={{ height: `${height}px` }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden pb-1">
        {[100, 75, 50, 25].map((level) => (
          <div
            key={level}
            className="absolute w-full border-t border-current opacity-[0.05] flex items-center"
            style={{ bottom: `${level}%` }}
          >
            <span className="absolute -left-1 text-[8px] font-black opacity-40 transform -translate-x-full">
              {level}%
            </span>
          </div>
        ))}
      </div>

      {scores.map((score, i) => {
        const hasScore = score !== null;
        const barHeight = hasScore ? Math.max(12, score) : 8;
        const barColor = getBarColor(score);
        const deltaFromPrevious = getDeltaFromPrevious(scores, i);
        const trendColor = deltaFromPrevious
          ? deltaFromPrevious.direction === "up"
            ? "var(--primary-dim)"
            : deltaFromPrevious.direction === "down"
              ? "var(--tertiary)"
              : "color-mix(in srgb, var(--on-surface) 56%, transparent)"
          : "transparent";
        const trendBackground = deltaFromPrevious
          ? deltaFromPrevious.direction === "up"
            ? "color-mix(in srgb, var(--primary-container) 44%, var(--surface-lowest))"
            : deltaFromPrevious.direction === "down"
              ? "color-mix(in srgb, var(--tertiary-container) 48%, var(--surface-lowest))"
              : "color-mix(in srgb, var(--surface-container-high) 72%, var(--surface-lowest))"
          : "transparent";

        return (
          <div key={i} className="relative flex-1 flex flex-col items-center group h-full justify-end">
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${barHeight}%`,
                opacity: hasScore ? 1 : 0.2
              }}
              transition={{
                ...RESPONSIVE_SPRING,
                delay: 0.1 + i * 0.05
              }}
              className="w-[12px] md:w-[16px] rounded-full shadow-sm relative overflow-hidden"
              style={{
                background: barColor,
                boxShadow: hasScore ? `0 4px 12px ${barColor}33` : "none"
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            </motion.div>

            {deltaFromPrevious && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...RESPONSIVE_SPRING,
                  delay: 0.18 + i * 0.05
                }}
                className="absolute z-10 flex items-center gap-1 rounded-full px-1.5 py-1 text-[9px] font-black shadow-sm md:text-[10px]"
                style={{
                  left: "50%",
                  top: 0,
                  transform: "translateX(-50%)",
                  color: trendColor,
                  background: trendBackground,
                }}
              >
                <TrendArrow direction={deltaFromPrevious.direction} />
                {deltaFromPrevious.direction !== "flat" && (
                  <span className="leading-none">
                    {deltaFromPrevious.delta > 0 ? "+" : ""}
                    {deltaFromPrevious.delta}
                  </span>
                )}
              </motion.div>
            )}

            {hasScore && (
              <div
                className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-surface-elevated px-2 py-1 rounded-md text-[11px] md:text-xs font-black shadow-lg z-20 border border-white/10 leading-none"
                style={{
                  left: "50%",
                  bottom: `calc(${barHeight}% + 2rem)`,
                  transform: "translateX(-50%)",
                }}
              >
                {score}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

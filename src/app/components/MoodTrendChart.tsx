"use client";

import { motion } from "framer-motion";
import { RESPONSIVE_SPRING } from "../constants/springs";
import { scoreToStatus, type WeatherStatus } from "../../lib/mood";

interface MoodTrendChartProps {
  scores: Array<number | null>; // 5일간의 점수 (월~금)
  height?: number;
  className?: string;
}

/**
 * 5일간의 무드를 이산적인 기둥(Bar)으로 표현하는 초경량 차트.
 * 연속적인 선보다 하루 단위의 기록을 더 명확하게 전달하며 색상으로 상태를 개별 표현.
 */
export function MoodTrendChart({ scores, height = 40, className = "" }: MoodTrendChartProps) {
  // 상태별 컬러 매핑 (Vibrant Atmospheric Colors)
  const getBarColor = (score: number | null) => {
    if (score === null) return "var(--surface-container-high)";
    const status: WeatherStatus = scoreToStatus(score);
    switch (status) {
      case "Radiant": return "#FBBF24"; // 쨍함 (황금빛)
      case "Sunny":   return "#FDE047"; // 맑음 (연노랑)
      case "Foggy":   return "#94A3B8"; // 안개 (차분한 그레이블루)
      case "Rainy":   return "#60A5FA"; // 비 (맑은 블루)
      case "Stormy":  return "#818CF8"; // 번개 (인디고)
      default:        return "var(--primary)";
    }
  };

  return (
    <div className={`relative w-full flex items-end justify-between gap-1 px-1 ${className}`} style={{ height: `${height}px` }}>
      {/* 배경 가이드 라인 (25%, 50%, 75%, 100%) */}
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

      {/* 5일간의 기둥 (월~금) */}
      {scores.map((score, i) => {
        const hasScore = score !== null;
        const barHeight = hasScore ? Math.max(12, score) : 8; // 최소 높이 보장
        const barColor = getBarColor(score);

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
              {/* 기둥 내 글래스 효과 (Top Highlight) */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
            </motion.div>
            
            {/* 호버 시 툴팁 느낌의 점수 표시 */}
            {hasScore && (
              <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-elevated px-1.5 py-0.5 rounded-md text-[9px] font-black shadow-lg z-20 border border-white/10">
                {score}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

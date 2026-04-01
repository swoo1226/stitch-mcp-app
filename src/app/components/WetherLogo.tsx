"use client";

import { motion } from "framer-motion";
import { useMotionPreferences } from "./useMotionPreferences";

export default function ClimaLogo() {
  const { shouldLimitMotion } = useMotionPreferences();

  return (
    <div className="logo-lockup select-none whitespace-nowrap">
      <motion.span
        className="logo-mark"
        animate={shouldLimitMotion ? undefined : { y: [0, -1.5, 0], rotate: [0, -2, 0] }}
        transition={shouldLimitMotion ? undefined : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 40 40" aria-hidden="true" className="h-9 w-9" style={{ filter: "drop-shadow(0 4px 8px rgba(0,102,104,0.35)) drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
          <defs>
            {/* 배경 그라데이션: 딥 틸 → 민트 (claymorphism 베이스) */}
            <radialGradient id="clBg" cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#1a8a8c" />
              <stop offset="55%" stopColor="#006668" />
              <stop offset="100%" stopColor="#004d4f" />
            </radialGradient>
            {/* 태양 그라데이션: 밝은 민트 → 틸 */}
            <radialGradient id="clSun" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#a8fafa" />
              <stop offset="50%" stopColor="#52f2f5" />
              <stop offset="100%" stopColor="#2ddde0" />
            </radialGradient>
            {/* 구름 그라데이션: 흰색 → 연한 민트 */}
            <linearGradient id="clCloud" x1="0%" y1="0%" x2="30%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d6fafa" />
            </linearGradient>
            {/* 글로시 하이라이트 */}
            <radialGradient id="clGloss" cx="40%" cy="20%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            {/* 구름 섀도우 필터 */}
            <filter id="clShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#004d4f" floodOpacity="0.28" />
            </filter>
          </defs>

          {/* 배경 원형 (claymorphism 베이스) */}
          <rect x="1" y="1" width="38" height="38" rx="19" fill="url(#clBg)" />

          {/* 태양 광선 (가는 선) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const cx = 15.5, cy = 15;
            const r1 = 6.8, r2 = 8.6;
            return (
              <line
                key={i}
                x1={cx + Math.cos(rad) * r1}
                y1={cy + Math.sin(rad) * r1}
                x2={cx + Math.cos(rad) * r2}
                y2={cy + Math.sin(rad) * r2}
                stroke="#a8fafa"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeOpacity="0.75"
              />
            );
          })}

          {/* 태양 본체 (3D 구체감) */}
          <circle cx="15.5" cy="15" r="5.4" fill="url(#clSun)" filter="url(#clShadow)" />
          {/* 태양 글로시 하이라이트 */}
          <ellipse cx="14" cy="13.2" rx="2.2" ry="1.5" fill="white" fillOpacity="0.42" />

          {/* 구름 본체 (claymorphism — 두툼하고 부드러운 느낌) */}
          <path
            d="M9.5 27.5
               C9.5 24.46 11.96 22 15 22
               C15.9 22 16.75 22.24 17.48 22.66
               C18.2 20.52 20.22 19 22.6 19
               C25.69 19 28.2 21.51 28.2 24.6
               C28.2 24.74 28.19 24.88 28.18 25.02
               C29.27 25.38 30.05 26.41 30.05 27.62
               C30.05 29.15 28.8 30.4 27.27 30.4
               H12.23 C10.7 30.4 9.5 29.15 9.5 27.62 Z"
            fill="url(#clCloud)"
            filter="url(#clShadow)"
          />
          {/* 구름 상단 글로시 */}
          <ellipse cx="22" cy="21.5" rx="3.2" ry="1.4" fill="white" fillOpacity="0.35" />
          <ellipse cx="15.2" cy="23.2" rx="1.8" ry="0.9" fill="white" fillOpacity="0.28" />

          {/* 전체 글로시 오버레이 */}
          <rect x="1" y="1" width="38" height="38" rx="19" fill="url(#clGloss)" />
        </svg>
      </motion.span>
      <div className="logo-text text-2xl">
        Cli
        <motion.span
          animate={shouldLimitMotion ? undefined : { opacity: [0.55, 0.95, 0.55] }}
          transition={shouldLimitMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
          style={shouldLimitMotion ? { opacity: 0.78 } : undefined}
        >
          ma
        </motion.span>
      </div>
    </div>
  );
}

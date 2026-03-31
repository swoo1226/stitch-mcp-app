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
        <svg viewBox="0 0 40 40" aria-hidden="true" className="h-9 w-9">
          <defs>
            <linearGradient id="climaLogoBg" x1="8" y1="6" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="var(--primary)" />
              <stop offset="1" stopColor="var(--primary-container)" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="36" height="36" rx="18" fill="url(#climaLogoBg)" />
          <path
            d="M11 24.4C11 20.87 13.87 18 17.4 18c1.69 0 3.24.66 4.39 1.73A6.1 6.1 0 0 1 32 23.4c0 3.1-2.51 5.6-5.6 5.6H17.6A6.6 6.6 0 0 1 11 24.4Z"
            fill="var(--surface-lowest)"
            fillOpacity="0.92"
          />
          <circle cx="14.8" cy="14.8" r="4.6" fill="var(--surface-lowest)" fillOpacity="0.72" />
          <path
            d="M16.6 11.8a5.9 5.9 0 0 1 2.46-1.36"
            stroke="var(--surface-lowest)"
            strokeOpacity="0.82"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
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

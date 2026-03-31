"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme, type ThemeMode } from "./ThemeProvider";

const THEME_ORDER: ThemeMode[] = ["system", "dark", "light"];

function nextTheme(theme: ThemeMode) {
  const index = THEME_ORDER.indexOf(theme);
  return THEME_ORDER[(index + 1) % THEME_ORDER.length];
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="11" rx="2.5" />
      <path d="M8.5 19.5h7M12 15.5v4" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.6 5.4l-1.7 1.7M7.1 16.9l-1.7 1.7M18.6 18.6l-1.7-1.7M7.1 7.1 5.4 5.4" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 14.5A6.5 6.5 0 0 1 9.5 6a7.4 7.4 0 1 0 8.5 8.5Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const label = theme === "system"
    ? `시스템 설정 사용 중 (${resolvedTheme === "dark" ? "다크" : "라이트"})`
    : theme === "dark"
      ? "다크 모드"
      : "라이트 모드";

  const icon = theme === "system"
    ? <MonitorIcon />
    : theme === "dark"
      ? <MoonIcon />
      : <SunIcon />;

  return (
    <motion.button
      type="button"
      title={`${label} · 클릭하면 다음 모드로 전환`}
      onClick={() => setTheme(nextTheme(theme))}
      whileTap={{ scale: 0.96 }}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${className}`}
      style={{
        color: "var(--header-action-color)",
        background: "var(--button-subtle-bg)",
        boxShadow: "var(--button-subtle-shadow)",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={theme}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {icon}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">{label}</span>
    </motion.button>
  );
}

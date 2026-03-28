"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RESPONSIVE_SPRING } from "../constants/springs";
import type React from "react";

// ─── Badge ────────────────────────────────────────────────────────────────────
// Usage: <Badge>Sunny</Badge>  <Badge variant="primary">Score</Badge>
type BadgeVariant = "secondary" | "primary" | "tertiary" | "surface";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  secondary: { background: "var(--secondary-container)", color: "var(--secondary)" },
  primary:   { background: "var(--primary-container)",   color: "var(--primary)" },
  tertiary:  { background: "var(--tertiary-container)",  color: "var(--tertiary)" },
  surface:   { background: "var(--surface-container-highest)", color: "var(--on-surface-variant)" },
};

export function Badge({ children, variant = "secondary", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.16em] ${className}`}
      style={BADGE_STYLES[variant]}
    >
      {children}
    </span>
  );
}

// ─── TabToggle ────────────────────────────────────────────────────────────────
// Usage: <TabToggle tabs={["Quick","Precise"]} active={tab} onChange={setTab} />
interface TabToggleProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}

export function TabToggle<T extends string>({ tabs, active, onChange }: TabToggleProps<T>) {
  return (
    <div className="flex gap-2 rounded-full p-1.5" style={{ background: "rgba(37,50,40,0.05)" }}>
      {tabs.map(({ value, label }) => (
        <motion.button
          key={value}
          onClick={() => onChange(value)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={RESPONSIVE_SPRING}
          className="relative text-xs font-black uppercase tracking-[0.12em] rounded-[1.5rem]"
          style={{
            color: active === value ? "var(--on-primary)" : "var(--secondary)",
            paddingLeft: "1.125rem",
            paddingRight: "1.125rem",
            paddingTop: "0.7rem",
            paddingBottom: "0.7rem",
          }}
        >
          {active === value && (
            <motion.div
              layoutId={`tab-pill-${tabs.map(t => t.value).join("-")}`}
              className="absolute inset-0 rounded-[1.5rem]"
              style={{ background: "linear-gradient(135deg, #2b6867 0%, #52f2f5 100%)" }}
              transition={RESPONSIVE_SPRING}
            />
          )}
          <span className="relative z-10">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Usage: <StatCard label="Clima Score" labelVariant="secondary" value="75%" />
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  labelVariant?: "primary" | "secondary" | "tertiary";
  className?: string;
}

const LABEL_COLORS = {
  primary:   "var(--primary)",
  secondary: "var(--secondary)",
  tertiary:  "var(--tertiary)",
};

export function StatCard({ label, value, labelVariant = "secondary", className = "" }: StatCardProps) {
  return (
    <div
      className={`p-6 rounded-[1.5rem] md:p-10 md:rounded-[3rem] ${className}`}
      style={{ background: "var(--surface-container)" }}
    >
      <span
        className="block text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-40"
        style={{ color: LABEL_COLORS[labelVariant] }}
      >
        {label}
      </span>
      <div className="text-3xl font-black md:text-5xl" style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-surface)" }}>
        {value}
      </div>
    </div>
  );
}

// ─── ClimaInput ───────────────────────────────────────────────────────────────
// Usage: <ClimaInput placeholder="오늘 한 마디..." value={v} onChange={setV} />
interface ClimaInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  className?: string;
}

export function ClimaInput({ label, className = "", ...props }: ClimaInputProps) {
  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-black uppercase tracking-[0.16em] opacity-60" style={{ color: "var(--on-surface)" }}>
          {label}
        </label>
      )}
      <input className="input-sanctuary" {...props} />
    </div>
  );
}

// ─── ClimaTextarea ────────────────────────────────────────────────────────────
interface ClimaTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: string;
  className?: string;
}

export function ClimaTextarea({ label, className = "", ...props }: ClimaTextareaProps) {
  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-black uppercase tracking-[0.16em] opacity-60" style={{ color: "var(--on-surface)" }}>
          {label}
        </label>
      )}
      <textarea className="input-sanctuary resize-none" rows={3} {...props} />
    </div>
  );
}

/**
 * 주요 액션 버튼. btn-sanctuary 스타일 기반.
 * variant: "primary" | "secondary"
 */
/**
 * 범용 버튼 컴포넌트.
 * variant: "primary" | "secondary" | "icon"
 * - primary/secondary: btn-sanctuary 스타일, hover/tap 애니메이션
 * - icon: 헤더 아이콘 버튼 (닫기, 네비게이션 등)
 */
/**
 * 날씨 타일 선택 버튼.
 * isSelected: 선택 상태 여부
 * Icon: SVG 아이콘 컴포넌트
 * label: 표시할 텍스트
 */

interface WeatherTileProps {
  Icon: React.FC<{ size?: number }>;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export function WeatherTile({ Icon, label, isSelected, onClick }: WeatherTileProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.92 }}
      transition={RESPONSIVE_SPRING}
      className="flex flex-col items-center rounded-[1.5rem] transition-colors relative w-full"
      style={{
        background: isSelected
          ? "linear-gradient(135deg, #2b6867 0%, #52f2f5 100%)"
          : "var(--surface-container)",
        boxShadow: isSelected ? "0 8px 24px -8px rgba(43,104,103,0.4)" : "none",
        paddingTop: "1.5rem",
        paddingBottom: "1rem",
        paddingLeft: "0.5rem",
        paddingRight: "0.5rem",
        gap: "0.75rem",
      }}
    >
      <div style={{ opacity: isSelected ? 1 : 0.75 }}>
        <Icon size={44} />
      </div>
      <span
        style={{
          color: isSelected ? "white" : "var(--on-surface)",
          opacity: isSelected ? 1 : 0.5,
          fontSize: "12px",
          fontWeight: 900,
          letterSpacing: "0.05em",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

interface ClimaButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "tertiary" | "icon";
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export function ClimaButton({
  children,
  onClick,
  href,
  variant = "primary",
  className = "",
  style,
  ...props
}: ClimaButtonProps) {
  if (variant === "icon") {
    const iconClass = `bg-surface-high w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-ambient transition-transform active:scale-90 ${className}`;
    if (href) return <Link href={href} className={iconClass} {...(props as Record<string, unknown>)}>{children}</Link>;
    return <button onClick={onClick} className={iconClass} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
  }

  const base =
    variant === "secondary"
      ? "btn-sanctuary-secondary"
      : variant === "tertiary"
        ? "btn-sanctuary-tertiary"
        : "btn-sanctuary";
  const defaultPadding = { paddingLeft: "1.5rem", paddingRight: "1.5rem" };

  const inner = (
    <motion.span
      className={`${base} ${className}`}
      style={{ ...defaultPadding, ...style }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={RESPONSIVE_SPRING}
      {...(onClick ? { onClick } : {})}
      {...(props as object)}
    >
      {children}
    </motion.span>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return <button onClick={onClick} className="contents">{inner}</button>;
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RESPONSIVE_SPRING, STANDARD_SPRING } from "../constants/springs";
import React, { useState, useEffect } from "react";
import { WEATHER_ICON_MAP } from "./WeatherIcons";
import type { WeatherStatus } from "../../lib/mood";

// ─── GlassCard ────────────────────────────────────────────────────────────────
// 공식 glassmorphism 카드. DESIGN.md "Glass & Gradient Rule" 준수.
// No-Line Rule: border 없음. ambient shadow 사용.
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  intensity?: "low" | "medium" | "high";
}

export function GlassCard({ children, className = "", style, intensity = "medium" }: GlassCardProps) {
  const blurMap = { low: "blur(16px)", medium: "blur(24px)", high: "blur(40px)" };
  const bgMap   = { low: "rgba(255,255,255,0.5)", medium: "rgba(255,255,255,0.65)", high: "rgba(255,255,255,0.8)" };

  return (
    <div
      className={`rounded-[2rem] ${className}`}
      style={{
        background: bgMap[intensity],
        backdropFilter: blurMap[intensity],
        WebkitBackdropFilter: blurMap[intensity],
        boxShadow: "0 40px 40px -10px rgba(37,50,40,0.06)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── GlassPanel ──────────────────────────────────────────────────────────────
// 섹션 내부 중첩 패널. GlassCard보다 얇은 glass.
interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function GlassPanel({ children, className = "", style }: GlassPanelProps) {
  return (
    <div
      className={`rounded-[1.75rem] ${className}`}
      style={{
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 16px 32px -12px rgba(37,50,40,0.08)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const SANCTUARY_INPUT_CLASS =
  "w-full rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all focus:bg-surface-lowest focus:border-primary/15";

const SANCTUARY_PRIMARY_BUTTON_CLASS =
  "relative inline-flex min-h-[3.75rem] items-center justify-center gap-2 rounded-[1.6rem] px-9 py-[0.95rem] font-extrabold tracking-[-0.01em] whitespace-nowrap transition-all active:scale-95";

const SANCTUARY_SECONDARY_BUTTON_CLASS =
  "relative inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.6rem] px-8 py-[0.9rem] font-extrabold tracking-[-0.01em] whitespace-nowrap transition-all active:scale-95 bg-surface-highest text-secondary";

const SANCTUARY_TERTIARY_BUTTON_CLASS =
  "relative inline-flex min-h-14 items-center justify-center gap-2 rounded-[1.6rem] px-8 py-[0.9rem] font-extrabold tracking-[-0.01em] whitespace-nowrap transition-all active:scale-95 bg-tertiary-container text-tertiary";

interface PageHeadlineProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function PageHeadline({
  children,
  className = "",
  as: Component = "h1",
}: PageHeadlineProps) {
  return (
    <Component
      className={`text-4xl font-extrabold tracking-tight lg:text-5xl ${className}`}
      style={{
        fontFamily: "'Public Sans', 'Pretendard', sans-serif",
        lineHeight: 1.1,
        color: "var(--on-surface)",
      }}
    >
      {children}
    </Component>
  );
}

interface SanctuaryCardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export function SanctuaryCard({
  children,
  className = "",
  as: Component = "div",
  style,
  ...props
}: SanctuaryCardProps) {
  return (
    <Component
      className={`relative rounded-[3.5rem] p-8 transition-all ${className}`}
      style={{
        backgroundColor: "var(--surface-lowest)",
        boxShadow: "var(--shadow-ambient)",
        border: "none",
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
// DESIGN.md: label-md — All-Caps, 0.18em tracking
interface SectionLabelProps {
  children: React.ReactNode;
  color?: "primary" | "secondary" | "tertiary" | "muted";
  className?: string;
}

const LABEL_COLOR_MAP = {
  primary:   "var(--primary)",
  secondary: "var(--secondary)",
  tertiary:  "var(--tertiary)",
  muted:     "var(--on-surface)",
};

export function SectionLabel({ children, color = "primary", className = "" }: SectionLabelProps) {
  return (
    <p
      className={`text-xs font-extrabold uppercase tracking-[0.18em] ${className}`}
      style={{ color: LABEL_COLOR_MAP[color], opacity: color === "muted" ? 0.45 : 0.7 }}
    >
      {children}
    </p>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number; // 0–100
  variant?: "gradient" | "primary" | "secondary" | "error";
  height?: number;
  className?: string;
  animate?: boolean;
}

const BAR_BG = {
  gradient: "linear-gradient(90deg, #2b6867, #52f2f5)",
  primary:  "var(--primary)",
  secondary:"var(--secondary)",
  error:    "var(--error)",
};

export function ProgressBar({ value, variant = "gradient", height = 8, className = "", animate = true }: ProgressBarProps) {
  return (
    <div
      className={`w-full rounded-full overflow-hidden ${className}`}
      style={{ height, background: "rgba(37,50,40,0.08)" }}
    >
      <motion.div
        initial={animate ? { width: 0 } : { width: `${value}%` }}
        animate={{ width: `${value}%` }}
        transition={animate ? { duration: 0.9, ease: "easeOut", delay: 0.2 } : undefined}
        className="h-full rounded-full"
        style={{ background: BAR_BG[variant] }}
      />
    </div>
  );
}

// ─── PlayfulGeometry ─────────────────────────────────────────────────────────
// DESIGN.md 섹션 5: 배경 원/아크 장식 패턴
interface PlayfulGeometryProps {
  variant?: "dots" | "arc" | "circle";
  color?: string;
  className?: string;
}

export function PlayfulGeometry({ variant = "circle", color = "var(--primary)", className = "" }: PlayfulGeometryProps) {
  if (variant === "dots") {
    return (
      <div className={`pointer-events-none absolute ${className}`} aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 6 + (i % 3) * 4,
              height: 6 + (i % 3) * 4,
              background: color,
              opacity: 0.12,
              top: `${10 + (i * 20) % 80}%`,
              left: `${5 + (i * 25) % 85}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "arc") {
    return (
      <div className={`pointer-events-none absolute ${className}`} aria-hidden>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <path d="M10 110 Q60 10 110 60" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.12" />
          <path d="M20 110 Q70 20 110 70" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.07" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      aria-hidden
      style={{ background: color, opacity: 0.07 }}
    />
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = "secondary" | "primary" | "tertiary" | "surface" | "error";

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
  error:     { background: "var(--error-container)",     color: "var(--error)" },
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
interface TabToggleProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
  layoutId?: string;
}

export function TabToggle<T extends string>({ tabs, active, onChange, layoutId }: TabToggleProps<T>) {
  const id = layoutId ?? `tab-${tabs.map(t => t.value).join("-")}`;
  return (
    <div className="flex items-center rounded-full p-1" style={{ background: "rgba(37,50,40,0.05)" }}>
      {tabs.map(({ value, label }) => (
        <motion.button
          key={value}
          onClick={() => onChange(value)}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={RESPONSIVE_SPRING}
          className="relative text-xs font-bold px-5 py-2 rounded-full transition-colors"
          style={{ color: active === value ? "var(--primary)" : "var(--on-surface-variant)" }}
        >
          {active === value && (
            <motion.div
              layoutId={id}
              className="absolute inset-0 rounded-full bg-white shadow-sm"
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
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  labelVariant?: "primary" | "secondary" | "tertiary";
  className?: string;
}

export function StatCard({ label, value, labelVariant = "secondary", className = "" }: StatCardProps) {
  return (
    <GlassPanel className={`p-6 md:p-10 ${className}`}>
      <SectionLabel color={labelVariant} className="mb-2 md:mb-4">{label}</SectionLabel>
      <div
        className="text-3xl font-black md:text-5xl"
        style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-surface)" }}
      >
        {value}
      </div>
    </GlassPanel>
  );
}

// ─── ClimaInput ───────────────────────────────────────────────────────────────
interface ClimaInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
  label?: string;
  className?: string;
}

export function ClimaInput({ label, className = "", ...props }: ClimaInputProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {label && <SectionLabel color="muted">{label}</SectionLabel>}
      <input
        className={`${SANCTUARY_INPUT_CLASS} ${className}`}
        style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1.5px solid transparent" }}
        {...props}
      />
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
    <div className="w-full flex flex-col gap-2">
      {label && <SectionLabel color="muted">{label}</SectionLabel>}
      <textarea
        className={`${SANCTUARY_INPUT_CLASS} resize-none ${className}`}
        style={{ background: "var(--surface-container-low)", color: "var(--on-surface)", border: "1.5px solid transparent" }}
        rows={3}
        {...props}
      />
    </div>
  );
}

// ─── WeatherTile ──────────────────────────────────────────────────────────────
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

// ─── PrimaryTabToggle ─────────────────────────────────────────────────────────
// Signature Gradient 활성 탭 토글. input 페이지처럼 강한 인상이 필요한 곳에 사용.
// TabToggle과 달리 active 탭 = gradient 배경 + 흰 텍스트 (더 impactful).
interface PrimaryTabToggleProps<T extends string> {
  tabs: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
}

export function PrimaryTabToggle<T extends string>({ tabs, active, onChange }: PrimaryTabToggleProps<T>) {
  return (
    <div className="flex gap-2 rounded-full p-1.5" style={{ background: "rgba(37,50,40,0.05)" }}>
      {tabs.map(({ value, label }) => (
        <motion.button
          key={value}
          onClick={() => onChange(value)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={RESPONSIVE_SPRING}
          className="relative text-xs md:text-sm font-black uppercase tracking-[0.12em] rounded-[1.5rem]"
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
              layoutId={`primary-tab-${tabs.map(t => t.value).join("-")}`}
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

// ─── FAB (Floating Action Button) ────────────────────────────────────────────
// DESIGN.md: Primary CTA. Signature Gradient, pill-shaped, ambient shadow.
// 화면 하단 fixed 위치에 사용.
interface FABProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function FAB({ children, onClick, href, className = "" }: FABProps) {
  const inner = (
    <motion.span
      className={`${SANCTUARY_PRIMARY_BUTTON_CLASS} ${className}`}
      style={{
        minHeight: "unset",
        paddingTop: "0.875rem",
        paddingBottom: "0.875rem",
        paddingLeft: "2.5rem",
        paddingRight: "2.5rem",
        background: "linear-gradient(135deg, #2b6867 0%, #52f2f5 100%)",
        color: "var(--on-primary)",
        boxShadow: "0 16px 44px -14px rgba(43, 104, 103, 0.42)",
      }}
      whileHover={{ scale: 1.04, y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={RESPONSIVE_SPRING}
      {...(onClick ? { onClick } : {})}
    >
      {children}
    </motion.span>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return <button onClick={onClick} className="contents">{inner}</button>;
}

// ─── ClimaButton ──────────────────────────────────────────────────────────────
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
      ? SANCTUARY_SECONDARY_BUTTON_CLASS
      : variant === "tertiary"
        ? SANCTUARY_TERTIARY_BUTTON_CLASS
        : SANCTUARY_PRIMARY_BUTTON_CLASS;

  const variantStyle =
    variant === "secondary"
      ? { boxShadow: "0 12px 32px -18px rgba(0, 88, 186, 0.28)" }
      : variant === "tertiary"
        ? { boxShadow: "0 12px 32px -18px rgba(155, 61, 55, 0.28)" }
        : {
            background: "linear-gradient(135deg, #2b6867 0%, #52f2f5 100%)",
            color: "var(--on-primary)",
            boxShadow: "0 16px 44px -14px rgba(43, 104, 103, 0.42)",
          };

  const inner = (
    <motion.span
      className={`${base} ${className}`}
      style={{ ...variantStyle, ...style }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={RESPONSIVE_SPRING}
      {...(props as object)}
    >
      {children}
    </motion.span>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return <button type="button" onClick={onClick} className="contents">{inner}</button>;
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
// 섹션 제목 블록. 원형 아이콘 래퍼 + 제목 + 부제목.
// 용도: 페이지 내 주요 섹션의 제목 영역.
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ icon, title, subtitle, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.5rem]"
        style={{ background: "rgba(0,102,104,0.09)", color: "var(--primary)" }}
      >
        {icon}
      </div>
      <div>
        <h2
          className="text-2xl font-black tracking-tight md:text-3xl"
          style={{ color: "var(--primary)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm font-medium" style={{ color: "rgba(37,50,40,0.55)" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── WeatherCell ──────────────────────────────────────────────────────────────
// 니코니코 캘린더 날씨 셀. 3가지 상태:
//   status=null  → 빈 원 (기록 없음)
//   status=값    → 날씨 아이콘
//   isToday=true → 배경 틴트 + 하단 primary 점
interface WeatherCellProps {
  status: WeatherStatus | null;
  score?: number | null;
  isToday?: boolean;
}

export function WeatherCell({ status, score, isToday = false }: WeatherCellProps) {
  if (status === null) {
    return (
      <div className="flex justify-center">
        <div
          className="h-9 w-9 rounded-full"
          style={{ background: "rgba(37,50,40,0.07)" }}
          title="기록 없음"
        />
      </div>
    );
  }

  const Icon = WEATHER_ICON_MAP[status];
  return (
    <div className="flex justify-center">
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-[1.5rem]"
        style={{ background: isToday ? "rgba(0,102,104,0.08)" : "transparent" }}
        title={score != null ? `${status} (${score}점)` : status}
      >
        <Icon size={34} />
        {isToday && (
          <div
            className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
            style={{ background: "var(--primary)" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── NikoGridHeader ───────────────────────────────────────────────────────────
// 니코니코 캘린더 요일+날짜 헤더 행.
// colTemplate는 부모 그리드와 동일한 gridTemplateColumns 문자열을 받아 정렬을 맞춤.
interface NikoGridHeaderProps {
  days: Array<{ label: string; date: Date }>;
  todayIso: string; // "YYYY-MM-DD"
  colTemplate: string;
  className?: string;
}

export function NikoGridHeader({ days, todayIso, colTemplate, className = "" }: NikoGridHeaderProps) {
  return (
    <div
      className={`mb-5 grid px-3 ${className}`}
      style={{ gridTemplateColumns: colTemplate }}
    >
      <SectionLabel color="muted">TEAM MEMBER</SectionLabel>
      {days.map(({ label, date }, i) => {
        const y = date.getFullYear();
        const mo = String(date.getMonth() + 1).padStart(2, "0");
        const dy = String(date.getDate()).padStart(2, "0");
        const iso = `${y}-${mo}-${dy}`;
        const isToday = iso === todayIso;
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <SectionLabel color={isToday ? "primary" : "muted"}>{label}</SectionLabel>
            <span
              className="text-xs font-bold"
              style={{ color: isToday ? "var(--primary)" : "rgba(37,50,40,0.4)" }}
            >
              {date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── NikoMemberRow ────────────────────────────────────────────────────────────
// 니코니코 캘린더 팀원 한 행. 아바타+이름+서브텍스트 + WeatherCell 배열.
// loading=true 시 skeleton 표시.
interface NikoMemberRowCell {
  status: WeatherStatus | null;
  score: number | null;
}

interface NikoMemberRowProps {
  avatar: string;
  name: string;
  subtitle?: string;
  week: NikoMemberRowCell[];
  todayIndex: number; // 오늘 열 인덱스 (0-4), 해당 없으면 -1
  colTemplate: string;
  loading?: boolean;
}

export function NikoMemberRow({
  avatar,
  name,
  subtitle,
  week,
  todayIndex,
  colTemplate,
  loading = false,
}: NikoMemberRowProps) {
  if (loading) {
    return (
      <div
        className="grid items-center rounded-[1.5rem] px-3 py-5"
        style={{ gridTemplateColumns: colTemplate, background: "rgba(37,50,40,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-full" style={{ background: "rgba(37,50,40,0.08)" }} />
          <div className="h-4 w-24 animate-pulse rounded-full" style={{ background: "rgba(37,50,40,0.08)" }} />
        </div>
        {week.map((_, j) => (
          <div key={j} className="flex justify-center">
            <div className="h-9 w-9 animate-pulse rounded-full" style={{ background: "rgba(37,50,40,0.08)" }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ backgroundColor: "rgba(0,102,104,0.05)" }}
      transition={STANDARD_SPRING}
      className="grid items-center rounded-[1.5rem] px-3 py-5"
      style={{ gridTemplateColumns: colTemplate }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ background: "rgba(37,50,40,0.07)" }}
        >
          {avatar
            ? avatar
            : (() => {
                const todayStatus = todayIndex >= 0 ? week[todayIndex]?.status : null;
                if (todayStatus) {
                  const Icon = WEATHER_ICON_MAP[todayStatus];
                  return <Icon size={22} />;
                }
                return <span className="text-sm font-black" style={{ color: "rgba(37,50,40,0.3)" }}>{name.slice(0, 1)}</span>;
              })()
          }
        </div>
        <div className="min-w-0">
          <span
            className="block truncate text-[1.02rem] font-extrabold tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            {name}
          </span>
          {subtitle && (
            <span className="block text-xs font-medium" style={{ color: "rgba(37,50,40,0.45)" }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {week.map((cell, dayIdx) => (
        <WeatherCell
          key={dayIdx}
          status={cell.status}
          score={cell.score}
          isToday={dayIdx === todayIndex}
        />
      ))}
    </motion.div>
  );
}

// ─── MiniStatCard ─────────────────────────────────────────────────────────────
// 작은 인라인 통계 카드. StatCard보다 compact (px-4 py-3, text-xl).
// 용도: 페이지 헤더 영역의 요약 수치 표시.
interface MiniStatCardProps {
  label: string;
  value: React.ReactNode;
  valueColor?: "primary" | "default";
  className?: string;
}

export function MiniStatCard({ label, value, valueColor = "default", className = "" }: MiniStatCardProps) {
  return (
    <GlassPanel className={`px-4 py-3 ${className}`}>
      <SectionLabel color="muted" className="mb-1">{label}</SectionLabel>
      <div
        className="text-xl font-black"
        style={{ color: valueColor === "primary" ? "var(--primary)" : "var(--on-surface)" }}
      >
        {value}
      </div>
    </GlassPanel>
  );
}

// ─── NikoCalendar ────────────────────────────────────────────────────────────
// 니코니코 캘린더 전체 그리드 컴포넌트.
// members: 각 팀원의 이름·아바타·주간 데이터 배열.
// pageSize: 한 페이지당 최대 행 수. 초과 시 페이지네이션 표시.
export interface NikoCalendarMember {
  id: string;
  name: string;
  avatar?: string;
  subtitle?: string;
  week: Array<{ status: WeatherStatus | null; score: number | null }>;
}

interface NikoCalendarProps {
  members: NikoCalendarMember[];
  weekDays: Date[];         // 5개 날짜 (월~금)
  todayIso: string;         // "YYYY-MM-DD"
  loading?: boolean;
  pageSize?: number;        // 미설정 시 전체 표시 (페이지네이션 없음)
  colTemplate?: string;
}

export function NikoCalendar({
  members,
  weekDays,
  todayIso,
  loading = false,
  pageSize,
  colTemplate = "200px repeat(5, minmax(80px, 1fr))",
}: NikoCalendarProps) {
  const [page, setPage] = useState(0);

  // members나 pageSize가 바뀌면 첫 페이지로
  useEffect(() => { setPage(0); }, [members, pageSize]);

  const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI"];
  const todayIndex = weekDays.findIndex((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dy = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dy}` === todayIso;
  });

  const headerDays = weekDays.map((date, i) => ({ label: DAY_LABELS[i], date }));

  const totalPages = pageSize ? Math.ceil(members.length / pageSize) : 1;
  const pageMembers = pageSize ? members.slice(page * pageSize, (page + 1) * pageSize) : members;

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: "600px" }}>
        <NikoGridHeader
          days={headerDays}
          todayIso={todayIso}
          colTemplate={colTemplate}
        />
        <div className="flex flex-col gap-2">
          {loading
            ? Array.from({ length: pageSize ?? 5 }, (_, i) => (
                <NikoMemberRow
                  key={i}
                  avatar=""
                  name=""
                  week={Array.from({ length: 5 }, () => ({ status: null, score: null }))}
                  todayIndex={todayIndex}
                  colTemplate={colTemplate}
                  loading
                />
              ))
            : pageMembers.map((member) => (
                <NikoMemberRow
                  key={member.id}
                  avatar={member.avatar ?? ""}
                  name={member.name}
                  subtitle={member.subtitle}
                  week={member.week}
                  todayIndex={todayIndex}
                  colTemplate={colTemplate}
                />
              ))
          }
        </div>

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between pt-4 mt-3"
            style={{ borderTop: "1px solid rgba(37,50,40,0.07)" }}
          >
            <span className="text-sm font-medium" style={{ color: "rgba(37,50,40,0.45)" }}>
              {page * pageSize! + 1}–{Math.min((page + 1) * pageSize!, members.length)} / {members.length}명
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-30"
                style={{ background: "rgba(37,50,40,0.06)" }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black transition-colors"
                  style={page === i
                    ? { background: "var(--primary)", color: "#fff" }
                    : { background: "rgba(37,50,40,0.06)", color: "rgba(37,50,40,0.6)" }
                  }
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-30"
                style={{ background: "rgba(37,50,40,0.06)" }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WeatherLegend ────────────────────────────────────────────────────────────
// 날씨 범례 바. Stormy~Radiant 아이콘+한글 라벨 + "기록 없음" 항목 고정 포함.
const WEATHER_LEGEND_ITEMS: Array<{ status: WeatherStatus; label: string }> = [
  { status: "Stormy",  label: "번개" },
  { status: "Rainy",   label: "비" },
  { status: "Foggy",   label: "안개" },
  { status: "Sunny",   label: "맑음" },
  { status: "Radiant", label: "쨍함" },
];

interface WeatherLegendProps {
  className?: string;
}

export function WeatherLegend({ className = "" }: WeatherLegendProps) {
  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <SectionLabel color="muted">범례</SectionLabel>
      {WEATHER_LEGEND_ITEMS.map(({ status, label }) => {
        const Icon = WEATHER_ICON_MAP[status];
        return (
          <div key={status} className="flex items-center gap-1.5">
            <Icon size={24} />
            <span className="text-xs font-semibold" style={{ color: "rgba(37,50,40,0.6)" }}>
              {label}
            </span>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5">
        <div className="h-6 w-6 rounded-full" style={{ background: "rgba(37,50,40,0.07)" }} />
        <span className="text-xs font-semibold" style={{ color: "rgba(37,50,40,0.6)" }}>기록 없음</span>
      </div>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RESPONSIVE_SPRING } from "../constants/springs";
import type React from "react";

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
  variant?: "primary" | "secondary" | "icon";
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

  const base = variant === "secondary" ? "btn-sanctuary-secondary" : "btn-sanctuary";
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

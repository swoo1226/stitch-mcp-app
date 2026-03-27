"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RESPONSIVE_SPRING } from "../constants/springs";

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
export function ClimaButton({
  children,
  onClick,
  href,
  variant = "primary",
  className = "",
  style,
  ...props
}) {
  if (variant === "icon") {
    const iconClass = `bg-surface-high w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-ambient transition-transform active:scale-90 ${className}`;
    if (href) return <Link href={href} className={iconClass} {...props}>{children}</Link>;
    return <button onClick={onClick} className={iconClass} {...props}>{children}</button>;
  }

  const base = variant === "secondary" ? "btn-sanctuary-secondary" : "btn-sanctuary";
  const defaultPadding = { paddingLeft: "1rem", paddingRight: "1rem" };

  const inner = (
    <motion.span
      className={`${base} ${className}`}
      style={{ ...defaultPadding, ...style }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={RESPONSIVE_SPRING}
      {...(onClick ? { onClick } : {})}
      {...props}
    >
      {children}
    </motion.span>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return <button onClick={onClick} className="contents">{inner}</button>;
}

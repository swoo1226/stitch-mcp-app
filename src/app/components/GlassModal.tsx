"use client";

import { motion } from "framer-motion";
import type React from "react";
import { HEAVY_SPRING } from "../constants/springs";

interface GlassModalProps {
  onClose?: () => void;
  children: React.ReactNode;
  /** 최대 너비 (기본값: "26rem") */
  maxWidth?: string;
  /** 오버레이 클릭 시 닫기 여부 (기본값: true) */
  closeOnOverlay?: boolean;
}

/**
 * DESIGN.md "Glass & Gradient Rule" 기반 모달.
 * AnimatePresence로 감싸서 사용하세요.
 *
 * @example
 * <AnimatePresence>
 *   {open && (
 *     <GlassModal onClose={() => setOpen(false)}>
 *       <p>내용</p>
 *     </GlassModal>
 *   )}
 * </AnimatePresence>
 */
export default function GlassModal({
  onClose,
  children,
  maxWidth = "26rem",
  closeOnOverlay = true,
}: GlassModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md"
      style={{ background: "rgba(255,255,255,0.10)" }}
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 32 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={HEAVY_SPRING}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full flex flex-col items-center text-center"
        style={{
          maxWidth,
          borderRadius: "2.5rem",
          padding: "2.5rem 2rem",
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          // DESIGN.md "Ghost Border Fallback": outline_variant at 15% opacity
          border: "1px solid rgba(162,177,163,0.15)",
          boxShadow: "0 30px 100px -20px rgba(37,50,40,0.12)",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

"use client";

import { createContext, useContext } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import type React from "react";
import { STANDARD_SPRING } from "../constants/springs";

// Context: 내부에서 headerScale/headerY 사용 가능
interface BottomSheetContextValue {
  headerScale: MotionValue<number>;
  headerY: MotionValue<number>;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export function useBottomSheet() {
  return useContext(BottomSheetContext);
}

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  /** 시트 높이 (기본값: "85vh") */
  height?: string;
}

/**
 * 드래그로 닫을 수 있는 바텀 시트.
 * AnimatePresence로 감싸서 사용하세요.
 *
 * @example
 * <AnimatePresence>
 *   {open && (
 *     <>
 *       <BottomSheetOverlay onClose={() => setOpen(false)} />
 *       <BottomSheet onClose={() => setOpen(false)}>...</BottomSheet>
 *     </>
 *   )}
 * </AnimatePresence>
 */
export function BottomSheet({ onClose, children, height = "85vh" }: BottomSheetProps) {
  const dragY = useMotionValue(0);
  const headerScale = useTransform(dragY, [0, 300], [0.8, 1]);
  const headerY = useTransform(dragY, [0, 300], [-20, 0]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 400 }}
      dragElastic={0.15}
      onDragEnd={(_, info) => {
        if (info.offset.y > 150) onClose();
      }}
      transition={STANDARD_SPRING}
      className="fixed inset-x-0 bottom-0 z-50 px-5 md:px-12 pt-5 md:pt-12 pb-8 md:pb-10 flex flex-col rounded-t-[2rem] md:rounded-t-[5rem] overflow-hidden will-change-transform"
      style={{
        height,
        y: dragY,
        background: "var(--surface-lowest)",
        boxShadow: "0 -20px 80px rgba(37,50,40,0.08)",
      }}
    >
      {/* 드래그 핸들 */}
      <div
        className="w-12 h-1.5 rounded-full mx-auto mb-5 md:mb-6 shrink-0"
        style={{ background: "rgba(37,50,40,0.2)" }}
      />

      <BottomSheetContext.Provider value={{ headerScale, headerY }}>
        {children}
      </BottomSheetContext.Provider>
    </motion.div>
  );
}

export function BottomSheetOverlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-40 backdrop-blur-3xl will-change-opacity"
      style={{ background: "rgba(37,50,40,0.05)" }}
    />
  );
}

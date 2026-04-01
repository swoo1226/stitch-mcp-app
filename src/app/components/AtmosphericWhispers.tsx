"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTextLayout } from "../../lib/pretext-utils";

interface WhisperProps {
  text: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
  color: string;
  mouseX: number;
  mouseY: number;
}

/**
 * 개별 부유 메시지 (Whisper) 컴포넌트.
 * Pretext를 사용하여 텍스트 레이아웃을 계산하고, 배경에서 부드럽게 표류합니다.
 */
function Whisper({ text, initialX, initialY, duration, delay, color, mouseX, mouseY }: WhisperProps) {
  const layout = useTextLayout({
    text,
    fontSize: 14,
    fontFamily: "Pretendard, sans-serif",
    maxWidth: 240,
    lineHeight: 1.4
  });

  // 마우스 위치에 따른 유연한 오프셋 (패럴랙스)
  // 마우스 위치(0~100)를 중앙 기준으로 변환하여 -20px ~ 20px 이동
  const xMouseOffset = (mouseX - 50) * -0.4;
  const yMouseOffset = (mouseY - 50) * -0.4;

  return (
    <motion.div
      initial={{ 
        opacity: 0,
        scale: 0.9,
        filter: "blur(8px)"
      }}
      animate={{ 
        translateX: [0, (Math.random() * 20 - 10), 0],
        translateY: [0, (Math.random() * -30 - 20), 0],
        // 마우스 오프셋을 애니메이션 x, y와 별도로 제어하거나 합산
        x: xMouseOffset,
        y: yMouseOffset,
        opacity: [0, 0.45, 0.45, 0],
        scale: [0.95, 1.05, 1],
        filter: ["blur(4px)", "blur(0px)", "blur(1px)", "blur(4px)"]
      }}
      transition={{ 
        duration, 
        delay, 
        repeat: Infinity,
        times: [0, 0.4, 0.8, 1],
        ease: "linear"
      }}
      className="absolute pointer-events-none select-none z-0"
      style={{ 
        left: `${initialX}%`,
        top: `${initialY}%`,
        width: layout.width + 32,
        height: layout.height + 20,
        color: color
      }}
    >
      <div 
        className="w-full h-full rounded-full flex items-center justify-center px-5 py-2.5 relative"
        style={{ 
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          backdropFilter: "blur(12px)",
          boxShadow: `0 12px 40px -10px ${color}22`,
          border: `1px solid color-mix(in srgb, white 20%, transparent)`
        }}
      >
        <div 
          className="absolute inset-0 rounded-full opacity-60" 
          style={{ background: `radial-gradient(circle at 20% 20%, white 0%, transparent 80%)` }}
        />
        <span className="text-[14px] font-black tracking-tight text-center leading-tight whitespace-pre-wrap relative z-10">
          {text}
        </span>
      </div>
    </motion.div>
  );
}

interface AtmosphericWhispersProps {
  messages: string[];
  themeColor?: string;
}

export function AtmosphericWhispers({ messages, themeColor = "var(--primary)" }: AtmosphericWhispersProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setIsMounted(true);
    const handleMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const validMessages = useMemo(() => 
    Array.from(new Set(messages.filter(m => m && m.length > 2))).slice(0, 10), 
    [messages]
  );

  // 파라미터 생성도 클라이언트 마운트 이후에 고정되도록 함 (Hydration Mismatch 방지)
  const whispers = useMemo(() => {
    if (!isMounted) return [];
    return validMessages.map((text, i) => ({
      id: `${text}-${i}`,
      text,
      initialX: 5 + Math.random() * 85,
      initialY: 15 + Math.random() * 65,
      duration: 20 + Math.random() * 20,
      delay: i * 2.5,
      color: themeColor
    }));
  }, [validMessages, themeColor, isMounted]);

  if (!isMounted || validMessages.length === 0) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <AnimatePresence>
        {whispers.map((w) => (
          <Whisper 
            key={w.id} 
            {...w}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  disabled?: boolean;
}

/**
 * PWA/모바일 최적화 Pull to Refresh 컴포넌트
 * 서비스 디자인 시스템의 Glassmorphism 및 Signature Gradient 반영.
 */
export default function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0); // 0 to 1
  
  const y = useMotionValue(0);
  const springY = useSpring(y, { stiffness: 400, damping: 40 });
  
  // 당기는 거리에 따른 로더 효과 (0~80px 사이에서 반응)
  const loaderOpacity = useTransform(y, [0, 60], [0, 1]);
  const loaderScale = useTransform(y, [0, 60], [0.5, 1]);
  const loaderRotate = useTransform(y, [0, 100], [0, 360]);

  const threshold = 80;
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing || window.scrollY > 0) return;
    startY.current = e.touches[0].pageY;
    isPulling.current = true;
    setPullProgress(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current || disabled || isRefreshing) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;

    // 위로 스크롤하거나 이미 아래로 스크롤 중이면 무시
    if (diff <= 0) {
      if (y.get() !== 0) y.set(0);
      return;
    }

    // 최상단이 아닐 때 당기기 시작하는 것 방지
    if (window.scrollY > 0) return;

    // 저항력(Resistance) 적용: 아래로 당길수록 더 무거워지게
    const resistedDiff = Math.pow(diff, 0.8) * 2;
    y.set(resistedDiff);
    
    const progress = Math.min(resistedDiff / threshold, 1);
    setPullProgress(progress);

    // 기본 브라우저 스크롤 방지 (당기기 시작한 경우)
    if (resistedDiff > 5 && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    const currentY = y.get();
    if (currentY >= threshold) {
      startRefresh();
    } else {
      animate(y, 0, { type: "spring", stiffness: 300, damping: 30 });
      setPullProgress(0);
    }
  };

  const startRefresh = async () => {
    setIsRefreshing(true);
    setPullProgress(1);
    
    // 로딩 위치 고정 (임계값 지점)
    animate(y, 60, { type: "spring", stiffness: 300, damping: 30 });

    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // 기본 동작: Next.js Revalidation + 지연
        router.refresh();
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    } finally {
      // 복귀 애니메이션
      setIsRefreshing(false);
      setPullProgress(0);
      animate(y, 0, { type: "spring", stiffness: 200, damping: 25 });
    }
  };

  return (
    <div 
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overflowAnchor: "none" }}
    >
      {/* 로딩 인디케이터: 헤더 아래에 떠 있는 느낌의 Glassmorphism 칩 */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-[60] flex justify-center">
        <motion.div 
          className="flex h-11 px-4 items-center justify-center rounded-full shadow-lg"
          style={{ 
            y: springY,
            opacity: loaderOpacity, 
            scale: loaderScale,
            background: "rgba(255, 255, 255, 0.45)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            marginTop: "1.5rem", // 헤더(h-16) 아래에 위치하도록 조정
            boxShadow: "0 8px 32px -4px rgba(3, 105, 161, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.4)"
          }}
        >
          {/* 회전 로더 영역 */}
          <div className="flex items-center gap-2.5">
            <motion.div
              style={{ rotate: isRefreshing ? undefined : loaderRotate }}
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.1 }}
              className="flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <motion.circle 
                  cx="12" cy="12" r="9" 
                  fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ 
                    pathLength: isRefreshing ? 0.3 : pullProgress * 0.85,
                    opacity: 0.8
                  }}
                />
              </svg>
            </motion.div>
            <span className="text-[11px] font-black uppercase tracking-widest text-primary opacity-80">
              {isRefreshing ? "Updating..." : pullProgress >= 0.95 ? "Release" : "Pull"}
            </span>
          </div>
        </motion.div>
      </div>

      {/* 컨텐츠 레이어: 헤더를 가리지 않도록 전체 컨텐츠만 아래로 밀림 */}
      <motion.div 
        style={{ y: springY }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

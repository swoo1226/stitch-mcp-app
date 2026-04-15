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
    >
      {/* 로딩 인디케이터 컨테이너 */}
      <motion.div 
        className="pointer-events-none absolute top-0 left-0 right-0 z-[100] flex justify-center pt-4"
        style={{ y: springY }}
      >
        <motion.div 
          className="flex h-10 w-10 items-center justify-center rounded-full shadow-lg"
          style={{ 
            opacity: loaderOpacity, 
            scale: loaderScale,
            rotate: isRefreshing ? undefined : loaderRotate,
            background: "var(--glass-bg-high)",
            backdropFilter: "var(--glass-blur-low)",
            border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)"
          }}
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : { duration: 0.1 }}
        >
          {/* 안쪽 아이콘/링 */}
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <motion.circle 
              cx="12" cy="12" r="9" 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ 
                pathLength: isRefreshing ? 0.3 : pullProgress * 0.8,
                opacity: 0.8
              }}
            />
            {!isRefreshing && pullProgress >= 0.9 && (
              <motion.path 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                d="M12 8v4l3 3" 
                stroke="var(--primary)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none"
              />
            )}
          </svg>
        </motion.div>
      </motion.div>

      {/* 컨텐츠 영역: 당겨지는 효과를 위해 y축 이동 적용 */}
      <motion.div style={{ y: springY }}>
        {children}
      </motion.div>
    </div>
  );
}

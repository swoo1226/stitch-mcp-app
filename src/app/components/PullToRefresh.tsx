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
      {/* 
        Atmospheric Pull-to-Refresh UI 
        헤더(z-50) 아래(z-40)에서 조용히 나타나는 효과
      */}
      <div 
        className="pointer-events-none fixed top-0 left-0 right-0 z-[45] flex justify-center"
        style={{ 
          height: "300px", 
          // 하단 경계선을 부드럽게 지우기 위한 마스크
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)"
        }}
      >
        {/* 후광(Halo) 효과: 당길수록 헤더 아래에서 빛이 스며 나옴 */}
        <motion.div 
          className="absolute rounded-full"
          style={{ 
            top: "-20px",
            width: "500px", 
            height: "250px",
            y: useTransform(springY, [0, threshold], [-60, 20]),
            scale: useTransform(springY, [0, threshold], [0.8, 1.3]),
            opacity: useTransform(springY, [0, threshold], [0, 0.5]),
            background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 75%)",
            filter: "blur(60px)",
          }}
        />

        {/* 메인 태양 심볼 인디케이터: 헤더(16/4rem) 높이만큼 띄움 */}
        <motion.div 
          className="relative flex flex-col items-center justify-center"
          style={{ 
            marginTop: "4.5rem", // 헤더(h-16) 바로 아래 타겟팅
            y: useTransform(springY, [0, threshold], [-20, 10]),
            opacity: loaderOpacity, 
            scale: loaderScale,
          }}
        >
          {/* 빛나는 링 */}
          <div className="relative flex items-center justify-center">
            <motion.div 
              className="absolute inset-[-10px] rounded-full"
              style={{ 
                border: "2px solid var(--primary)",
                opacity: 0.1,
                scale: 1,
              }}
              animate={isRefreshing ? { 
                scale: [1, 1.25, 1], 
                opacity: [0.1, 0.3, 0.1] 
              } : { 
                scale: 1,
                opacity: 0.1
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            />
            
            <motion.div
              style={{ rotate: isRefreshing ? undefined : loaderRotate }}
              animate={isRefreshing ? { rotate: 360 } : {}}
              transition={isRefreshing ? { repeat: Infinity, duration: 2, ease: "linear" } : { duration: 0.1 }}
              className="flex items-center justify-center text-primary"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 drop-shadow-[0_0_12px_rgba(3,105,161,0.5)]">
                {/* ☀️ 태양 중심 */}
                <circle cx="12" cy="12" r="3.2" fill="currentColor" />
                {/* 태양 광선들: 쫀득한 엇박자 투명도 변화 */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.line
                    key={i}
                    x1="12" y1="6" x2="12" y2="3.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    style={{ 
                      transformOrigin: "12px 12px",
                      rotate: i * 45,
                      opacity: useTransform(springY, [15 + i * 6, threshold], [0, 1]),
                    }}
                  />
                ))}
              </svg>
            </motion.div>
          </div>
          
          {/* 미세한 맥박 인디케이터 */}
          <motion.div 
            className="mt-3.5 flex gap-1.5"
            style={{ 
              opacity: useTransform(springY, [threshold - 15, threshold], [0, 0.85]),
              scale: useTransform(springY, [threshold - 15, threshold], [0.8, 1])
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.div 
                key={i}
                className="w-1 h-1 rounded-full bg-primary"
                animate={isRefreshing ? { opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] } : {}}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                style={{ opacity: 0.3 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* 실질적인 컨텐츠 층: 묻히지 않도록 z-index 부여 */}
      <motion.div 
        style={{ y: springY }}
        className="relative z-10 will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}

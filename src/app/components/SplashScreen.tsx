"use client";

import { useEffect, useState } from "react";

/**
 * PWA 스플래시 화면.
 * - standalone(홈화면) 모드에서만 표시
 * - 최소 800ms 유지 후 인증/hydration 완료 시점에 fade-out
 * - 워드마크 fade-in + 점 3개 bounce 애니메이션
 */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // standalone PWA 모드일 때만 표시
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true);

    if (!isStandalone) return;

    setVisible(true);

    // 최소 표시 시간 800ms + 페이지 load 이벤트 중 더 늦은 것
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 800));
    const pageReady = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });

    Promise.all([minDelay, pageReady]).then(() => {
      setFading(true);
      setTimeout(() => setVisible(false), 400); // fade-out duration
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f0fcfb 0%, #b1eeeb 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* 워드마크 */}
      <div
        style={{
          animation: "splashFadeIn 0.6s ease forwards",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "3rem",
            fontWeight: 800,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: "#2b6867",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Clima
        </div>
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "1rem",
            fontFamily: "'Manrope', sans-serif",
            color: "#4d6364",
            letterSpacing: "0.01em",
          }}
        >
          팀의 날씨를 읽다
        </div>
      </div>

      {/* 점 3개 bounce */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginTop: "2.5rem",
          animation: "splashFadeIn 0.6s ease 0.3s both",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "0.4rem",
              height: "0.4rem",
              borderRadius: "9999px",
              background: "#2b6867",
              opacity: 0.6,
              animation: `splashBounce 1s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splashFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

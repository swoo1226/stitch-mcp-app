"use client";

import { useRef, useEffect } from "react";
import FadeIn from "./FadeIn";
import { WEATHER_STATES } from "../../constants/landing";
import { statusToKo } from "../../../lib/mood";

function WeatherCarousel() {
  const CARD_W = 260;
  const GAP = 16;
  const TOTAL = WEATHER_STATES.length;
  const LOOP_W = (CARD_W + GAP) * TOTAL;

  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const SPEED = 0.8;

  useEffect(() => {
    function tick() {
      xRef.current += SPEED;
      if (xRef.current >= LOOP_W) xRef.current -= LOOP_W;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${xRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [LOOP_W]);

  const cards = [...WEATHER_STATES, ...WEATHER_STATES];

  return (
    <div className="md:hidden overflow-hidden -mx-6">
      <div ref={trackRef} className="flex" style={{ gap: GAP, willChange: "transform" }}>
        {cards.map((state, i) => (
          <div
            key={i}
            className="shrink-0 rounded-[2rem] p-5 flex flex-col gap-3"
            style={{
              width: CARD_W,
              background: state.bg,
              backdropFilter: "var(--glass-blur-low)",
              boxShadow: "var(--glass-shadow)",
            }}
          >
            <div className="flex items-center justify-between">
              <state.icon size={36} />
              <span
                className="text-xs font-black rounded-full px-2.5 py-1"
                style={{ background: "var(--surface-overlay)", color: state.status === "Stormy" ? "var(--on-surface)" : state.accent }}
              >
                {state.range}
              </span>
            </div>
            <div>
              <p className="font-black text-sm tracking-tight mb-1" style={{ color: "var(--on-surface)" }}>{statusToKo(state.status)}</p>
              <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{state.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingWeatherStates() {
  return (
    <section
      className="py-24 md:py-32 px-6 md:px-10 xl:px-16"
      style={{ background: "color-mix(in srgb, var(--surface-elevated) 65%, transparent)" }}
    >
      <div className="max-w-[1280px] mx-auto">
        <FadeIn className="text-center mb-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
            5단계 날씨
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            뇌우부터 맑음까지
          </h2>
          <p className="text-base font-medium mt-4 max-w-lg mx-auto" style={{ color: "var(--text-muted)" }}>
            점수가 자동으로 날씨로 변환돼요. 나쁜 상태일수록 색이 선명하게 달라서 한눈에 알아볼 수 있어요.
          </p>
        </FadeIn>

        {/* 데스크탑: 한 줄 flex */}
        <div className="hidden md:flex gap-4 xl:gap-6">
          {WEATHER_STATES.map((state, i) => (
            <FadeIn key={state.status} delay={i * 0.06} className="flex-1 min-w-0">
              <div
                className="h-full rounded-[2rem] p-5 flex flex-col gap-3 transition-transform hover:scale-[1.02] cursor-default"
                style={{
                  background: state.bg,
                  backdropFilter: "var(--glass-blur-low)",
                  boxShadow: "var(--glass-shadow)",
                }}
              >
                <div className="flex items-center justify-between">
                  <state.icon size={36} />
                  <span
                    className="text-xs font-black rounded-full px-2.5 py-1"
                    style={{ background: "var(--surface-overlay)", color: state.status === "Stormy" ? "var(--on-surface)" : state.accent }}
                  >
                    {state.range}
                  </span>
                </div>
                <div>
                  <p className="font-black text-sm tracking-tight mb-1" style={{ color: "var(--on-surface)" }}>{statusToKo(state.status)}</p>
                  <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{state.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* 모바일: 자동 슬라이드 캐러셀 */}
        <WeatherCarousel />
      </div>
    </section>
  );
}

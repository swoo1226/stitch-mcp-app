"use client";

import FadeIn from "./FadeIn";
import { HOW_IT_WORKS } from "../../constants/landing";

export default function LandingHowItWorks() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 xl:px-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: feature steps */}
          <div>
            <FadeIn>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
                이런 식으로 작동해요
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-6" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                팀원은 기록하고,
                <br />
                <span style={{ color: "var(--primary)" }}>팀장은 먼저 알아채요</span>
              </h2>
              <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
                맑음·구름조금·흐림·비·뇌우 — 5단계 날씨가 숫자보다 빠르게 팀 분위기를 전달해요.
              </p>
            </FadeIn>
          </div>

          {/* Right: numbered steps */}
          <div className="flex flex-col gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div
                  className="flex gap-5 rounded-[2rem] px-6 py-5"
                  style={{ background: "var(--surface-overlay)", backdropFilter: "var(--glass-blur-low)", boxShadow: "var(--glass-shadow)" }}
                >
                  <div
                    className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 text-sm font-black"
                    style={{ background: "var(--highlight-soft)", color: "var(--primary)" }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <p className="font-bold text-base mb-1 tracking-tight" style={{ color: "var(--on-surface)" }}>{step.title}</p>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text-muted)" }}>{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

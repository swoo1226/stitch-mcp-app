"use client";

import Link from "next/link";
import FadeIn from "./FadeIn";

export default function LandingCTABanner() {
  return (
    <section className="py-20 md:py-28 px-6 md:px-10 xl:px-16">
      <div className="max-w-[1280px] mx-auto">
        <FadeIn>
          <div
            className="rounded-[3rem] px-8 md:px-16 py-12 md:py-16 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--primary-container) 0%, color-mix(in srgb, var(--primary) 64%, var(--primary-container)) 50%, var(--primary) 100%)",
              boxShadow: "var(--button-primary-shadow)",
            }}
          >
            {/* Background circles */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full" style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)" }} />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full" style={{ background: "color-mix(in srgb, var(--primary) 10%, transparent)" }} />

            <div className="relative z-10">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] mb-4" style={{ color: "color-mix(in srgb, var(--on-primary) 64%, transparent)" }}>
                지금 시작해요
              </p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: "'Public Sans', sans-serif", color: "var(--on-primary)" }}>
                우리 팀, 오늘 어때요?
              </h2>
              <p className="text-base md:text-lg font-medium mb-10 max-w-md mx-auto" style={{ color: "color-mix(in srgb, var(--on-primary) 72%, transparent)" }}>
                팀원은 10초로 오늘 날씨를 남기고, 팀장은 뇌우가 오기 전에 먼저 다가가세요.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  href="/request-access"
                  className="inline-flex items-center gap-2 h-14 px-10 rounded-[1.5rem] text-base font-bold transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: "var(--surface-lowest)", color: "var(--primary)", boxShadow: "var(--glass-shadow)" }}
                >
                  우리 팀도 써보기
                </Link>
                <Link
                  href="/dashboard?team=demo"
                  className="inline-flex items-center gap-2 h-14 px-10 rounded-[1.5rem] text-base font-bold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "color-mix(in srgb, var(--on-primary) 14%, transparent)", color: "var(--on-primary)", backdropFilter: "var(--glass-blur-low)" }}
                >
                  대시보드 미리보기
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import FadeIn from "./FadeIn";
import { IconSunny, IconCloudy, IconRainy } from "../WeatherIcons";

export default function LandingInsightsPreview() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10 xl:px-16">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: mock dashboard */}
          <FadeIn y={32}>
            <div
              className="rounded-[2.5rem] overflow-hidden"
              style={{
                background: "var(--surface-elevated)",
                backdropFilter: "var(--glass-blur-medium)",
                boxShadow: "var(--glass-shadow)",
              }}
            >
              {/* Mock header */}
              <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--weather-radiant-blob-1)" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--primary)" }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--track-bg)" }} />
                <span className="ml-2 text-xs font-bold" style={{ color: "var(--text-soft)" }}>팀 대시보드 — 이번 주</span>
              </div>

              {/* Mini stats row */}
              <div className="grid grid-cols-3 gap-px" style={{ background: "var(--border-subtle)" }}>
                {[
                  { label: "팀 컨디션", value: "78", color: "var(--primary)" },
                  { label: "체크인", value: "8/10", color: "var(--secondary)" },
                  { label: "추이", value: "+12%", color: "color-mix(in srgb, var(--primary) 56%, #27ae60)" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center py-4 px-3" style={{ background: "var(--surface-overlay)" }}>
                    <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: "var(--text-soft)" }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Mock bar chart */}
              <div className="px-6 py-6">
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "var(--text-soft)" }}>주간 추이</p>
                <div className="flex items-end gap-2 h-[80px]">
                  {[55, 62, 71, 68, 78, 74, 82].map((val, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(val / 100) * 80}px` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
                      className="flex-1 rounded-t-lg"
                      style={{
                        background: i === 6
                          ? "linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 72%, white))"
                          : "color-mix(in srgb, var(--primary) 18%, transparent)",
                        minHeight: 4,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  {["월", "화", "수", "목", "금", "토", "일"].map((d) => (
                    <p key={d} className="flex-1 text-center text-[9px] font-bold" style={{ color: "var(--text-soft)" }}>{d}</p>
                  ))}
                </div>
              </div>

              {/* Mock member list */}
              <div className="px-6 pb-6 flex flex-col gap-2">
                {[
                  { name: "팀원 A", status: "Sunny" as const, score: 82, Icon: IconSunny, color: "color-mix(in srgb, var(--primary) 12%, var(--surface-overlay))" },
                  { name: "팀원 B", status: "Cloudy" as const, score: 52, Icon: IconCloudy, color: "color-mix(in srgb, #EAB308 10%, var(--surface-overlay))" },
                  { name: "팀원 C", status: "Rainy" as const, score: 18, Icon: IconRainy, color: "color-mix(in srgb, #F97316 10%, var(--surface-overlay))" },
                ].map((m) => (
                  <div key={m.name} className="flex items-center gap-3 rounded-[1.2rem] px-4 py-2.5" style={{ background: "var(--button-subtle-bg)" }}>
                    <div className="w-8 h-8 rounded-[0.75rem] flex items-center justify-center shrink-0" style={{ background: m.color }}>
                      <m.Icon size={18} />
                    </div>
                    <p className="flex-1 text-sm font-bold" style={{ color: "var(--on-surface)" }}>{m.name}</p>
                    <span className="text-xs font-black" style={{ color: "var(--primary)" }}>{m.score}pt</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Right: text */}
          <div className="flex flex-col gap-6">
            <FadeIn>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] mb-4" style={{ color: "var(--primary)", opacity: 0.7 }}>
                팀장을 위한 기능
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4" style={{ fontFamily: "'Public Sans', sans-serif" }}>
                뇌우가 오기 전에{" "}
                <span style={{ color: "var(--primary)" }}>먼저 다가가요</span>
              </h2>
              <p className="text-base font-medium leading-relaxed max-w-sm" style={{ color: "var(--text-muted)" }}>
                일별 체크인 히스토리와 주간 추이로 팀 컨디션의 패턴을 한눈에 파악할 수 있어요.
              </p>
            </FadeIn>

            <div className="flex flex-col gap-4">
              {[
                { icon: "📅", title: "주간 체크인 기록", desc: "팀 전체의 일별 체크인 패턴을 한눈에 파악해요." },
                { icon: "⚡", title: "즉각 알림", desc: "팀원의 날씨가 '비' 또는 '뇌우'로 떨어지면 팀장에게 바로 알려줘요." },
              ].map((feat, i) => (
                <FadeIn key={feat.title} delay={0.1 + i * 0.1}>
                  <div
                    className="flex gap-4 rounded-[1.75rem] px-6 py-5"
                    style={{ background: "var(--surface-overlay)", backdropFilter: "var(--glass-blur-low)", boxShadow: "var(--glass-shadow)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-[1rem] flex items-center justify-center shrink-0 text-lg"
                      style={{ background: "var(--highlight-soft)" }}
                    >
                      {feat.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm mb-1" style={{ color: "var(--on-surface)" }}>{feat.title}</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{feat.desc}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>

            <FadeIn delay={0.3}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-soft)" }}>
                팀의 분위기를 한눈에 확인하고 대처하세요.
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

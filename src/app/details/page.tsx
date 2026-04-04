"use client";

import Link from "next/link";
import DynamicBackground from "../components/DynamicBackground";
import { SanctuaryCard } from "../components/ui";

interface InsightItem {
  name: string;
  desc: string;
  tag: string;
  color: string;
}

export default function DetailsPage() {
  const insights: InsightItem[] = [
    { name: "김지우 선임 (Data Eng)", desc: "3일 연속 컨디션 '번아웃' 위험군 감지", tag: "주의관찰 권고", color: "error" },
    { name: "이현우 주임 (Backend)", desc: "최근 프로젝트 적응도 및 참여도 하락", tag: "1:1 티타임 권장", color: "secondary" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={55} />
      <div className="px-4 md:px-8 pt-12 md:pt-16 pb-24 w-full max-w-lg mx-auto relative z-10">

      <header className="flex justify-between items-center mb-10 w-full">
        <div className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center text-xl shadow-ambient">🌱</div>
        <Link href="/" className="w-12 h-12 rounded-2xl bg-surface-high flex items-center justify-center font-bold shadow-ambient transition-transform active:scale-90">✕</Link>
      </header>

      <div className="mb-10 pt-4">
        <p className="label-sm mb-1 text-primary/60">Condition Tracker - Backend Part</p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight font-[Plus Jakarta Sans]">백엔드 파트 상세 분석</h1>
      </div>

      <SanctuaryCard className="mb-8">
        <p className="text-sm md:text-base leading-relaxed opacity-70 font-medium">서버 파트 구성원 12명의 정성적/정량적 컨디션을 종합 분석한 결과입니다. 현재 전반적인 분위기는 다소 정체되어 있습니다.</p>
      </SanctuaryCard>

      <section className="bg-surface-container text-on-surface rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden mb-8 shadow-ambient">
        <div className="flex justify-between items-center mb-12">
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-primary">Current State</p>
                <h2 className="text-3xl font-extrabold font-[Plus Jakarta Sans]">흐림 (Cloudy)</h2>
            </div>
            <span className="text-6xl opacity-20">☁️</span>
        </div>
        <p className="text-sm font-medium opacity-60">일부 구성원들의 업무 로드 균형이 무너져 있으며,<br />목표 지점이 다소 불분명한 상태입니다.</p>
        <div className="mt-6 flex gap-2 items-center bg-tertiary-container/45 p-3 rounded-2xl">
            <span className="text-tertiary">💡</span>
            <span className="text-xs font-bold">상황 판단 2건 진행 중</span>
        </div>
      </section>

      <section className="text-center py-12 mb-8 bg-surface-low rounded-[3rem]">
        <div className="relative inline-flex items-center justify-center w-40 h-40">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="var(--surface-container-highest)" strokeWidth="15" fill="transparent" />
                <circle cx="80" cy="80" r="70" stroke="var(--primary)" strokeWidth="15" fill="transparent" strokeDasharray="439.8" strokeDashoffset="110" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col items-center">
                <span className="text-4xl font-extrabold font-[Plus Jakarta Sans] text-primary">12</span>
                <span className="text-[10px] uppercase font-black tracking-widest opacity-40 mt-1">Members</span>
            </div>
        </div>
      </section>

      <div className="mb-12 pb-12">
        <p className="text-[10px] font-black mb-4 uppercase tracking-[0.2em] opacity-40 text-tertiary">구성원 인사이트</p>
        <div className="flex flex-col gap-4">
            {insights.map((insight, i) => (
                <SanctuaryCard key={i} className="py-6 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <div className="w-12 h-12 shrink-0 rounded-[1.5rem] bg-surface-high flex items-center justify-center shadow-inner">
                        <span className="text-xl">👤</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-extrabold mb-1 tracking-tight">{insight.name}</h3>
                        <p className="text-xs font-medium opacity-60 mb-3 md:mb-0 leading-relaxed max-w-sm">{insight.desc}</p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shrink-0 ${
                        insight.color === "error"
                          ? "bg-error-container text-error"
                          : "bg-secondary-container text-primary"
                      }`}
                    >
                      {insight.tag}
                    </span>
                </SanctuaryCard>
            ))}
        </div>
      </div>

      </div>
    </div>
  );
}

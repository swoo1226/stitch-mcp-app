"use client";

import Link from "next/link";
import DynamicBackground from "../components/DynamicBackground";
import { ClimaButton, PageHeadline, SanctuaryCard } from "../components/ui";

export default function PersonalGarden() {
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={92} />
      <div className="px-4 md:px-8 pt-12 md:pt-16 pb-24 w-full max-w-lg mx-auto relative z-10">

      <header className="flex justify-between items-center mb-10 w-full">
        <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center text-xl shadow-ambient">🪴</div>
        <Link href="/" className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center font-bold shadow-ambient transition-transform active:scale-90">✕</Link>
      </header>

      <div className="mb-10 pt-4">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-primary">The Digital Atrium</p>
        <PageHeadline className="font-black">나의 비밀 정원</PageHeadline>
      </div>

      <section className="bg-surface-lowest text-on-surface rounded-[2.5rem] flex flex-col items-center py-12 px-6 shadow-ambient mb-8">
        <p className="text-sm md:text-base font-medium opacity-60 text-center leading-relaxed">오늘 당신의 마음 정원 지수는 대단히 평화롭습니다. <br className="hidden md:block"/> 깊은 호흡으로 수분을 보충해주세요.</p>

        <div className="relative w-48 h-48 flex items-center justify-center mt-8 mb-4">
            <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-lg">
                <circle cx="96" cy="96" r="88" stroke="var(--surface-container-high)" strokeWidth="12" fill="transparent" />
                <circle cx="96" cy="96" r="88" stroke="var(--primary)" strokeWidth="12" fill="transparent" strokeDasharray="552.92" strokeDashoffset="44.23" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col items-center">
                <span className="text-5xl font-extrabold font-[Plus Jakarta Sans] leading-none text-primary">92%</span>
                <span className="text-[10px] font-black tracking-widest opacity-40 mt-2 uppercase">본질 지수</span>
            </div>
        </div>
      </section>

      <section className="bg-surface-container rounded-[2rem] p-6 md:p-8 mb-8">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6">컨디션 캘린더</p>
        <div className="grid grid-cols-7 gap-2 md:gap-4 text-center text-[10px] md:text-xs font-bold">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => <span key={d} className="opacity-40 mb-2">{d}</span>)}
            {[...Array(30)].map((_, i) => (
                <div key={i} className={`h-8 md:h-10 flex items-center justify-center rounded-[1.5rem] ${i === 6 ? "bg-gradient-to-tr from-primary to-primary-container text-white shadow-md shadow-primary/20" : "opacity-60 bg-white/40"}`}>
                    {i + 1}
                </div>
            ))}
        </div>
      </section>

      <SanctuaryCard as="section" className="mb-8">
        <span className="text-[10px] font-black uppercase tracking-widest bg-tertiary-container text-tertiary px-3 py-1 rounded-full inline-block mb-4">Weekly Best</span>
        <h2 className="text-xl font-bold mb-4 font-[Plus Jakarta Sans]">이번 주 목요일은<br /> 가장 맑은 날이었어요</h2>
        <div className="flex items-center gap-3">
            <span className="text-2xl">☀️</span>
            <span className="text-xs font-bold text-primary">평균 지수보다 24% 높았습니다.</span>
        </div>
      </SanctuaryCard>

      <div className="mb-12 pb-12">
        <p className="text-[10px] font-black mb-4 uppercase tracking-[0.2em] opacity-40 text-tertiary">AI 마음 인사이트</p>
        <SanctuaryCard className="bg-surface-high">
            <p className="text-sm leading-relaxed italic mb-8 opacity-80 font-medium">"수요일의 15분 명상이 목요일의 업무 몰입도를 15% 향상시켰습니다. 마음을 돌보는 시간이 생산성의 비결이 되었네요."</p>
            <div className="flex flex-col md:flex-row gap-3">
                <ClimaButton variant="tertiary" className="text-xs py-3.5 px-6">명상 가이드 보기</ClimaButton>
                <ClimaButton variant="secondary" className="text-xs py-3.5 px-6">상세 통계</ClimaButton>
            </div>
        </SanctuaryCard>
      </div>

      </div>
    </div>
  );
}

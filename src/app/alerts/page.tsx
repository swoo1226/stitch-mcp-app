"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { Badge, ClimaButton, PageHeadline, SanctuaryCard, SectionLabel } from "../components/ui";
import DynamicBackground from "../components/DynamicBackground";

interface Alert {
  id: number;
  title: string;
  team: string;
  desc: string;
  level: "High" | "Medium";
}

export default function AlertsPage() {
  const alerts: Alert[] = [
    { id: 1, title: "폭풍 경보", team: "마케팅", desc: "주말 과도한 활동으로 번아웃 위험이 감지됐어요.", level: "High" },
    { id: 2, title: "안개 주의보", team: "백엔드", desc: "소통이 단절된 것처럼 보여요. 연결이 필요해요.", level: "Medium" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={30} />
      <div className="px-4 md:px-8 pt-12 md:pt-16 pb-24 w-full max-w-lg mx-auto relative z-10">
      <header className="flex justify-between items-center mb-16">
        <Link href="/"><ClimaLogo /></Link>
        <ClimaButton variant="icon" href="/">✕</ClimaButton>
      </header>

      <motion.div
        initial={{ filter: "blur(15px)", opacity: 0 }}
        animate={{ filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <SectionLabel color="tertiary" className="mb-4">위험 센터</SectionLabel>
        <PageHeadline className="mb-12">팀이 어떤지<br />살펴봐요.</PageHeadline>

        <div className="grid gap-8">
          {alerts.map((alert) => (
            <SanctuaryCard
              key={alert.id}
              className={`overflow-hidden ${alert.level === 'High' ? 'bg-error-container/30' : 'bg-surface-container'}`}
            >
              <motion.div whileHover={{ y: -5 }}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge variant={alert.level === 'High' ? 'error' : 'surface'}>{alert.level === 'High' ? '높은' : '중간'} 위험</Badge>
                  <h2 className="text-2xl font-extrabold font-[Plus Jakarta Sans] mt-6">{alert.title}</h2>
                </div>
                <span className="text-5xl opacity-80">{alert.level === 'High' ? '⛈️' : '🌫️'}</span>
              </div>
              <p className="text-sm font-medium opacity-60 leading-relaxed mb-10 max-w-md">
                {alert.team} 팀: {alert.desc}
              </p>
              <div className="flex gap-4">
                <ClimaButton variant="secondary" className="text-sm py-4 px-10">개입하기</ClimaButton>
                <ClimaButton variant="tertiary" className="text-sm py-4 px-10">무시하기</ClimaButton>
              </div>
              </motion.div>
            </SanctuaryCard>
          ))}
        </div>
      </motion.div>
      </div>
    </div>
  );
}

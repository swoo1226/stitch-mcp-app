"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { ClimaButton } from "../components/ui";
import { ClimaWave } from "../components/WetherWave";
import DynamicBackground from "../components/DynamicBackground";

export default function StatisticsPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center overflow-x-hidden">
      <DynamicBackground score={82} />
      <div className="px-4 md:px-8 pt-12 md:pt-16 pb-24 w-full max-w-lg mx-auto relative z-10">
      <header className="flex justify-between items-center mb-16">
        <Link href="/"><ClimaLogo /></Link>
        <ClimaButton variant="icon" href="/">✕</ClimaButton>
      </header>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 mb-4 text-primary">Team Analytics</p>
        <h1 className="headline-sanctuary mb-16 underline-offset-8 decoration-primary/20">Team Climate Analysis.</h1>

        <section className="mb-20">
            <div className="flex justify-between items-end mb-8 px-2">
                <h2 className="text-xl font-extrabold font-[Plus Jakarta Sans]">Clima Wave Summary</h2>
                <span className="text-sm font-bold text-primary/60">▲ 12% Improved</span>
            </div>
            <ClimaWave score={82} />
            <div className="flex justify-between mt-6 px-4 text-[10px] font-extrabold tracking-widest uppercase opacity-30">
                <span>Last Week Data</span>
                <span>Real-time Sync</span>
            </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-8">
            <div className="bg-surface-high p-10 rounded-[3.5rem] shadow-ambient">
                <h3 className="text-[10px] font-black tracking-widest opacity-40 uppercase mb-6 text-secondary">Mood Humidity</h3>
                <div className="text-5xl font-black font-[Plus Jakarta Sans] mb-4">18%</div>
                <p className="text-sm opacity-60 leading-relaxed font-medium">Very dry and focused. Ideal for deep work sprints and architectural discussions.</p>
            </div>

            <div className="card-sanctuary p-10">
                <h3 className="text-[10px] font-black tracking-widest opacity-40 uppercase mb-6 text-primary">Atmosphere Pressure</h3>
                <div className="text-5xl font-black font-[Plus Jakarta Sans] mb-4">42 <span className="text-xl font-bold opacity-30">km/h</span></div>
                <p className="text-sm opacity-60 leading-relaxed font-medium">Sprint velocity is high. High productive pressure detected across all squads.</p>
            </div>
        </section>

        <footer className="mt-20 text-center italic opacity-30 text-xs font-medium tracking-wide">
            "We grow together, in any climate. Designed for psychological safety."
        </footer>
      </motion.div>
      </div>
    </div>
  );
}

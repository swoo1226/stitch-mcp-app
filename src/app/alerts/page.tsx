"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ClimaLogo from "../components/WetherLogo";
import { ClimaButton } from "../components/ui";
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
    { id: 1, title: "Storm Warning", team: "Marketing", desc: "Burnout risk detected due to high weekend activity.", level: "High" },
    { id: 2, title: "Foggy Outlook", team: "Backend", desc: "Communication bridge seems disconnected.", level: "Medium" },
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
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 mb-4 text-tertiary">Risk Center</p>
        <h1 className="headline-sanctuary mb-12">Find out how <br /> the team is doing.</h1>

        <div className="grid gap-8">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              whileHover={{ y: -5 }}
              className={`card-sanctuary overflow-hidden ${alert.level === 'High' ? 'bg-error-container/30' : 'bg-surface-container'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase ${alert.level === 'High' ? 'bg-error text-white' : 'bg-surface-highest text-secondary'}`}>
                    {alert.level} RISK
                  </span>
                  <h2 className="text-2xl font-extrabold font-[Plus Jakarta Sans] mt-6">{alert.title}</h2>
                </div>
                <span className="text-5xl opacity-80">{alert.level === 'High' ? '⛈️' : '🌫️'}</span>
              </div>
              <p className="text-sm font-medium opacity-60 leading-relaxed mb-10 max-w-md">
                {alert.team} Team: {alert.desc}
              </p>
              <div className="flex gap-4">
                <ClimaButton variant="secondary" className="text-sm py-4 px-10">Intervene</ClimaButton>
                <ClimaButton variant="tertiary" className="text-sm py-4 px-10">Dismiss</ClimaButton>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      </div>
    </div>
  );
}

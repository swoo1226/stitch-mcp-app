'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Transition } from 'framer-motion';

const springConfig: Transition = { type: "spring", stiffness: 180, damping: 20 };

export default function VibrantAtriumSample() {
  return (
    <div className="min-h-screen bg-[#ebfaec] text-[#253228] p-8 md:p-16 overflow-hidden font-['Public_Sans','Pretendard',sans-serif]">
      {/* Glassmorphism Navigation */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springConfig}
        className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] md:w-[70%] max-w-4xl bg-white/70 backdrop-blur-xl rounded-full px-8 py-4 flex justify-between items-center shadow-[0_20px_40px_rgba(37,50,40,0.06)] z-50"
      >
        <div className="text-xl font-bold tracking-tight text-[#006668]">Atrium</div>
        <nav className="hidden md:flex gap-8 text-sm font-semibold tracking-wide text-[#515f54]">
          <span className="hover:text-[#00CED1] cursor-pointer transition-colors">Overview</span>
          <span className="hover:text-[#00CED1] cursor-pointer transition-colors">Team Pulses</span>
          <span className="hover:text-[#00CED1] cursor-pointer transition-colors">Settings</span>
        </nav>
        <button className="bg-gradient-to-br from-[#006668] to-[#52f2f5] text-[#051109] px-6 py-2 rounded-full text-sm font-semibold shadow-[0_8px_16px_rgba(82,242,245,0.3)] hover:shadow-[0_12px_24px_rgba(82,242,245,0.4)] hover:-translate-y-0.5 transition-all">
          Connect
        </button>
      </motion.header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto pt-32 pb-20">
        <div className="flex flex-col md:flex-row gap-16 items-center">

          {/* Text Content - Intentional Asymmetry */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...springConfig, delay: 0.1 }}
            className="flex-1 space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05]">
              The Chromatic<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#006668] to-[#00CED1]">
                Conservatory
              </span>
            </h1>
            <p className="text-lg md:text-xl text-[#515f54] max-w-lg leading-relaxed font-light">
              Where light and color harmonize to create a digital sanctuary. We move past rigid grids into a breathing, empathetic environment.
            </p>
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-[#006668] to-[#52f2f5] text-[#051109] px-8 py-4 rounded-full font-semibold shadow-[0_12px_24px_rgba(82,242,245,0.3)] transition-shadow"
              >
                Explore Sanctuary
              </motion.button>
              <motion.button
                whileHover={{ backgroundColor: '#c4dac6' }}
                className="bg-[#cde2cf] text-[#0058ba] px-8 py-4 rounded-full font-semibold transition-colors"
              >
                View Metrics
              </motion.button>
            </div>
          </motion.div>

          {/* Glassmorphism Widget Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springConfig, delay: 0.2 }}
            className="flex-1 w-full relative h-[450px]"
          >
            {/* Soft Background Blobs for Chromatic Glow */}
            <div className="absolute top-10 right-10 w-72 h-72 bg-[#FF7F50]/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#00CED1]/30 rounded-full blur-3xl" style={{ animationDelay: '1s' }} />

            {/* Card Body - No 1px Borders, Tonal Tiers */}
            <div className="absolute inset-4 md:inset-0 bg-white/50 backdrop-blur-2xl rounded-[3rem] p-8 shadow-[0_40px_80px_rgba(37,50,40,0.06)] flex flex-col justify-between">
               <div className="flex justify-between items-start">
                 <div>
                   <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#515f54] mb-3">Team Climate</div>
                   <div className="text-4xl font-extrabold text-[#006668]">Blooming</div>
                 </div>
                 <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF7F50] to-[#ff946e] shadow-lg shadow-[#FF7F50]/40 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">☀️</span>
                 </div>
               </div>

               <div className="space-y-4">
                 {/* Mid Layer Container */}
                 <div className="bg-[#e4f5e5] p-5 rounded-3xl">
                   <div className="flex justify-between text-sm mb-3 font-semibold">
                     <span>Focus Potential</span>
                     <span className="text-[#0058ba]">85%</span>
                   </div>
                   <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
                     <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: '85%' }}
                       transition={{ duration: 1.5, delay: 0.5, type: 'spring' }}
                       className="h-full bg-gradient-to-r from-[#006668] to-[#00CED1]"
                     />
                   </div>
                 </div>

                 <div className="bg-[#e4f5e5] p-4 rounded-3xl flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-[#bed2ff] flex items-center justify-center text-[#0058ba] font-bold shadow-inner">
                     4
                   </div>
                   <div className="text-sm font-semibold text-[#253228] leading-tight">
                     Active curators currently <br/> in the sanctuary
                   </div>
                 </div>
               </div>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

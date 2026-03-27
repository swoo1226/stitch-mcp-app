"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function AtmosphericEffects({ score = 85, children }) {
  const [effect, setEffect] = useState("sunny");

  useEffect(() => {
    if (score >= 81) setEffect("sunny");
    else if (score >= 61) setEffect("cloudy");
    else if (score >= 41) setEffect("foggy");
    else if (score >= 21) setEffect("rainy");
    else setEffect("stormy");
  }, [score]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      <AnimatePresence mode="wait">
        {/* Sunny: Bloom Effect */}
        {effect === "sunny" && (
          <motion.div 
            key="sunny"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 blur-[100px]"
          />
        )}

        {/* Foggy: Backdrop Blur & Contrast */}
        {effect === "foggy" && (
          <motion.div 
            key="foggy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 backdrop-blur-[30px] bg-slate-200/10"
          />
        )}

        {/* Rainy: Falling Particles */}
        {effect === "rainy" && (
          <motion.div 
            key="rainy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * 100 + "%", opacity: 0 }}
                animate={{ 
                  y: "110vh", 
                  opacity: [0, 0.4, 0] 
                }}
                transition={{ 
                  duration: 0.8 + Math.random() * 0.5, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 2
                }}
                className="absolute w-0.5 h-10 bg-white/30 rounded-full"
              />
            ))}
          </motion.div>
        )}

        {/* Stormy: Jitter & Flash */}
        {effect === "stormy" && (
          <motion.div 
            key="stormy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-slate-900/10" />
            
            {/* Lightning Flash */}
            <motion.div 
              animate={{ opacity: [0, 0, 1, 0, 0, 0.5, 0] }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                times: [0, 0.8, 0.81, 0.85, 0.9, 0.91, 1] 
              }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jitter (Stormy) or Floating (Cloudy) wrapper for children if needed */}
      {/* But since children are outside this absolute container, we should export these as variants or HOC */}
    </div>
  );
}

// Named exports for specific animations
export const atmosphereVariants = {
    cloudy: {
        y: [0, -10, 0],
        transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
        }
    },
    stormy: {
        x: [0, -1, 1, -1, 0],
        transition: {
            duration: 0.1,
            repeat: Infinity
        }
    },
    default: {
        y: 0,
        x: 0
    }
};

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AtmosphericEffects from "./AtmosphericEffects";

export default function DynamicBackground({ score = 85 }) {
  const [bgColor, setBgColor] = useState("#f0fcfb");

  useEffect(() => {
    // Atmospheric Sanctuary botanical transitions as per spec
    if (score >= 81) setBgColor("#f0fcfb"); // Radiant/Sunny
    else if (score >= 61) setBgColor("#eaf6f5"); // Cloudy
    else if (score >= 41) setBgColor("#dfebea"); // Foggy
    else if (score >= 21) setBgColor("#dae3f3"); // Rainy (slightly deeper blue)
    else setBgColor("#f9e8e8"); // Stormy (warm alarm tint)
  }, [score]);

  return (
    <motion.div 
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[-1]"
    >
      <AtmosphericEffects score={score} />
      
      {/* Organic Blobs for botanical texture */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 45, 0],
          x: [0, 30, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full bg-[#2b6867]/5 blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, -30, 0],
          x: [0, -40, 0],
          y: [0, 40, 0]
        }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-20%] right-[-15%] w-[90%] h-[90%] rounded-full bg-[#4e6636]/5 blur-[150px]"
      />
    </motion.div>
  );
}

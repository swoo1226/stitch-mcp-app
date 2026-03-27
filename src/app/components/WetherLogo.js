"use client";

import { motion } from "framer-motion";

export default function ClimaLogo() {
  return (
    <div className="logo-text text-2xl select-none whitespace-nowrap">
      Cli<motion.span
        animate={{ opacity: [0.5, 0.2, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >ma</motion.span>
    </div>
  );
}

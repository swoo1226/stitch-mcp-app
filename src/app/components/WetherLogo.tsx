"use client";

import { motion } from "framer-motion";
import { useMotionPreferences } from "./useMotionPreferences";

export default function ClimaLogo() {
  const { shouldLimitMotion } = useMotionPreferences();

  return (
    <div className="logo-text text-2xl select-none whitespace-nowrap">
      Cli<motion.span
        animate={shouldLimitMotion ? undefined : { opacity: [0.5, 0.2, 0.5] }}
        transition={shouldLimitMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={shouldLimitMotion ? { opacity: 0.4 } : undefined}
      >ma</motion.span>
    </div>
  );
}

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { STANDARD_SPRING } from "../../constants/springs";

export default function FadeIn({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...STANDARD_SPRING, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

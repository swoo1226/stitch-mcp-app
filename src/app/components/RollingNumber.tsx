"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useMotionPreferences } from "./useMotionPreferences";

interface RollingNumberProps {
  value: number;
  className?: string;
}

export default function RollingNumber({ value, className }: RollingNumberProps) {
  const { shouldLimitMotion } = useMotionPreferences();
  const springValue = useSpring(0, { stiffness: 100, damping: 30 });
  const displayValue = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (!shouldLimitMotion) {
      springValue.set(value);
    }
  }, [value, springValue, shouldLimitMotion]);

  if (shouldLimitMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}

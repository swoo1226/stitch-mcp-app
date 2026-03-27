"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface MotionPreferences {
  prefersReducedMotion: boolean | null;
  isMobileLike: boolean;
  shouldLimitMotion: boolean;
}

export function useMotionPreferences(): MotionPreferences {
  const prefersReducedMotion = useReducedMotion();
  const [isMobileLike, setIsMobileLike] = useState(true);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; addEventListener?: (type: string, fn: () => void) => void; removeEventListener?: (type: string, fn: () => void) => void } }).connection;

    const update = () => {
      setIsMobileLike(mediaQuery.matches);
      setSaveData(Boolean(connection?.saveData));
    };

    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
    } else {
      (mediaQuery as unknown as { addListener: (fn: () => void) => void }).addListener(update);
    }

    connection?.addEventListener?.("change", update);

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", update);
      } else {
        (mediaQuery as unknown as { removeListener: (fn: () => void) => void }).removeListener(update);
      }

      connection?.removeEventListener?.("change", update);
    };
  }, []);

  return {
    prefersReducedMotion,
    isMobileLike,
    shouldLimitMotion: Boolean(prefersReducedMotion) || isMobileLike || saveData,
  };
}

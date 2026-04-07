"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdateToast() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then((reg) => {
      // 이미 대기 중인 SW 있으면 즉시 표시
      if (reg.waiting) {
        setWaiting(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(newSW);
          }
        });
      });
    });

    // SW 교체 후 페이지 새로고침
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  function applyUpdate() {
    if (!waiting) return;
    waiting.postMessage("SKIP_WAITING");
    setWaiting(null);
  }

  return (
    <AnimatePresence>
      {waiting && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2"
        >
          <div
            className="flex items-center gap-3 rounded-full px-5 py-3 shadow-xl"
            style={{ background: "var(--surface-highest)", boxShadow: "var(--glass-shadow)" }}
          >
            <span className="text-sm font-bold" style={{ color: "var(--on-surface)" }}>
              새 버전이 있어요
            </span>
            <button
              onClick={applyUpdate}
              className="rounded-full px-4 py-1.5 text-sm font-black transition-opacity hover:opacity-80"
              style={{ background: "var(--button-primary-gradient)", color: "var(--on-primary)" }}
            >
              업데이트
            </button>
            <button
              onClick={() => setWaiting(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
              style={{ color: "var(--text-soft)" }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

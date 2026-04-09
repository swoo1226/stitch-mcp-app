"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DynamicBackground from "../components/DynamicBackground";
import { motion } from "framer-motion";
import { STANDARD_SPRING } from "../constants/springs";

export default function SettingsPageClient() {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0";
  const buildNumber = process.env.NEXT_PUBLIC_BUILD_NUMBER ?? "0";
  const buildHash = process.env.NEXT_PUBLIC_BUILD_HASH ?? "—";
  
  type UpdateState = "idle" | "checking" | "available" | "latest" | "updating";
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
        setUpdateState("available");
      }
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingSW(newSW);
            setUpdateState("available");
          }
        });
      });
    });
  }, []);

  async function checkForUpdate() {
    if (!("serviceWorker" in navigator)) return;
    setUpdateState("checking");
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.update();
      setTimeout(() => {
        setUpdateState((prev) => prev === "checking" ? "latest" : prev);
      }, 2000);
    } catch {
      setUpdateState("idle");
    }
  }

  function applyUpdate() {
    if (!waitingSW) return;
    setUpdateState("updating");
    waitingSW.postMessage("SKIP_WAITING");
    // sw.js handles the reload on controllerchange
  }

  return (
    <div className="relative min-h-screen" style={{ background: "var(--hero-gradient)" }}>
      <DynamicBackground score={55} />
      
      <div className="relative z-10 pt-20 px-5 pb-12 md:px-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={STANDARD_SPRING}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em]" style={{ color: "var(--primary)" }}>Settings</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>설정</h1>
            </div>
            <Link
              href="/personal"
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
            >
              닫기
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {/* 메뉴 섹션 */}
            <section 
              className="rounded-[2rem] overflow-hidden" 
              style={{ background: "var(--surface-highest)", boxShadow: "var(--glass-shadow)" }}
            >
              <Link
                href="/settings/notifications"
                className="flex items-center justify-between p-6 transition-colors hover:bg-surface-low active:bg-surface-high"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-low text-primary">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 4.5a4 4 0 0 0-4 4v2.3c0 .7-.2 1.3-.6 1.8L6 14.5h12l-1.4-1.9a3 3 0 0 1-.6-1.8V8.5a4 4 0 0 0-4-4Z" />
                      <path d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight" style={{ color: "var(--on-surface)" }}>알림 설정</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>푸시 알림 권한 및 받기 항목 설정</p>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-40" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </section>

            {/* 정보 섹션 */}
            <section
              className="rounded-[2rem] p-6"
              style={{ background: "var(--surface-highest)", boxShadow: "var(--glass-shadow)" }}
            >
              <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--on-surface)" }}>앱 정보</h2>
              
              <div className="mt-5 rounded-[1.5rem] p-4 flex flex-col gap-3" style={{ background: "var(--surface-overlay)" }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-soft)" }}>버전</span>
                  <span className="font-black tabular-nums" style={{ color: "var(--on-surface)" }}>
                    v{appVersion}-build.{buildNumber} <span className="font-normal text-xs" style={{ color: "var(--text-muted)" }}>({buildHash})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-soft)" }}>상태</span>
                  <span className="font-bold" style={{
                    color: updateState === "available" ? "var(--tertiary)"
                      : updateState === "latest" ? "var(--primary)"
                      : "var(--text-muted)"
                  }}>
                    {updateState === "idle" && "최신 확인 필요"}
                    {updateState === "checking" && "확인 중…"}
                    {updateState === "available" && "새 버전 있음"}
                    {updateState === "latest" && "최신 버전 이용 중 ✓"}
                    {updateState === "updating" && "업데이트 적용 중…"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                {updateState === "available" ? (
                  <button
                    onClick={applyUpdate}
                    className="flex-1 rounded-full px-5 py-3 text-sm font-black transition-opacity"
                    style={{ background: "var(--primary)", color: "#04141a" }}
                  >
                    지금 설치하고 다시 시작
                  </button>
                ) : (
                  <button
                    onClick={checkForUpdate}
                    disabled={updateState === "checking" || updateState === "updating"}
                    className="flex-1 rounded-full px-5 py-3 text-sm font-bold transition-opacity disabled:opacity-50"
                    style={{ background: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" }}
                  >
                    {updateState === "checking" ? "확인 중…" : "업데이트 확인"}
                  </button>
                )}
              </div>
              
              <p className="mt-4 text-[10px] text-center font-bold tracking-widest uppercase opacity-30" style={{ color: "var(--on-surface)" }}>
                Stitch &middot; Clima Digital Atrium &middot; Horizon-01
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

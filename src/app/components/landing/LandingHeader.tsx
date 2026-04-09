"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ClimaLogo from "../WetherLogo";
import ThemeToggleButton from "../ThemeToggleButton";
import { NAV_ITEMS } from "../../constants/landing";
import { STANDARD_SPRING } from "../../constants/springs";

interface LandingHeaderProps {
  isAdmin: boolean;
  userSession: any;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

export default function LandingHeader({
  isAdmin,
  userSession,
  mobileNavOpen,
  setMobileNavOpen,
}: LandingHeaderProps) {
  return (
    <>
      <header
        className="fixed top-0 left-0 w-full z-50 flex items-center justify-between h-16 px-6 md:px-10"
        style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center">
            <ClimaLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3 py-1 text-sm font-semibold tracking-tight transition-colors rounded-full hover:bg-surface-low"
                style={{ color: "var(--text-muted)" }}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1 text-sm font-semibold tracking-tight transition-colors rounded-full hover:bg-surface-low"
                style={{ color: "var(--text-muted)" }}
              >
                어드민
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggleButton />
          {userSession ? (
            <Link
              href="/input"
              className="hidden md:inline-flex items-center h-9 px-5 rounded-full text-sm font-bold transition-all hover:opacity-80"
              style={{
                background: "var(--button-primary-gradient)",
                color: "var(--on-primary)",
                boxShadow: "var(--button-primary-shadow)",
              }}
            >
              오늘 체크인하기
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden md:inline-flex items-center h-9 px-5 rounded-full text-sm font-bold transition-all hover:bg-surface-low"
              style={{
                background: "var(--surface-overlay)",
                color: "var(--primary)",
                boxShadow: "var(--button-subtle-shadow)",
              }}
            >
              로그인
            </Link>
          )}
          <button
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
            onClick={() => setMobileNavOpen(true)}
            style={{ color: "var(--header-action-color)" }}
            aria-label="메뉴 열기"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: "var(--drawer-scrim)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={STANDARD_SPRING}
              className="fixed right-0 top-0 h-full w-72 z-[70] flex flex-col"
              style={{ background: "var(--drawer-bg)", backdropFilter: "var(--glass-blur)" }}
            >
              <div className="flex items-center justify-between px-6 h-16 shrink-0">
                <ClimaLogo />
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-low transition-colors"
                  style={{ color: "var(--text-soft)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 flex flex-col px-4 py-4 gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="px-5 py-4 rounded-[1.5rem] text-base font-semibold tracking-tight transition-colors hover:bg-surface-low"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileNavOpen(false)}
                    className="px-5 py-4 rounded-[1.5rem] text-base font-semibold tracking-tight transition-colors hover:bg-surface-low"
                    style={{ color: "var(--text-muted)" }}
                  >
                    어드민
                  </Link>
                )}
                <div className="mt-4 px-2">
                  {userSession ? (
                    <Link
                      href="/input"
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-center h-14 rounded-[1.5rem] text-base font-bold"
                      style={{ background: "var(--button-primary-gradient)", color: "var(--on-primary)" }}
                    >
                      오늘 체크인하기
                    </Link>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileNavOpen(false)}
                      className="flex items-center justify-center h-14 rounded-[1.5rem] text-base font-bold"
                      style={{ background: "var(--button-primary-gradient)", color: "var(--on-primary)" }}
                    >
                      로그인
                    </Link>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

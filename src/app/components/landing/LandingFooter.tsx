"use client";

import Link from "next/link";
import ClimaLogo from "../WetherLogo";
import { NAV_ITEMS } from "../../constants/landing";

export default function LandingFooter() {
  return (
    <footer className="px-6 md:px-10 xl:px-16 py-10" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <ClimaLogo />
        <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs font-medium" style={{ color: "var(--text-soft)" }}>
          © 2026 Clima
        </p>
      </div>
    </footer>
  );
}

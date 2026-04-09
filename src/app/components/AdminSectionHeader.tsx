"use client";

import Link from "next/link";
import ThemeToggleButton from "./ThemeToggleButton";
import NotificationBell from "./NotificationBell";
import ClimaLogo from "./WetherLogo";

type AdminSectionHeaderProps = {
  current: "admin" | "combined-risk" | "access-requests";
  role: "super_admin" | "team_admin";
  activeAdminTab?: "members" | "teams";
  showLogout?: boolean;
  onLogout?: () => void;
};

function navStyle(active: boolean) {
  return active
    ? { color: "var(--primary)", background: "color-mix(in srgb, var(--primary) 12%, transparent)" }
    : { color: "var(--text-soft)" };
}

export default function AdminSectionHeader({ current, role, activeAdminTab, showLogout = false, onLogout }: AdminSectionHeaderProps) {
  const isSuperAdmin = role === "super_admin";
  const isAdminPage = current === "admin";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-5 md:px-8"
      style={{ background: "var(--header-bg)", backdropFilter: "var(--glass-blur)", boxShadow: "var(--header-shadow)" }}
    >
      <div className="flex items-center gap-4 md:gap-8">
        <Link href="/" className="flex shrink-0 items-center">
          <ClimaLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          <Link href="/admin/members" className="rounded-full px-4 py-2 text-sm font-bold tracking-tight transition-colors" style={navStyle(isAdminPage && activeAdminTab !== "teams")}>
            팀원 관리
          </Link>
          {isSuperAdmin && (
            <Link href="/admin/teams" className="rounded-full px-4 py-2 text-sm font-bold tracking-tight transition-colors" style={navStyle(isAdminPage && activeAdminTab === "teams")}>
              팀 · 파트
            </Link>
          )}
          <Link href="/admin/combined-risk" className="rounded-full px-4 py-2 text-sm font-bold tracking-tight transition-colors" style={navStyle(current === "combined-risk")}>
            주의 팀원
          </Link>
          {isSuperAdmin && (
            <Link href="/admin/access-requests" className="rounded-full px-4 py-2 text-sm font-bold tracking-tight transition-colors" style={navStyle(current === "access-requests")}>
              도입 요청
            </Link>
          )}
          <Link href="/settings/notifications" className="rounded-full px-4 py-2 text-sm font-bold tracking-tight transition-colors" style={navStyle(false)}>
            알림 설정
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-2" style={{ color: "var(--header-action-color)" }}>
        <ThemeToggleButton />
        <NotificationBell />
        <Link
          href="/admin/members"
          className="hidden md:flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-low"
          title="어드민 홈"
          aria-label="어드민 홈"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>
        {showLogout && onLogout ? (
          <button
            onClick={onLogout}
            className="hidden md:flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold transition-colors hover:bg-surface-low"
            style={{ color: "var(--error)" }}
          >
            로그아웃
          </button>
        ) : null}
      </div>
    </header>
  );
}

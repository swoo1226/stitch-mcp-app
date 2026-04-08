"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminBottomNavProps {
  activeTab?: "members" | "teams";
  onTabChange?: (tab: "members" | "teams") => void;
  isSuperAdmin: boolean;
}

export default function AdminBottomNav({
  activeTab,
  onTabChange,
  isSuperAdmin,
}: AdminBottomNavProps) {
  const pathname = usePathname();

  const isMainAdmin = pathname === "/admin";
  const isCombinedRisk = pathname === "/admin/combined-risk";
  const isAccessRequests = pathname === "/admin/access-requests";

  const getStyle = (active: boolean) => ({
    color: active ? "var(--primary)" : "var(--text-soft)",
  });

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 grid h-[72px] items-stretch border-t border-white/5"
      style={{
        background: "var(--header-bg)",
        backdropFilter: "var(--glass-blur)",
        boxShadow: "0 -1px 0 color-mix(in srgb, var(--on-surface) 8%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom)",
        gridTemplateColumns: isSuperAdmin ? "repeat(4, 1fr)" : "repeat(2, 1fr)",
      }}
    >
      {/* 팀원 */}
      <button
        onClick={() => {
          if (isMainAdmin && onTabChange) {
            onTabChange("members");
          } else {
            window.location.href = "/admin?tab=members";
          }
        }}
        className="flex flex-col items-center justify-center gap-1 py-3 transition-colors"
        style={getStyle(isMainAdmin && activeTab === "members")}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-black">팀원</span>
      </button>

      {/* 팀·파트 */}
      {isSuperAdmin && (
        <button
          onClick={() => {
            if (isMainAdmin && onTabChange) {
              onTabChange("teams");
            } else {
              window.location.href = "/admin?tab=teams";
            }
          }}
          className="flex flex-col items-center justify-center gap-1 py-3 transition-colors"
          style={getStyle(isMainAdmin && activeTab === "teams")}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" strokeLinecap="round" />
          </svg>
          <span className="text-[10px] font-black">팀·파트</span>
        </button>
      )}

      {/* 주의 팀원 */}
      <Link
        href="/admin/combined-risk"
        className="flex flex-col items-center justify-center gap-1 py-3 transition-colors"
        style={getStyle(isCombinedRisk)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3 2 21h20L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-black">주의 팀원</span>
      </Link>

      {/* 도입 요청 */}
      {isSuperAdmin && (
        <Link
          href="/admin/access-requests"
          className="flex flex-col items-center justify-center gap-1 py-3 transition-colors"
          style={getStyle(isAccessRequests)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" />
            <polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
          </svg>
          <span className="text-[10px] font-black">도입 요청</span>
        </Link>
      )}
    </div>
  );
}

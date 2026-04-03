"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export interface HeaderNavItem {
  label: string;
  href: string;
  matchPaths?: string[];
  matchMode?: "exact" | "prefix";
  disabled?: boolean;
}

interface HeaderNavProps {
  items: HeaderNavItem[];
  mobile?: boolean;
  onNavigate?: () => void;
}

function isActivePath(pathname: string, item: HeaderNavItem) {
  const targets = item.matchPaths?.length ? item.matchPaths : [item.href];

  return targets.some((target) => {
    if (item.matchMode === "prefix") {
      return pathname === target || pathname.startsWith(`${target}/`);
    }

    return pathname === target;
  });
}

function withTeamParam(href: string, teamId: string | null): string {
  if (!teamId) return href;
  if (href === "/personal" || href.startsWith("/personal?")) return href;
  const [path, existing] = href.split("?");
  const params = new URLSearchParams(existing ?? "");
  params.set("team", teamId);
  return `${path}?${params.toString()}`;
}

export default function HeaderNav({ items, mobile = false, onNavigate }: HeaderNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("team");

  return (
    <>
      {items.map((item) => {
        if (item.disabled) {
          return (
            <span
              key={item.label}
              className={
                mobile
                  ? "rounded-[1.5rem] px-5 py-4 text-base font-semibold tracking-tight flex items-center gap-2 cursor-default opacity-40"
                  : "rounded-full px-3 py-2 text-sm font-semibold tracking-tight flex items-center gap-1.5 cursor-default opacity-40"
              }
              style={{ color: "var(--text-muted)" }}
            >
              {item.label}
              <span
                className="rounded-full text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 leading-none"
                style={{
                  background: "color-mix(in srgb, var(--primary) 18%, transparent)",
                  color: "var(--primary)",
                  opacity: 1,
                }}
              >
                SOON
              </span>
            </span>
          );
        }

        const active = isActivePath(pathname, item);
        const resolvedHref = withTeamParam(item.href, teamId);

        return (
          <Link
            key={item.label}
            href={resolvedHref}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              mobile
                ? "rounded-[1.5rem] px-5 py-4 text-base font-semibold tracking-tight transition-all duration-200"
                : "rounded-full px-3 py-2 text-sm font-semibold tracking-tight transition-all duration-200"
            }
            style={
              mobile
                ? active
                  ? {
                      color: "var(--primary)",
                      background: "color-mix(in srgb, var(--primary) 16%, transparent)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 18%, transparent)",
                    }
                  : { color: "var(--text-muted)" }
                : active
                  ? {
                      color: "var(--primary)",
                      background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                      boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 16%, transparent)",
                    }
                  : { color: "var(--text-muted)" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

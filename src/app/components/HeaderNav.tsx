"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface HeaderNavItem {
  label: string;
  href: string;
  matchPaths?: string[];
  matchMode?: "exact" | "prefix";
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

export default function HeaderNav({ items, mobile = false, onNavigate }: HeaderNavProps) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const active = isActivePath(pathname, item);

        return (
          <Link
            key={item.label}
            href={item.href}
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

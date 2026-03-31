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
                      background: "linear-gradient(135deg, rgba(0,102,104,0.14), rgba(26,157,159,0.08))",
                      boxShadow: "inset 0 0 0 1px rgba(0,102,104,0.08)",
                    }
                  : { color: "rgba(37,50,40,0.8)" }
                : active
                  ? {
                      color: "var(--primary)",
                      background: "linear-gradient(135deg, rgba(0,102,104,0.12), rgba(26,157,159,0.05))",
                      boxShadow: "inset 0 0 0 1px rgba(0,102,104,0.08)",
                    }
                  : { color: "rgba(37,50,40,0.58)" }
            }
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

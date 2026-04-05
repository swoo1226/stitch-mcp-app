// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getUserSession, type UserRole } from "../../lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  /** 접근 가능한 역할. 생략 시 로그인만 확인 */
  requiredRole?: UserRole | UserRole[];
  /** 권한 없을 때 redirect 경로 (기본: /login) */
  fallback?: string;
}

export default function AuthGuard({
  children,
  requiredRole,
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const session = await getUserSession();

      if (!mounted) return;

      if (!session) {
        const query = searchParams.toString();
        const current = query ? `${pathname}?${query}` : pathname;
        router.replace(`/login?redirect=${encodeURIComponent(current)}`);
        return;
      }

      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(session.role)) {
          const target = fallback ?? (session.role === "member" ? "/personal" : "/dashboard");
          router.replace(target);
          return;
        }
      }

      setChecked(true);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [pathname, router, searchParams, requiredRole, fallback]);

  if (!checked) return null;

  return <>{children}</>;
}

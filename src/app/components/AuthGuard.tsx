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

  // SSR 단계이거나 아직 권한 확인 중일 때: 
  // null을 반환하면 SSR이 완전히 블로킹되므로 사용자의 요청대로
  // '기본 틀은 SSR로 제공하고 하이드레이션' 하기 위해 children을 그대로 반환합니다.
  // 서버 미들웨어에서 최소한의 로그인 검사가 완료된 상태이며, RLS로 보안이 유지됩니다.
  // 시각적인 깜박임을 줄이고 상호작용만 잠시 막습니다.
  if (!checked) {
    return (
      <div className="animate-pulse pointer-events-none origin-top transition-opacity duration-300" style={{ opacity: 0.8 }}>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}

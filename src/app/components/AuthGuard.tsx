// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        const query = searchParams.toString();
        const current = query ? `${pathname}?${query}` : pathname;
        router.replace(`/login?redirect=${encodeURIComponent(current)}`);
        return;
      }

      setChecked(true);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [pathname, router, searchParams]);

  if (!checked) return null;

  return <>{children}</>;
}
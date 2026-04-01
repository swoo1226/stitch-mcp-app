"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const current = searchParams.toString()
          ? `${pathname}?${searchParams.toString()}`
          : pathname;
        router.replace(`/login?redirect=${encodeURIComponent(current)}`);
      } else {
        setChecked(true);
      }
    });
  }, [pathname, router, searchParams]);

  if (!checked) return null;

  return <>{children}</>;
}

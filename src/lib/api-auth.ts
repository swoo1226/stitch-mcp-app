import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { UserRole } from "./auth";

export interface ApiSession {
  authUserId: string;
  role: UserRole;
  managedTeamId: string | null;
  linkedUserId: string | null;
}

/**
 * API 라우트에서 역할 기반 인증을 수행한다.
 * 쿠키 기반 세션으로 사용자를 확인한 후 user_roles에서 역할을 조회.
 * Authorization: Bearer <token> 헤더가 있으면 그것도 지원 (cron 등).
 */
export async function requireRole(
  req: NextRequest,
  ...allowedRoles: UserRole[]
): Promise<ApiSession | NextResponse> {
  // 쿠키 기반 서버 클라이언트 생성
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
        },
      },
    }
  );

  // 1차: 쿠키 세션
  let user = (await supabase.auth.getUser()).data.user;

  // 2차: Authorization 헤더 (Bearer token) fallback
  if (!user) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      // service_role로 토큰 직접 검증
      const { createSupabaseAdminClient } = await import("./supabase-admin");
      const admin = createSupabaseAdminClient();
      const result = await admin.auth.getUser(token);
      user = result.data.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // user_roles 조회 (service_role로 — RLS 우회)
  const { createSupabaseAdminClient } = await import("./supabase-admin");
  const admin = createSupabaseAdminClient();
  const { data: roleData } = await admin
    .from("user_roles")
    .select("role, managed_team_id, linked_user_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!roleData) {
    return NextResponse.json({ error: "No role assigned" }, { status: 403 });
  }

  const role = roleData.role as UserRole;

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    authUserId: user.id,
    role,
    managedTeamId: roleData.managed_team_id ?? null,
    linkedUserId: roleData.linked_user_id ?? null,
  };
}

import { supabase } from "./supabase";

export type AdminRole = "super_admin" | "team_admin";

export interface AdminSession {
  role: AdminRole;
  managedTeamId: string | null; // super_admin은 null
  email: string;
}

/**
 * 현재 로그인된 Supabase 세션을 기반으로 admin_users 테이블에서 역할을 조회한다.
 * 세션이 없거나 admin_users에 등록되지 않은 경우 null 반환.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("role, managed_team_id, email")
    .eq("auth_user_id", session.user.id)
    .single();

  if (!data) return null;

  return {
    role: data.role as AdminRole,
    managedTeamId: data.managed_team_id ?? null,
    email: data.email,
  };
}

export function isSuperAdmin(session: AdminSession | null): boolean {
  return session?.role === "super_admin";
}

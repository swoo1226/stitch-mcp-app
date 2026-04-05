import { supabase } from "./supabase";

export type UserRole = "super_admin" | "team_admin" | "member";

export interface UserSession {
  authUserId: string;
  email: string;
  role: UserRole;
  managedTeamId: string | null; // team_admin일 때만 값 있음
  linkedUserId: string | null;  // users 테이블 PK (member/겸임 팀장)
}

/**
 * 현재 Supabase 세션에서 역할을 포함한 사용자 정보를 반환한다.
 * user_roles 테이블(구 admin_users)에서 역할을 조회.
 * 세션이 없거나 user_roles에 등록되지 않은 경우 null 반환.
 */
export async function getUserSession(): Promise<UserSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role, managed_team_id, email, linked_user_id")
    .eq("auth_user_id", session.user.id)
    .single();

  if (!data) return null;

  return {
    authUserId: session.user.id,
    email: data.email,
    role: data.role as UserRole,
    managedTeamId: data.managed_team_id ?? null,
    linkedUserId: data.linked_user_id ?? null,
  };
}

export function isAdmin(session: UserSession | null): boolean {
  return session?.role === "super_admin" || session?.role === "team_admin";
}

export function isSuperAdmin(session: UserSession | null): boolean {
  return session?.role === "super_admin";
}

export function isTeamAdmin(session: UserSession | null): boolean {
  return session?.role === "team_admin";
}

export function isMember(session: UserSession | null): boolean {
  return session?.role === "member";
}

// ─── 하위 호환: AdminSession alias ─────────────────────────────────────────
// 기존 getAdminSession() 호출부를 점진적으로 교체하기 위한 alias
export type AdminSession = UserSession;
export type AdminRole = "super_admin" | "team_admin";

/** @deprecated getUserSession()을 사용하세요 */
export async function getAdminSession(): Promise<UserSession | null> {
  const session = await getUserSession();
  // admin_users 기존 동작 유지: member는 null 반환
  if (!session || session.role === "member") return null;
  return session;
}

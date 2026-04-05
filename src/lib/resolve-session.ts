import { createSupabaseServerClient } from "./supabase-server";
import type { UserRole, UserSession } from "./auth";
import { DEFAULT_TEAM_ID } from "./supabase";

/**
 * 서버 컴포넌트에서 현재 세션의 역할 정보를 가져온다.
 * 쿠키 기반 Supabase SSR 클라이언트를 사용.
 */
export async function getServerSession(): Promise<UserSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role, managed_team_id, email, linked_user_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!data) return null;

  return {
    authUserId: user.id,
    email: data.email,
    role: data.role as UserRole,
    managedTeamId: data.managed_team_id ?? null,
    linkedUserId: data.linked_user_id ?? null,
  };
}

/**
 * 로그인 세션에서 사용자의 팀 ID를 resolve한다.
 * 서버 컴포넌트(page.tsx)에서 호출.
 */
export async function resolveTeamId(): Promise<string | null> {
  const session = await getServerSession();
  if (!session) return null;

  if (session.role === "team_admin" && session.managedTeamId) {
    return session.managedTeamId;
  }

  if (session.role === "member" && session.linkedUserId) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("users")
      .select("team_id")
      .eq("id", session.linkedUserId)
      .single();
    if (data?.team_id) return data.team_id;
  }

  if (session.role === "super_admin") {
    return DEFAULT_TEAM_ID;
  }

  return null;
}

/**
 * 로그인 세션에서 사용자의 user ID를 resolve한다.
 * 서버 컴포넌트(page.tsx)에서 호출.
 */
export async function resolveUserId(): Promise<string | null> {
  const session = await getServerSession();
  if (!session) return null;
  return session.linkedUserId ?? null;
}

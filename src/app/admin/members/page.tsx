import { redirect } from "next/navigation";
import { getRequestAuthUserId } from "../../../lib/server-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import AdminPageClient from "../AdminPageClient";
import { DEFAULT_TEAM_ID } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) redirect("/login");

  const admin = createSupabaseAdminClient();

  // 1. 필요한 모든 데이터를 병렬로 서버에서 조회
  const [roleRes, teamsRes, partsRes] = await Promise.all([
    admin.from("user_roles").select("role, managed_team_id, email, linked_user_id").eq("auth_user_id", authUserId).single(),
    admin.from("teams").select("id, name, jira_project_keys").order("name"),
    admin.from("parts").select("id, name, team_id").order("name"),
  ]);

  const roleRow = roleRes.data;
  if (roleRow?.role !== "super_admin" && roleRow?.role !== "team_admin") {
    redirect("/dashboard");
  }

  const isSuper = roleRow.role === "super_admin";
  const managedTeamId = roleRow.managed_team_id;

  // 2. 멤버 데이터 조회 (권한에 따른 필터링 포함)
  let membersQuery = admin
    .from("users")
    .select(`id, name, nickname, email, jira_account_id, avatar_emoji, access_token, part_id, team_id, parts (id, name), mood_logs (score, message, logged_at)`)
    .order("logged_at", { referencedTable: "mood_logs", ascending: false });

  if (!isSuper && managedTeamId) {
    membersQuery = membersQuery.eq("team_id", managedTeamId);
  }

  const { data: membersData } = await membersQuery;

  // mood_logs 정규화 (클라이언트 로직과 동일)
  const initialMembers = (membersData ?? []).map((user: any) => {
    let logs = user.mood_logs;
    if (!Array.isArray(logs)) logs = logs ? [logs] : [];
    return { ...user, mood_logs: logs.slice(0, 1) };
  });

  const initialSession = {
    authUserId,
    email: roleRow.email,
    role: roleRow.role as any,
    managedTeamId: roleRow.managed_team_id ?? null,
    linkedUserId: roleRow.linked_user_id ?? null,
  };

  return (
    <AdminPageClient
      role={roleRow.role}
      initialTab="members"
      initialData={{
        members: initialMembers,
        teams: teamsRes.data ?? [],
        parts: partsRes.data ?? [],
        session: initialSession
      }}
    />
  );
}

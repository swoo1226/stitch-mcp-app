import { redirect } from "next/navigation";
import { getRequestAuthUserId } from "../../../lib/server-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import AdminPageClient from "../AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
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
  if (roleRow?.role !== "super_admin") {
    redirect("/admin/members");
  }

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
      initialTab="teams"
      initialData={{
        members: [], // 팀 탭에서는 멤버 리스트가 즉시 필요하지 않거나 별도 조회함
        teams: teamsRes.data ?? [],
        parts: partsRes.data ?? [],
        session: initialSession
      }}
    />
  );
}

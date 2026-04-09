import { redirect } from "next/navigation";
import { getRequestAuthUserId } from "../../../lib/server-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import AdminPageClient from "../AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", authUserId)
    .single();

  if (roleRow?.role !== "super_admin") {
    redirect("/admin/members");
  }

  return <AdminPageClient role={roleRow?.role} initialTab="teams" />;
}

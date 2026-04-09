import { redirect } from "next/navigation";
import { getRequestAuthUserId } from "../../lib/server-auth";
import { createSupabaseAdminClient } from "../../lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", authUserId)
    .single();

  if (roleRow?.role !== "super_admin" && roleRow?.role !== "team_admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : null;
  if (tab === "teams" && roleRow?.role === "super_admin") {
    redirect("/admin/teams");
  }

  redirect("/admin/members");
}

import { redirect } from "next/navigation";
import { getRequestAuthUserId } from "../../../lib/server-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import AccessRequestsPageClient from "./AccessRequestsPageClient";

export default async function AccessRequestsPage() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", authUserId)
    .single();

  if (roleRow?.role !== "super_admin") redirect("/dashboard");

  return <AccessRequestsPageClient />;
}

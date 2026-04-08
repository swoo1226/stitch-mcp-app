import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getRequestAuthUserId } from "../../lib/server-auth";
import { createSupabaseAdminClient } from "../../lib/supabase-admin";
import AdminPageClient from "./AdminPageClient";
import AuthGuard from "../components/AuthGuard";

export default async function AdminPage() {
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

  return (
    <Suspense fallback={null}>
      <AuthGuard requiredRole={["super_admin", "team_admin"]}>
        <AdminPageClient role={roleRow?.role} />
      </AuthGuard>
    </Suspense>
  );
}
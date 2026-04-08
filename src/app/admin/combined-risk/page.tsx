import { redirect } from "next/navigation";
import CombinedRiskPageClient from "./CombinedRiskPageClient";
import { getRequestAuthUserId } from "../../../lib/server-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import { runCombinedRiskAlert } from "../../../lib/combined-risk-alert";

export const dynamic = "force-dynamic";

export default async function CombinedRiskPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) redirect("/login");

  const admin = createSupabaseAdminClient();
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role, managed_team_id")
    .eq("auth_user_id", authUserId)
    .single();

  if (!roleRow || (roleRow.role !== "super_admin" && roleRow.role !== "team_admin")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const highlightedUserId = typeof params.user === "string" ? params.user : null;
  const result = await runCombinedRiskAlert({
    shouldSend: false,
    managedTeamId: roleRow.role === "team_admin" ? roleRow.managed_team_id : null,
  });
  const targets = Array.isArray(result.targets) ? result.targets : [];

  return (
    <CombinedRiskPageClient
      targets={targets}
      highlightedUserId={highlightedUserId}
      role={roleRow.role}
    />
  );
}

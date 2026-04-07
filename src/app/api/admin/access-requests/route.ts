import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { getRequestAuthUserId } from "../../../../lib/server-auth";

async function assertSuperAdmin() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("user_roles").select("role").eq("auth_user_id", authUserId).single();
  return data?.role === "super_admin" ? authUserId : null;
}

export async function GET() {
  const userId = await assertSuperAdmin();
  if (!userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("access_requests")
    .select("id, requester_role, name, email, organization, team_name, message, status, reviewed_at, reviewer_note, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data ?? [] });
}

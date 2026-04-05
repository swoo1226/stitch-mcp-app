import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../lib/api-auth";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, "super_admin", "team_admin", "member");
  if (auth instanceof NextResponse) return auth;

  const { authUserId, role, managedTeamId, linkedUserId } = auth;

  let profile = null;
  if (linkedUserId) {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("users")
      .select("id, name, email, team_id, part_id, avatar_emoji, teams(id, name), parts(id, name)")
      .eq("id", linkedUserId)
      .single();
    profile = data ?? null;
  }

  return NextResponse.json({
    authUserId,
    role,
    managedTeamId,
    linkedUserId,
    profile,
  });
}

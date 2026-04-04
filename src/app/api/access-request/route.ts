import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";

const ALLOWED_ROLES = new Set(["team_admin", "member"]);

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  const role = typeof payload?.role === "string" ? payload.role : "";
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const organization = typeof payload?.organization === "string" ? payload.organization.trim() : "";
  const teamName = typeof payload?.teamName === "string" ? payload.teamName.trim() : "";
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";

  if (!ALLOWED_ROLES.has(role) || !name || !email || !organization || !teamName || !message) {
    return NextResponse.json({ error: "필수 입력값이 누락되었습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("access_requests").insert({
    requester_role: role,
    name,
    email,
    organization,
    team_name: teamName,
    message,
    source_path: request.nextUrl.pathname,
    user_agent: request.headers.get("user-agent"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

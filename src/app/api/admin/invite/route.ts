import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { requireRole } from "../../../../lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "super_admin");
  if (auth instanceof NextResponse) return auth;

  const { email, workEmail, teamId } = await req.json();
  if (!email || !teamId) {
    return NextResponse.json({ error: "email과 teamId가 필요합니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Supabase auth 초대 이메일 발송
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin`,
  });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  // admin_users 테이블에 team_admin으로 등록
  const { error: insertError } = await supabase.from("user_roles").upsert({
    auth_user_id: inviteData.user.id,
    email: email.toLowerCase(),
    work_email: workEmail ? workEmail.toLowerCase() : null,
    role: "team_admin",
    managed_team_id: teamId,
  }, { onConflict: "email" });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

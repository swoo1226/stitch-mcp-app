import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { requireRole } from "../../../../lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "super_admin", "team_admin");
  if (auth instanceof NextResponse) return auth;

  const { email, name, teamId, partId } = await req.json();
  if (!email || !name || !teamId) {
    return NextResponse.json({ error: "email, name, teamId가 필요합니다." }, { status: 400 });
  }

  // team_admin은 자기 팀에만 초대 가능
  if (auth.role === "team_admin" && auth.managedTeamId !== teamId) {
    return NextResponse.json({ error: "자신의 팀에만 초대할 수 있습니다." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();

  // users 테이블에 이미 동일 email이 있는지 확인
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  // 이미 auth에 등록된 유저인지 확인
  const { data: { users: existingAuthUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuthUser = existingAuthUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

  let authUserId: string;

  if (existingAuthUser) {
    // 이미 auth 계정 있음 → 초대 건너뛰고 auth_user_id만 사용
    authUserId = existingAuthUser.id;
  } else {
    // 신규 → 초대 이메일 발송
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/input`,
    });
    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
    authUserId = inviteData.user.id;
  }

  // users 프로필이 없으면 생성
  let userId = existingUser?.id ?? null;
  if (!userId) {
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({ name, email: email.toLowerCase(), team_id: teamId, part_id: partId ?? null })
      .select("id")
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    userId = newUser.id;
  }

  // user_roles에 member로 등록
  const { error: roleError } = await supabase.from("user_roles").upsert({
    auth_user_id: authUserId,
    email: email.toLowerCase(),
    role: "member",
    managed_team_id: teamId,
    linked_user_id: userId,
  }, { onConflict: "auth_user_id" });

  if (roleError) {
    return NextResponse.json({ error: roleError.message }, { status: 500 });
  }

  // app_metadata에 role 세팅 (JWT 캐싱용)
  await supabase.auth.admin.updateUserById(authUserId, {
    app_metadata: { role: "member", team_id: teamId },
  });

  return NextResponse.json({ ok: true, userId });
}

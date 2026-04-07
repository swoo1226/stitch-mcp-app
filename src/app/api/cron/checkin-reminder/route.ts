import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { getKoreanBusinessDaySkipReason } from "../../../../lib/korean-holidays";

function utcToKstDate(utcStr: string) {
  const d = new Date(utcStr);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, "0")}-${String(kst.getUTCDate()).padStart(2, "0")}`;
}

// GET /api/cron/checkin-reminder
// GitHub Actions에서 UTC 06:00 (KST 15:00) 평일 호출
export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const skipReason = getKoreanBusinessDaySkipReason();
    if (skipReason) {
      return NextResponse.json({ sent: false, skipped: true, reason: skipReason });
    }

    const admin = createSupabaseAdminClient();
    const todayKst = utcToKstDate(new Date().toISOString());

    // 오늘 체크인한 user_id 목록
    const { data: checkedIn } = await admin
      .from("mood_logs")
      .select("user_id")
      .gte("logged_at", `${todayKst}T00:00:00+09:00`)
      .lte("logged_at", `${todayKst}T23:59:59+09:00`);

    const checkedInIds = new Set((checkedIn ?? []).map((r: { user_id: string }) => r.user_id));

    // user_roles에서 member 역할 + auth_user_id + linked_user_id 조회
    const { data: members } = await admin
      .from("user_roles")
      .select("auth_user_id, linked_user_id")
      .eq("role", "member")
      .not("linked_user_id", "is", null);

    if (!members?.length) {
      return NextResponse.json({ sent: false, reason: "no_members" });
    }

    // 미체크인 팀원 필터
    const notCheckedIn = members.filter(
      (m: { auth_user_id: string; linked_user_id: string }) => !checkedInIds.has(m.linked_user_id)
    );

    if (!notCheckedIn.length) {
      return NextResponse.json({ sent: false, reason: "all_checked_in" });
    }

    // 오늘 이미 리마인더 받은 사람 제외
    const recipientIds = notCheckedIn.map((m: { auth_user_id: string }) => m.auth_user_id);
    const { data: alreadySent } = await admin
      .from("notifications")
      .select("recipient_auth_id")
      .in("recipient_auth_id", recipientIds)
      .eq("type", "checkin_reminder")
      .gte("created_at", `${todayKst}T00:00:00+09:00`);

    const alreadySentIds = new Set((alreadySent ?? []).map((r: { recipient_auth_id: string }) => r.recipient_auth_id));
    const toNotify = notCheckedIn.filter(
      (m: { auth_user_id: string }) => !alreadySentIds.has(m.auth_user_id)
    );

    if (!toNotify.length) {
      return NextResponse.json({ sent: false, reason: "already_reminded" });
    }

    // notifications INSERT
    await admin.from("notifications").insert(
      toNotify.map((m: { auth_user_id: string }) => ({
        recipient_auth_id: m.auth_user_id,
        type: "checkin_reminder",
        payload: { message: "오늘 아직 체크인하지 않았어요. 지금 날씨를 기록해보세요." },
      }))
    );

    return NextResponse.json({ sent: true, count: toNotify.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

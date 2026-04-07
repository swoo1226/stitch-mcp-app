import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../lib/supabase-admin";
import { getRequestAuthUserId } from "../../../lib/server-auth";

// GET /api/notifications — 본인 알림 목록 (최근 30개)
export async function GET() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .select("id, type, target_user_id, payload, read_at, created_at")
    .eq("recipient_auth_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data ?? [] });
}

// PATCH /api/notifications — 전체 읽음 처리
export async function PATCH(request: NextRequest) {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { id } = body as { id?: string };

  const admin = createSupabaseAdminClient();
  const query = admin
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_auth_id", authUserId)
    .is("read_at", null);

  // id 지정 시 단건, 없으면 전체 읽음
  if (id) query.eq("id", id);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

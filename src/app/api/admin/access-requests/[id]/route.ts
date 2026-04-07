import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-admin";
import { getRequestAuthUserId } from "../../../../../lib/server-auth";

async function assertSuperAdmin() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("user_roles").select("role").eq("auth_user_id", authUserId).single();
  return data?.role === "super_admin" ? authUserId : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await assertSuperAdmin();
  if (!userId) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { status, reviewerNote } = body as { status?: string; reviewerNote?: string };

  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("access_requests")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewer_note: reviewerNote ?? null,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

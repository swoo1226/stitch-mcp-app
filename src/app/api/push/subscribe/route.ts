import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin";
import { getRequestAuthUserId } from "../../../../lib/server-auth";

type SubscribeBody = {
  subscription?: {
    endpoint: string;
    keys?: {
      p256dh?: string;
      auth?: string;
    };
  };
  deviceLabel?: string;
  platform?: string;
};

export async function GET() {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const [{ data: subscriptions, error }, { data: roleRow }] = await Promise.all([
    admin
      .from("push_subscriptions")
      .select("id, endpoint, platform, device_label, is_active, last_seen_at, created_at")
      .eq("auth_user_id", authUserId)
      .order("updated_at", { ascending: false }),
    admin
      .from("user_roles")
      .select("role")
      .eq("auth_user_id", authUserId)
      .single(),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    isConfigured: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
    ),
    role: roleRow?.role ?? null,
    cooldownDays: 7,
    subscriptions: subscriptions ?? [],
  });
}

export async function POST(request: NextRequest) {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as SubscribeBody;
  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .upsert({
      auth_user_id: authUserId,
      endpoint,
      p256dh,
      auth,
      device_label: body.deviceLabel ?? null,
      platform: body.platform ?? "web",
      is_active: true,
      revoked_at: null,
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "auth_user_id,endpoint" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const authUserId = await getRequestAuthUserId();
  if (!authUserId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { endpoint?: string };

  const admin = createSupabaseAdminClient();
  let query = admin
    .from("push_subscriptions")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("auth_user_id", authUserId);

  if (body.endpoint) {
    query = query.eq("endpoint", body.endpoint);
  }

  const { error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

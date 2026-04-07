-- ============================================================================
-- push notifications
-- PWA web push subscriptions and per-delivery audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_label TEXT,
  platform TEXT NOT NULL DEFAULT 'unknown',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_auth_endpoint_key UNIQUE (auth_user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_active_idx
  ON public.push_subscriptions (auth_user_id, updated_at DESC)
  WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.notification_push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'failed', 'gone')),
  error_code TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  CONSTRAINT notification_push_deliveries_notification_subscription_key
    UNIQUE (notification_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS notification_push_deliveries_notification_idx
  ON public.notification_push_deliveries (notification_id, attempted_at DESC);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_push_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "push_subscriptions_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (auth_user_id = auth.uid());

CREATE POLICY "push_subscriptions_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (auth_user_id = auth.uid());

CREATE POLICY "push_subscriptions_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

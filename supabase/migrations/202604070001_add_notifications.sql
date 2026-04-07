-- ============================================================================
-- notifications 테이블
-- 앱 내 알림 인박스 (Phase 1: 저점수 알림, Phase 2: 체크인 리마인더)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 받는 사람 (auth.users.id 기준)
  recipient_auth_id UUID NOT NULL,
  -- 알림 타입
  type          TEXT NOT NULL CHECK (type IN (
    'low_mood_alert',      -- 팀원 저점수 (team_admin 수신)
    'mood_drop_alert',     -- 3일 연속 하락 (team_admin 수신)
    'checkin_reminder'     -- 체크인 리마인더 (member 본인 수신)
  )),
  -- 알림 대상 팀원 (nullable: 리마인더는 본인이라 불필요)
  target_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  -- 추가 데이터 (score, reason 등)
  payload       JSONB NOT NULL DEFAULT '{}',
  -- 읽음 처리
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx
  ON public.notifications (recipient_auth_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_unread_idx
  ON public.notifications (recipient_auth_id)
  WHERE read_at IS NULL;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 SELECT
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (recipient_auth_id = auth.uid());

-- 본인 알림만 UPDATE (읽음 처리)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (recipient_auth_id = auth.uid());

-- INSERT/DELETE는 service_role에서만 (API route)
-- anon/authenticated에 직접 INSERT 불허

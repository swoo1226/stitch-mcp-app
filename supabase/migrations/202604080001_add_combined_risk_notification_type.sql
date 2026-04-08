-- ============================================================================
-- combined risk batch alert notification type
-- ============================================================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'low_mood_alert',
    'mood_drop_alert',
    'checkin_reminder',
    'team_admin_access_request',
    'member_access_request',
    'combined_risk_alert'
  ));

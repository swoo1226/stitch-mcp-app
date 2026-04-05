-- ============================================================================
-- RLS policies for Clima app
-- 역할: super_admin, team_admin, member (user_roles 테이블 기준)
-- 핵심: SECURITY DEFINER 함수로 역할/팀 조회 → 정책 내 재귀 방지
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Helper functions (SECURITY DEFINER → RLS 우회)
-- ────────────────────────────────────────────────────────────────────────────

-- 현재 사용자의 역할 정보
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TABLE (
  role text,
  managed_team_id uuid,
  linked_user_id uuid
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ur.role, ur.managed_team_id, ur.linked_user_id
  FROM public.user_roles ur
  WHERE ur.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- 현재 사용자의 team_id (users 테이블 기준)
CREATE OR REPLACE FUNCTION public.current_user_team_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT u.team_id
  FROM public.users u
  JOIN public.user_roles ur ON ur.linked_user_id = u.id
  WHERE ur.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- 1. user_roles — 본인 행만 SELECT, CUD는 service_role에서만
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth_user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════════════════
-- 2. users
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT: super_admin 전체, team_admin은 managed_team, member는 같은 팀
CREATE POLICY "users_select"
  ON public.users FOR SELECT
  USING (
    (SELECT role FROM public.current_user_role()) = 'super_admin'
    OR (SELECT managed_team_id FROM public.current_user_role()) = users.team_id
    OR public.current_user_team_id() = users.team_id
  );

-- INSERT/UPDATE/DELETE: admin만
CREATE POLICY "users_modify"
  ON public.users FOR ALL
  USING (
    (SELECT role FROM public.current_user_role()) = 'super_admin'
    OR (SELECT managed_team_id FROM public.current_user_role()) = users.team_id
  );

-- ════════════════════════════════════════════════════════════════════════════
-- 3. mood_logs
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: super_admin 전체, admin/member는 팀 범위
CREATE POLICY "mood_logs_select"
  ON public.mood_logs FOR SELECT
  USING (
    (SELECT role FROM public.current_user_role()) = 'super_admin'
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = mood_logs.user_id
        AND (
          (SELECT managed_team_id FROM public.current_user_role()) = u.team_id
          OR public.current_user_team_id() = u.team_id
        )
    )
  );

-- INSERT: admin 또는 본인
CREATE POLICY "mood_logs_insert"
  ON public.mood_logs FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.current_user_role()) IN ('super_admin', 'team_admin')
    OR (SELECT linked_user_id FROM public.current_user_role()) = user_id
  );

-- UPDATE: admin 또는 본인
CREATE POLICY "mood_logs_update"
  ON public.mood_logs FOR UPDATE
  USING (
    (SELECT role FROM public.current_user_role()) IN ('super_admin', 'team_admin')
    OR (SELECT linked_user_id FROM public.current_user_role()) = mood_logs.user_id
  );

-- DELETE: admin만
CREATE POLICY "mood_logs_delete"
  ON public.mood_logs FOR DELETE
  USING (
    (SELECT role FROM public.current_user_role()) IN ('super_admin', 'team_admin')
  );

-- ════════════════════════════════════════════════════════════════════════════
-- 4. access_requests
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- 누구나 INSERT (공개 폼)
CREATE POLICY "access_requests_insert_public"
  ON public.access_requests FOR INSERT
  WITH CHECK (true);

-- admin만 SELECT
CREATE POLICY "access_requests_select_admin"
  ON public.access_requests FOR SELECT
  USING (
    (SELECT role FROM public.current_user_role()) IN ('super_admin', 'team_admin')
  );

-- anon 역할에 INSERT 허용
GRANT INSERT ON public.access_requests TO anon;

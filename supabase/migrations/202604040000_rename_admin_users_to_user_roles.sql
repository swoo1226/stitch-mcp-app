-- Phase 1: admin_users → user_roles 리네이밍 + member 역할 + linked_user_id 추가
-- 기존 super_admin/team_admin 데이터는 그대로 유지됩니다.

-- Step 1: 테이블 리네이밍
ALTER TABLE public.admin_users RENAME TO user_roles;

-- Step 2: role CHECK 제약 확장 (member 추가)
ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS admin_users_role_check;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('super_admin', 'team_admin', 'member'));

-- Step 3: linked_user_id 추가 (users 테이블의 프로필과 연결)
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_linked_user_id_key
  ON public.user_roles (linked_user_id)
  WHERE linked_user_id IS NOT NULL;

-- Step 4: auth_user_id unique index (이미 있을 수 있으므로 IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_auth_user_id_key
  ON public.user_roles (auth_user_id);

-- Step 5: 기존 super_admin/team_admin의 linked_user_id를 email 기준으로 자동 매핑
UPDATE public.user_roles ur
SET linked_user_id = u.id
FROM public.users u
WHERE lower(u.email) = lower(ur.email)
  AND ur.linked_user_id IS NULL;

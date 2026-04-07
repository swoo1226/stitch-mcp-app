-- access_token 만료 정책 추가
-- 기본 30일 만료. NULL이면 무기한(기존 호환).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS access_token_expires_at timestamptz;

-- 기존 토큰에 30일 만료 설정
UPDATE public.users
SET access_token_expires_at = now() + interval '30 days'
WHERE access_token IS NOT NULL
  AND access_token_expires_at IS NULL;

# Clima 역할 체계 기술 설계서

> 작성일: 2026-04-04
> 상태: Draft

---

## 1. DB 스키마 변경 설계

### 1-1. 선택지 비교

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A. users 테이블에 role 컬럼 추가** | `users.role = 'super_admin' \| 'team_admin' \| 'member'` | 단일 조회, JOIN 불필요, 단순 | 기존 users 테이블 = "팀원 프로필" 역할인데 admin도 섞임. super_admin은 특정 팀 소속이 아닐 수 있어 의미 충돌 |
| **B. user_roles 별도 테이블** | `user_roles(auth_user_id, role, team_id)` | 다대다 역할 지원, 확장성 최고 | 현재 요구사항 대비 과도한 설계. 3계층이면 충분 |
| **C. admin_users 확장 (추천)** | 기존 `admin_users`를 `user_roles`로 리네이밍하고, member도 포함 | 기존 admin_users 데이터 호환, auth.users ↔ 역할 매핑 일원화, users 테이블 변경 최소 | 로그인 시 1회 추가 조회 필요 |

### 1-2. 추천안: C — admin_users → user_roles 리네이밍 + member 역할 추가

**이유:**
- `users` 테이블은 "팀원 프로필 + 컨디션 입력 대상"이라는 도메인 의미가 강함. 인증 역할을 섞으면 관심사 분리가 깨짐
- 기존 `admin_users`에 이미 `auth_user_id`, `role`, `managed_team_id`가 있음 → member 행만 추가하면 됨
- `auth.users` (Supabase 인증) ↔ `user_roles` (역할) ↔ `users` (팀원 프로필)의 3단 구조가 가장 깨끗

### 1-3. users.email ↔ auth.users.email 연동

현재 상태:
- `users` 테이블에 `email` 컬럼이 이미 있음 (마이그레이션 `202604021930`)
- `users.email`에 unique index 존재 (`lower(email)`)
- `admin_users.email`도 별도 존재

연동 전략:
- `user_roles` 테이블에 `linked_user_id UUID REFERENCES users(id)` 추가
- 팀원 초대 시: auth.users 생성 → user_roles(role='member') 삽입 → users 테이블의 email과 매칭하여 `linked_user_id` 설정
- 이렇게 하면 로그인한 member가 자신의 users 프로필을 바로 찾을 수 있음

### 1-4. 마이그레이션 SQL 초안

```sql
-- Step 1: admin_users → user_roles 리네이밍
ALTER TABLE public.admin_users RENAME TO user_roles;

-- Step 2: role CHECK 제약 확장 (member 추가)
-- 기존 CHECK가 있다면 먼저 drop
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

-- Step 4: auth_user_id에 unique index (1인 1역할 보장)
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_auth_user_id_key
  ON public.user_roles (auth_user_id);

-- Step 5: 기존 admin_users FK, index 이름 정리 (선택)
-- Supabase는 테이블명 변경 시 기존 index/FK가 자동 유지되므로
-- 이름만 맞추고 싶으면 별도 ALTER INDEX RENAME 수행
```

**기존 데이터 호환:**
- admin_users의 기존 행들은 role='super_admin' 또는 'team_admin'으로 그대로 유지
- member 행은 팀원 초대 시 새로 삽입

---

## 2. 인증 & 세션 관리

### 2-1. 팀원 로그인 플로우

```
[팀원] → /login 페이지 → signInWithPassword(email, password)
  → Supabase auth.users 세션 발급
  → 클라이언트: getSession() → auth.users.id 획득
  → user_roles 테이블 조회(auth_user_id) → role 판별
  → role에 따라 라우팅:
      super_admin → /admin
      team_admin  → /admin (managed_team_id 범위 제한)
      member      → /personal (자기 팀 뷰)
```

현재 `/login` 페이지(`LoginPageClient.tsx`)는 이미 `signInWithPassword`를 사용하므로 로그인 UI 변경 불필요. 로그인 후 redirect 로직만 역할별로 분기하면 됨.

### 2-2. 통합 세션 함수: getSession() → 역할 판별

기존 `getAdminSession()`을 확장하여 모든 역할을 커버하는 `getUserSession()`으로 교체:

```typescript
// src/lib/auth.ts (신규)

export type UserRole = "super_admin" | "team_admin" | "member";

export interface UserSession {
  authUserId: string;
  email: string;
  role: UserRole;
  managedTeamId: string | null;   // team_admin일 때만 값 있음
  linkedUserId: string | null;    // member일 때 users 테이블 PK
}

export async function getUserSession(): Promise<UserSession | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role, managed_team_id, email, linked_user_id")
    .eq("auth_user_id", session.user.id)
    .single();

  if (!data) return null;

  return {
    authUserId: session.user.id,
    email: data.email,
    role: data.role as UserRole,
    managedTeamId: data.managed_team_id ?? null,
    linkedUserId: data.linked_user_id ?? null,
  };
}

// 하위 호환: 기존 getAdminSession() 호출부 점진 교체
export function isAdmin(session: UserSession | null): boolean {
  return session?.role === "super_admin" || session?.role === "team_admin";
}

export function isSuperAdmin(session: UserSession | null): boolean {
  return session?.role === "super_admin";
}
```

### 2-3. 세션에서 역할 정보를 효율적으로 가져오는 방법

**문제:** 매 API 호출마다 `user_roles` SELECT는 비효율적.

**전략: Supabase JWT custom claims (app_metadata)**
- 팀원 초대/역할 변경 시 `supabase.auth.admin.updateUserById(id, { app_metadata: { role, team_id } })` 호출
- 이후 JWT 토큰에 role이 포함되어 DB 조회 없이 역할 확인 가능
- `session.user.app_metadata.role`로 바로 접근

**fallback:** app_metadata가 아직 세팅 안 된 사용자는 기존처럼 user_roles 테이블 조회.

```typescript
export async function getUserRole(session: Session): Promise<UserRole | null> {
  // 1차: JWT app_metadata에서 (DB 조회 없음)
  const metaRole = session.user.app_metadata?.role;
  if (metaRole && ["super_admin", "team_admin", "member"].includes(metaRole)) {
    return metaRole as UserRole;
  }

  // 2차: user_roles 테이블 조회 (fallback)
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("auth_user_id", session.user.id)
    .single();

  return (data?.role as UserRole) ?? null;
}
```

---

## 3. 역할 기반 가드

### 3-1. AuthGuard 확장 (클라이언트)

```typescript
// src/app/components/AuthGuard.tsx 확장

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];  // 생략 시 로그인만 확인
  fallback?: string;                     // 권한 없을 때 redirect 경로 (기본: /login)
}

export default function AuthGuard({ children, requiredRole, fallback = "/login" }: AuthGuardProps) {
  const [state, setState] = useState<"loading" | "authorized" | "unauthorized">("loading");

  useEffect(() => {
    async function check() {
      const session = await getUserSession();
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(current)}`);
        return;
      }

      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!roles.includes(session.role)) {
          router.replace(fallback);
          return;
        }
      }

      setState("authorized");
    }
    check();
  }, []);

  if (state !== "authorized") return null;
  return <>{children}</>;
}
```

**사용 예시:**
```tsx
// /admin 페이지 → super_admin, team_admin만
<AuthGuard requiredRole={["super_admin", "team_admin"]}>
  <AdminPageClient />
</AuthGuard>

// /personal 페이지 → 로그인한 모든 사용자
<AuthGuard>
  <PersonalPageClient />
</AuthGuard>
```

### 3-2. API 라우트 미들웨어

```typescript
// src/lib/api-auth.ts (신규)

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { UserRole } from "./auth";

/**
 * API 라우트에서 역할 검증. 서버 사이드이므로 요청 헤더의 JWT로 검증.
 */
export async function requireRole(
  req: NextRequest,
  ...allowedRoles: UserRole[]
): Promise<{ authUserId: string; role: UserRole; managedTeamId: string | null } | NextResponse> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // app_metadata 우선, fallback으로 DB 조회
  let role = user.app_metadata?.role as UserRole | undefined;
  let managedTeamId: string | null = user.app_metadata?.managed_team_id ?? null;

  if (!role) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, managed_team_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!data) {
      return NextResponse.json({ error: "No role assigned" }, { status: 403 });
    }
    role = data.role as UserRole;
    managedTeamId = data.managed_team_id;
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { authUserId: user.id, role, managedTeamId };
}
```

**엔드포인트별 최소 역할:**

| 엔드포인트 | 최소 역할 | 비고 |
|-----------|----------|------|
| `GET /api/me` | 로그인 전체 | 역할 무관 |
| `POST /api/admin/invite` | `super_admin` | 팀장 초대 |
| `POST /api/admin/invite-member` | `team_admin` | 팀원 초대 (managed_team_id 범위) |
| `GET /api/admin/jira/*` | `team_admin` | Jira 연동 |
| `POST /api/admin/alerts/*` | `super_admin` | 알림 설정 |
| `POST /api/input` (신규) | `member` | 컨디션 입력 |
| `GET /api/team/:id/dashboard` (신규) | `team_admin`, `member`(자기 팀만) | 대시보드 |

### 3-3. RLS (Row Level Security) 정책

```sql
-- user_roles: 본인 행만 읽기
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = auth_user_id);

-- super_admin은 전체 읽기/쓰기
CREATE POLICY "super_admin full access"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE auth_user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- users: member는 같은 팀만 조회
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members see own team"
  ON public.users FOR SELECT
  USING (
    team_id IN (
      SELECT u.team_id FROM public.users u
      JOIN public.user_roles ur ON ur.linked_user_id = u.id
      WHERE ur.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE auth_user_id = auth.uid()
      AND role IN ('super_admin', 'team_admin')
    )
  );

-- team_admin은 managed_team_id에 해당하는 users만 수정
CREATE POLICY "team_admin manages own team users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE auth_user_id = auth.uid()
      AND role = 'team_admin'
      AND managed_team_id = users.team_id
    )
  );

-- mood_logs: member는 자기 것만 INSERT, 같은 팀 것만 SELECT
-- (mood_logs 테이블이 있다고 가정)
```

**주의:** 현재 서비스가 anon key + service_role key를 혼용하고 있음. RLS가 작동하려면:
- 클라이언트(anon key): RLS 적용됨
- 서버(service_role key): RLS 우회됨 — `createSupabaseAdminClient()`에서 사용
- API 라우트에서 사용자 컨텍스트로 쿼리할 때는 요청의 JWT를 사용하는 클라이언트를 생성해야 RLS가 적용됨

---

## 4. API 변경 계획

### 4-1. 팀원 초대 API (신규)

```
POST /api/admin/invite-member
```

**요청:**
```json
{
  "email": "member@example.com",
  "name": "김팀원",
  "teamId": "uuid",
  "partId": "uuid"       // 선택
}
```

**플로우:**
1. `requireRole(req, "team_admin")` — team_admin만 호출 가능
2. `managedTeamId === teamId` 확인 (자기 팀만)
3. `supabase.auth.admin.inviteUserByEmail(email)` — 인증 계정 생성 + 초대 이메일
4. `user_roles` INSERT: `{ auth_user_id, role: 'member', managed_team_id: teamId, linked_user_id }`
5. `users` 테이블에 프로필이 없으면 INSERT (name, email, team_id, part_id)
6. `supabase.auth.admin.updateUserById(id, { app_metadata: { role: 'member', team_id: teamId } })`

**응답:**
```json
{ "ok": true, "userId": "uuid" }
```

### 4-2. /api/me (신규)

```
GET /api/me
```

**응답:**
```json
{
  "authUserId": "supabase-auth-uuid",
  "email": "user@example.com",
  "role": "member",
  "managedTeamId": null,
  "profile": {                    // role=member일 때만
    "id": "users-table-uuid",
    "name": "김팀원",
    "teamId": "uuid",
    "teamName": "디자인팀",
    "partId": "uuid",
    "partName": "UX파트",
    "avatarEmoji": "🌿"
  }
}
```

**구현:**
```typescript
export async function GET(req: NextRequest) {
  const result = await requireRole(req, "super_admin", "team_admin", "member");
  if (result instanceof NextResponse) return result;

  const { authUserId, role, managedTeamId } = result;

  let profile = null;
  if (role === "member") {
    const { data } = await supabase
      .from("user_roles")
      .select("linked_user_id")
      .eq("auth_user_id", authUserId)
      .single();

    if (data?.linked_user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, team_id, part_id, avatar_emoji, teams(name), parts(name)")
        .eq("id", data.linked_user_id)
        .single();
      profile = user;
    }
  }

  return NextResponse.json({ authUserId, role, managedTeamId, profile });
}
```

### 4-3. 기존 /api/admin/* 권한 검증 추가

현재 문제: 모든 `/api/admin/*` 엔드포인트에 **권한 검증이 없음**.

| 파일 | 현재 | 변경 |
|------|------|------|
| `api/admin/invite/route.ts` | 검증 없음 | `requireRole(req, "super_admin")` 추가 |
| `api/admin/jira/users/route.ts` | 검증 없음 | `requireRole(req, "super_admin", "team_admin")` 추가 |
| `api/admin/jira/open-tickets/route.ts` | 검증 없음 | `requireRole(req, "super_admin", "team_admin")` 추가 |
| `api/admin/alerts/combined-risk/route.ts` | 검증 없음 | `requireRole(req, "super_admin")` 추가 |

**적용 패턴:**
```typescript
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, "super_admin");
  if (auth instanceof NextResponse) return auth;

  // 기존 로직...
}
```

### 4-4. 마이그레이션 순서 요약

1. `user_roles` 테이블 마이그레이션 (admin_users 리네이밍 + 컬럼 추가)
2. `src/lib/auth.ts` 신규 작성 (getUserSession, getUserRole)
3. `src/lib/api-auth.ts` 신규 작성 (requireRole)
4. `AuthGuard.tsx` 확장 (requiredRole prop)
5. `/api/me` 신규 엔드포인트
6. `/api/admin/invite-member` 신규 엔드포인트
7. 기존 `/api/admin/*` 엔드포인트에 requireRole 추가
8. RLS 정책 적용
9. `getAdminSession()` 호출부를 `getUserSession()`으로 점진 교체
10. app_metadata에 role 세팅하는 로직을 초대/역할변경 플로우에 추가

---

## 부록: 현재 코드베이스 참조

### 영향받는 파일
- `src/lib/admin-auth.ts` → deprecated, `src/lib/auth.ts`로 교체
- `src/lib/supabase.ts` → 변경 없음
- `src/lib/supabase-admin.ts` → 변경 없음
- `src/app/components/AuthGuard.tsx` → requiredRole prop 추가
- `src/app/admin/AdminPageClient.tsx` → getAdminSession → getUserSession 교체
- `src/app/login/LoginPageClient.tsx` → 로그인 후 역할별 redirect 분기 추가
- `src/app/api/admin/invite/route.ts` → requireRole 추가 + user_roles 테이블명 변경

### 신규 파일
- `src/lib/auth.ts` — 통합 세션/역할 유틸
- `src/lib/api-auth.ts` — API 라우트 역할 검증 미들웨어
- `src/app/api/me/route.ts` — 현재 사용자 정보 API
- `src/app/api/admin/invite-member/route.ts` — 팀원 초대 API
- `supabase/migrations/YYYYMMDD_rename_admin_users_to_user_roles.sql`
- `supabase/migrations/YYYYMMDD_add_rls_policies.sql`

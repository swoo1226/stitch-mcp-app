# Clima Architecture Review & 3-Tier Role Migration Strategy

> **Date**: 2026-04-04  
> **Scope**: super_admin / team_admin / member 3계층 역할 체계로의 확장  
> **Stack**: Next.js 16 App Router, React 19, Supabase, Tailwind v4, framer-motion v12

---

## 1. Current Architecture Diagnosis

### 1.1 Authentication Layer

**현재 구조**:
- Supabase Auth (email+password) 기반 로그인 (`src/app/login/LoginPageClient.tsx`)
- 클라이언트에서 `supabase.auth.getSession()` 으로 세션 확인
- `AuthGuard` 컴포넌트가 세션 없으면 `/login?redirect=...` 으로 리다이렉트
- `admin_users` 테이블에서 `auth_user_id` 매핑으로 `super_admin` / `team_admin` 역할 조회 (`src/lib/admin-auth.ts`)

**Strengths**:
- Supabase Auth 세션 관리가 안정적 (JWT, 자동 리프레시)
- admin 역할이 별도 테이블로 분리되어 auth.users와 독립적
- `AuthGuard` 래핑 패턴이 명확하고 일관됨

**Weaknesses**:
- **No middleware**: Next.js middleware가 없어 서버 사이드 보호가 전무. 모든 인증 체크가 클라이언트 사이드
- **AuthGuard는 CSR-only**: `"use client"` 컴포넌트. 인증되지 않은 사용자에게 페이지 HTML이 먼저 전달된 후 리다이렉트
- **admin-auth.ts가 anon key 사용**: `supabase` 싱글턴(anon key)으로 `admin_users`를 조회 -> RLS 미설정 시 아무나 조회 가능
- **member 역할 부재**: 현재 `AdminRole = "super_admin" | "team_admin"` 만 존재. 일반 팀원은 Supabase Auth 계정 자체가 없음

### 1.2 Data Access Patterns

**패턴 A — 클라이언트 직접 Supabase 쿼리** (대부분):
| Page | Query Target | Key |
|------|-------------|-----|
| `/dashboard` | `users`, `mood_logs`, `parts` | anon key |
| `/niko` | `users`, `mood_logs`, `parts` | anon key |
| `/personal` | `users`, `mood_logs` | anon key |
| `/admin` | `users`, `teams`, `parts`, `mood_logs`, `admin_users` | anon key |
| `/input` | `users` (by access_token), `mood_logs` | anon key |

**패턴 B — API Route (server-side)**:
| Route | Client | Key |
|-------|--------|-----|
| `/api/admin/invite` | Admin | service_role |
| `/api/admin/jira/open-tickets` | Admin | service_role (fallback anon) |
| `/api/admin/jira/users` | Admin | service_role |
| `/api/admin/alerts/combined-risk` | Admin | service_role |
| `/api/cron/combined-risk` | Cron | service_role |
| `/api/access-request` | Public | service_role |

**Critical Issue**: 클라이언트가 anon key로 `users`, `mood_logs`, `parts`, `teams` 등에 직접 쿼리. RLS 없으면 모든 데이터에 접근 가능. 팀원 `access_token`도 노출될 수 있음.

### 1.3 Security: RLS Status

- **RLS 활성화 여부 확인 불가** (migration 파일에 RLS 관련 SQL 없음)
- 마이그레이션 3개 모두 `CREATE TABLE` / `ALTER TABLE` + 인덱스만 포함
- **추정**: RLS가 비활성 상태이거나, Supabase 대시보드에서 수동 설정
- **access_token 기반 입력** (`/input?token=xxx`): 토큰 자체가 인증 역할. URL 공유로 누구나 기분 입력 가능 — 이것은 의도된 설계(팀원에게 로그인 부담 없이 입력받기)

**Client-side Role Check Vulnerability**:
- `/admin` 페이지: `getAdminSession()` 결과로 UI를 분기하지만, 클라이언트 코드이므로 DevTools로 우회 가능
- API route `/api/admin/invite`는 **인증 체크 없음** — 누구나 POST 가능
- API route `/api/admin/alerts/combined-risk`도 **인증 체크 없음**

### 1.4 Page-level Data Loading Patterns

| Page | Rendering | Auth Guard | Team ID Source |
|------|-----------|-----------|----------------|
| `/` (landing) | CSR | None | N/A |
| `/login` | SSR(params) + CSR | None | N/A |
| `/dashboard` | SSR(params) + CSR | Conditional (demo=no auth) | `?team=` param, fallback `DEMO_TEAM_ID` |
| `/niko` | SSR(params) + CSR | Conditional | `?team=` param, fallback `DEMO_TEAM_ID` |
| `/personal` | SSR(params) + CSR | Conditional | `?user=` param, fallback `DEMO_USER_ID` |
| `/admin` | CSR | AuthGuard | 없음 (super_admin 전팀, team_admin은 managed_team_id) |
| `/input` | CSR | None | `?token=` (access_token으로 user 조회) |
| `/request-access` | CSR | None | N/A |

---

## 2. Extension Points & Risks

### 2.1 `users` Table vs `auth.users` Synchronization

**현재**: `users` 테이블은 독립적. `auth.users`와 직접 연결 없음. `admin_users.auth_user_id`만 연결.

**문제점**:
- member가 Supabase Auth 계정을 갖게 되면, `users.id`와 `auth.users.id`를 어떻게 매핑할지 결정 필요
- 현재 `users.id`는 UUID이지만 `auth.users.id`와 같은 값인지 보장 없음
- `admin_users` 테이블은 `auth_user_id`를 별도 컬럼으로 가짐 — `users` 테이블에는 이 컬럼 없음

**방안**:
- `users` 테이블에 `auth_user_id` 컬럼 추가, Nullable (기존 토큰 사용자는 null)
- 또는 `users.id`를 `auth.users.id`와 동일하게 맞추는 마이그레이션 (파괴적)

### 2.2 access_token vs Login-based Auth Coexistence

**현재 flow**:
1. Admin이 팀원 추가 -> `users` 레코드 생성 (access_token 자동 발급)
2. Admin이 `/input?token=xxx` 링크를 팀원에게 공유
3. 팀원은 로그인 없이 기분 입력

**member 로그인 추가 시 공존 시나리오**:
- 같은 user가 access_token + Supabase Auth 두 경로로 기분 입력 가능
- access_token 경로는 `user_id`를 직접 resolve, Auth 경로는 `auth_user_id` -> `users.id` 매핑 필요
- **Risk**: 한 사람이 두 개 `users` 레코드를 갖게 될 수 있음 (token용 + auth용)

**권장**: access_token 경로를 유지하되, Auth 계정 연결 시 기존 `users` 레코드에 `auth_user_id`를 바인딩하는 flow 구현

### 2.3 Team ID Determination Logic Changes

**현재**: `/dashboard`, `/niko`에서 `?team=` 쿼리 파라미터로 팀 결정. 없으면 데모.

**변경 필요**:
- member 로그인 시: 본인의 `team_id`를 자동 resolve (쿼리 파라미터 불필요)
- team_admin 로그인 시: `managed_team_id`를 기본값으로
- super_admin: 팀 선택 UI 필요 (현재 admin 페이지에서 이미 존재)
- **Edge case**: 여러 팀에 소속된 경우 팀 전환 UI 필요

### 2.4 Demo Mode Boundary Complexity

**현재**: `teamId === DEMO_TEAM_ID` 분기로 데모/실제를 구분. 단순하고 잘 동작.

**확장 시 복잡도 증가**:
- member가 로그인했는데 소속 팀이 없는 경우 -> 데모? 에러?
- URL에 `?team=demo`를 수동 입력 시 인증된 사용자도 데모 모드 진입
- 역할별 네비게이션이 데모 모드에서는 어떻게 보여야 하는지

---

## 3. Impact Analysis (File-by-File)

### P0 — Immediate (Auth Foundation)

| File | Change | Reason |
|------|--------|--------|
| `src/lib/supabase.ts` | server/client Supabase 분리, `createBrowserClient` / `createServerClient` 패턴 도입 | 현재 싱글턴이 SSR/CSR 무관하게 사용됨. 서버 컴포넌트에서는 쿠키 기반 세션 필요 |
| `src/lib/admin-auth.ts` | `AdminRole` -> `UserRole = "super_admin" \| "team_admin" \| "member"` 확장. 서버사이드 세션 검증 추가 | member 역할 추가, 서버에서도 역할 체크 가능해야 함 |
| `src/app/components/AuthGuard.tsx` | 역할 파라미터 추가 (`requiredRole?: UserRole[]`). 역할 불일치 시 403 페이지로 | 현재는 세션 유무만 체크. 역할 기반 접근 제어 필요 |
| **NEW** `src/middleware.ts` | 서버 사이드 인증 미들웨어 생성. 보호 경로 정의, 세션 없으면 `/login` 리다이렉트 | 클라이언트 가드만으로는 보안 부족 |
| **NEW** `supabase/migrations/XXXXXX_add_role_system.sql` | `users` 테이블에 `auth_user_id`, `role` 컬럼 추가. RLS 정책 활성화 | 역할 체계의 DB 기반 |

### P0 — Immediate (API Security)

| File | Change | Reason |
|------|--------|--------|
| `src/app/api/admin/invite/route.ts` | 요청자 인증 + super_admin 역할 검증 추가 | 현재 인증 없이 초대 가능 |
| `src/app/api/admin/alerts/combined-risk/route.ts` | admin 역할 검증 추가 | 현재 인증 없이 접근 가능 |
| `src/app/api/admin/jira/open-tickets/route.ts` | admin 역할 검증 추가 | 현재 인증 없음 |
| `src/app/api/admin/jira/users/route.ts` | admin 역할 검증 추가 | 현재 인증 없음 |

### P1 — Next (Role-based Guards)

| File | Change | Reason |
|------|--------|--------|
| `src/app/admin/page.tsx` | AuthGuard에 `requiredRole={["super_admin", "team_admin"]}` 추가 | admin 페이지 접근 제한 |
| `src/app/admin/AdminPageClient.tsx` | team_admin의 경우 managed_team_id 범위로 데이터 필터링 강화. 팀원 관리 UI에서 역할 표시 | team_admin은 자기 팀만 관리 가능해야 함 |
| `src/app/dashboard/page.tsx` | 로그인 사용자의 역할/팀에 따라 teamId 자동 결정 | 쿼리 파라미터 의존도 낮추기 |
| `src/app/dashboard/DashboardPageClient.tsx` | `isAdmin` 로직을 역할 기반으로 변경. member는 제한된 뷰 | 현재 `!!session`으로만 admin 판별 |
| `src/app/niko/page.tsx` | 동일 — teamId 자동 resolve | |
| `src/app/niko/NikoPageClient.tsx` | member는 본인 데이터만 강조 | 역할별 UI 분기 |
| `src/app/personal/page.tsx` | 로그인 사용자의 userId 자동 resolve | 쿼리 파라미터 의존도 낮추기 |
| `src/app/personal/PersonalPageClient.tsx` | member가 본인 personal 페이지를 볼 때 추가 액션(기분 입력 바로가기 등) | |
| `src/app/input/page.tsx` | token 방식 + 로그인 방식 둘 다 지원 | 기존 호환성 유지하면서 로그인 사용자도 입력 가능 |

### P1 — Next (Navigation)

| File | Change | Reason |
|------|--------|--------|
| `src/app/components/HeaderNav.tsx` | 역할별 nav 항목 필터링 | member는 admin 링크 불필요, super_admin은 전체 |
| `src/app/page.tsx` (landing) | 로그인 상태면 역할별 대시보드로 리다이렉트 옵션 | |

### P2 — Later

| File | Change | Reason |
|------|--------|--------|
| `src/lib/demo-data.ts` | 데모 모드를 로그아웃 상태 전용으로 명확히 분리 | 역할 체계와 데모의 경계 정리 |
| `src/app/request-access/` | member 가입 신청도 이 flow에 통합 가능 | 현재 team_admin/member 신청만 |
| `src/lib/combined-risk-alert.ts` | 팀별 알림 대상 필터링에 역할 정보 활용 | |
| `src/lib/jira.ts` | member의 Jira 연동 self-service | |
| `src/app/components/ui.tsx` | 역할 배지 컴포넌트 추가 | |
| `src/app/components/TeamClimatePage.tsx` | 공개/비공개 팀 설정 반영 | |

---

## 4. Migration Strategy

### Phase 1: Auth Foundation (Week 1)

**Goal**: 서버 사이드 인증 체계 구축, DB 스키마 확장

1. **DB Migration**:
   ```sql
   -- users 테이블에 auth 연결 + 역할 컬럼
   ALTER TABLE users ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
   ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('super_admin','team_admin','member'));
   CREATE UNIQUE INDEX users_auth_user_id_key ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;
   
   -- 기존 admin_users 데이터를 users로 마이그레이션
   -- admin_users.auth_user_id -> users.auth_user_id 매핑
   ```

2. **Supabase RLS 활성화**:
   - `users`: 본인 레코드 READ, admin은 같은 팀 전체 READ
   - `mood_logs`: 본인 INSERT/UPDATE, admin은 같은 팀 READ
   - `teams`: 소속 팀 READ, super_admin 전체
   - `parts`: 소속 팀 하위 READ

3. **Next.js Middleware 추가**:
   - `/admin/*` -> super_admin, team_admin
   - `/dashboard`, `/niko`, `/personal` -> 인증 필요 (demo 제외)
   - `/api/admin/*` -> admin 역할 필요

4. **API Route 인증 추가**: 모든 `/api/admin/*` 라우트에 서버 사이드 세션 검증

**Rollback**: migration을 `DOWN` 스크립트와 함께 작성. `auth_user_id`, `role` 컬럼 DROP으로 원복

### Phase 2: Role Guards & UI Branching (Week 2)

**Goal**: 역할 기반 접근 제어, UI 분기

1. **AuthGuard 확장**: `requiredRole` prop 추가
2. **페이지별 역할 적용**:
   - `/admin`: super_admin + team_admin (team_admin은 자기 팀만)
   - `/dashboard`, `/niko`: 인증된 모든 역할 + 데모
   - `/personal`: 인증된 모든 역할 + 데모
   - `/input`: token 또는 인증된 member
3. **Navigation 분기**: 역할별 nav 항목 필터링
4. **Team ID 자동 resolve**: 로그인 사용자는 쿼리 파라미터 없이도 본인 팀으로

**Rollback**: AuthGuard의 requiredRole을 optional로 유지. 제거 시 기존 동작으로 복귀

### Phase 3: Member Onboarding & Self-service (Week 3-4)

**Goal**: 팀원 자체 가입, 프로필 관리

1. **Member 초대 flow**: admin이 이메일로 초대 -> 회원가입 -> `users` 레코드에 `auth_user_id` 바인딩
2. **access_token 공존**: 기존 token 링크 계속 동작. 로그인한 member는 token 없이도 `/input`에서 기분 입력
3. **Self-service**: member가 본인 프로필(이름, 아바타), Jira 연동 관리
4. **admin_users 테이블 deprecation**: 역할 정보가 `users.role`로 이전 완료 후 제거

**Rollback**: 각 기능을 feature flag 없이 점진적 배포. 문제 시 해당 커밋 revert

### Data Migration Plan

```
Step 1: users 테이블에 auth_user_id, role 컬럼 추가 (nullable)
Step 2: admin_users의 auth_user_id를 users에 매핑 (users.email = admin_users.email 기준)
Step 3: admin_users의 role을 users.role로 복사
Step 4: 매핑 안 되는 admin_users는 새 users 레코드 생성
Step 5: 검증 후 admin_users 참조를 users로 전환
Step 6: admin_users 테이블은 당분간 유지 (Phase 3 완료 후 DROP)
```

---

## 5. Integration Test Plan

### 5.1 Role-based Scenario Test Matrix

| Scenario | super_admin | team_admin | member | anonymous |
|----------|:-----------:|:----------:|:------:|:---------:|
| `/login` 접근 | redirect to admin | redirect to dashboard | redirect to personal | show login |
| `/admin` 접근 | full access | managed team only | 403 | redirect login |
| `/dashboard` (my team) | OK | OK (own team) | OK (own team) | redirect login |
| `/dashboard` (other team) | OK | 403 | 403 | redirect login |
| `/dashboard?team=demo` | OK | OK | OK | OK |
| `/niko` (my team) | OK | OK | OK | redirect login |
| `/personal` (my profile) | OK | OK | OK | redirect login |
| `/personal` (other user) | OK | OK (same team) | 403 | redirect login |
| `/input?token=xxx` | OK | OK | OK | OK |
| `/input` (logged in, no token) | N/A | N/A | OK (own entry) | redirect login |
| `POST /api/admin/invite` | OK | own team only | 403 | 401 |
| `POST /api/admin/alerts/combined-risk` | OK | own team only | 403 | 401 |
| Member CRUD (admin page) | all teams | own team | 403 | 401 |
| Team CRUD (admin page) | OK | 403 | 403 | 401 |
| Mood log INSERT | via token | via token | via token + auth | via token |
| Mood log READ | all teams | own team | own logs | demo only |

### 5.2 Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| 팀장이자 팀원 (team_admin이면서 다른 팀 member) | 현재 설계에서 `users.role`은 단일값. 가장 높은 권한으로 설정. 여러 팀 관리 시 `managed_team_id`를 배열 또는 별도 매핑 테이블로 |
| 여러 팀 소속 member | `users.team_id`가 단일값이므로 현재 불가. 필요 시 `team_members` 조인 테이블 도입 (P2) |
| team_admin이 본인을 삭제 | UI에서 본인 삭제 버튼 비활성화. 서버에서도 차단 |
| access_token + auth 계정이 다른 user 레코드를 가리킴 | 바인딩 flow에서 중복 체크. 이미 auth_user_id가 있는 users 레코드에는 바인딩 거부 |
| super_admin 계정이 0명 | 최소 1명 보장. 마지막 super_admin 삭제/강등 차단 |
| Supabase Auth 세션 만료 중 역할 체크 | middleware에서 세션 리프레시 시도. 실패 시 로그인으로 |
| 데모 모드에서 기분 입력 시도 | 현재: 로컬 피드백만(DB 저장 안 함). 유지 |
| RLS 활성화 후 기존 anon key 쿼리 | `users`, `mood_logs` 등의 SELECT 정책이 인증된 사용자만 허용하면 데모 모드 쿼리 실패 -> 데모는 클라이언트 더미데이터로만 동작하므로 영향 없음 |
| 팀 전환 시 캐시된 데이터 | `teamId` 변경 시 `useEffect` 재실행으로 자연스럽게 갱신. 문제 없음 |

### 5.3 Security Test Cases

| Test | Method |
|------|--------|
| 인증 없이 `/api/admin/*` POST | 401 반환 확인 |
| member 토큰으로 `/api/admin/invite` | 403 반환 확인 |
| team_admin이 다른 팀 데이터 조회 | RLS 차단 확인 |
| 만료된 JWT로 API 호출 | 401 + 세션 리프레시 유도 |
| access_token brute force | rate limit 또는 token 길이(UUID v4 = 36자)로 충분히 안전 |
| XSS in mood_log message | MarkdownRenderer의 HTML sanitization 확인 |

---

## 6. Key Architecture Decisions Summary

1. **`users` 테이블이 역할의 single source of truth**: `admin_users`는 점진적 deprecation
2. **access_token 경로 유지**: 기존 팀원 UX 보존. 로그인 경로와 병행
3. **Middleware-first auth**: 클라이언트 가드는 UX용, 실제 보안은 middleware + RLS
4. **Demo mode = client-only data**: RLS 활성화 후에도 데모는 영향 없음
5. **단일 역할 모델** (Phase 1-2): `users.role`은 단일값. 다중 팀 소속은 P2에서 조인 테이블로

---

## 7. Risk Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| RLS 활성화 시 기존 anon 쿼리 깨짐 | HIGH | 인증된 사용자 정책 + 데모 데이터 분리로 대응. 점진적 테이블별 활성화 |
| admin_users -> users 마이그레이션 데이터 손실 | MEDIUM | 매핑 스크립트 + dry-run 검증. admin_users는 바로 삭제하지 않음 |
| access_token 사용자와 Auth 사용자 중복 생성 | MEDIUM | 바인딩 flow에서 email 기반 중복 체크 |
| Next.js 16 middleware API 변경 | LOW | AGENTS.md 지침대로 `node_modules/next/dist/docs/` 확인 후 구현 |
| Supabase Auth 초대 메일 전달률 | LOW | 초대 링크를 직접 복사하는 대안 UI 제공 |

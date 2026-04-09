# UX Audit: Landing Page & Onboarding Flow

**Date**: 2026-04-04
**Scope**: Landing (`/`), Login (`/login`), Request Access (`/request-access`), Navigation system
**Methodology**: Static code analysis of page components, middleware, auth logic, nav configuration

---

## 1. Landing Page (`page.tsx`)

### Current State
- Full-page marketing site with parallax hero, "How It Works" steps, weather states showcase, insights preview mock dashboard, and CTA banner
- Header with desktop nav + mobile hamburger drawer
- Two primary CTAs: "우리 팀도 써보기" (→ `/request-access`) and "대시보드 미리보기" (→ `/dashboard`)
- Session-aware: detects logged-in user and shows admin nav link conditionally
- Mobile weather carousel with infinite marquee animation
- Footer with nav links

### Issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| L-1 | **로그인 링크 없음** | Critical | 헤더, 모바일 드로어, 푸터 어디에도 "로그인" 링크가 없다. 기존 사용자가 랜딩에서 로그인 페이지로 가려면 URL을 직접 입력해야 한다. |
| L-2 | **NAV_ITEMS 중복 정의** | Major | `page.tsx`에 하드코딩된 `NAV_ITEMS`와 `nav-items.ts`의 `getNavItems()`가 별도로 존재. 랜딩 네비게이션이 역할 기반 네비와 동기화되지 않는다. |
| L-3 | **비로그인 사용자에게 인증 필요 링크 노출** | Major | 네비에 "개인 현황"(`/personal`), "팀"(`/dashboard`), "Niko-Niko"(`/niko`) 등이 그대로 노출. `/personal`은 데모 모드가 없어 미들웨어에서 로그인으로 리다이렉트됨. 사용자 혼란 유발. |
| L-4 | **"알림" disabled 항목이 네비에 표시** | Minor | `disabled: true`인 "알림" 링크가 `NAV_ITEMS`에 있으나, 랜딩 네비 렌더링에서는 disabled 체크 없이 모두 `<Link>`로 렌더. 클릭하면 `/alerts`로 이동하되 실제 기능이 없을 수 있음. |
| L-5 | **히어로 "오늘 체크인하기" → `/input` 인증 필요** | Major | 데스크탑 헤더 CTA "오늘 체크인하기"가 `/input`으로 연결. `/input`은 `PUBLIC_PATHS`에 포함되어 인증 없이 접근 가능하지만, 비로그인 사용자가 체크인할 수 있는 것인지 의도 불명확. |
| L-6 | **모바일 WeatherCarousel 접근성 부재** | Minor | `requestAnimationFrame` 기반 무한 마퀴에 `prefers-reduced-motion` 대응이 없음. 카드에 인터랙션/pause 기능 없음. |
| L-7 | **히어로 가치 제안 모호** | Minor | "우리 팀의 오늘 날씨, 맑음일까요?" — 서비스가 무엇인지 첫 방문자에게 즉시 전달되지 않는다. 서브카피("팀원은 하루 10초로...")가 보조하지만, 히어로 자체만으로는 날씨 앱으로 오인 가능. |
| L-8 | **"대시보드 미리보기" CTA가 실제 데모인지 불명확** | Minor | `/dashboard`로 연결되는 버튼이 데모 데이터를 보여주는지, 빈 화면을 보여주는지 랜딩에서 안내가 없음. 미들웨어상 데모 모드(`team=demo`)가 있으나 버튼 href에 `?team=demo`가 없음. |

---

## 2. Login Page (`LoginPageClient.tsx`)

### Current State
- 이메일/비밀번호 로그인 단일 방식
- 세션 존재 시 `redirectTo`로 자동 리다이렉트
- 역할 기반 기본 리다이렉트: member → `/personal`, admin → `/dashboard`
- GlassCard 내부 중앙 정렬 레이아웃
- 로딩 상태("로그인 중...") 및 에러 메시지 표시

### Issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| LI-1 | **회원가입 경로 없음** | Critical | 로그인 페이지에 "회원가입" 또는 "계정 만들기" 링크가 전혀 없다. 신규 사용자의 자연스러운 진입 경로가 차단됨. (현재 `request-access`가 대체이나 명시적 안내 없음) |
| LI-2 | **비밀번호 찾기/재설정 없음** | Critical | 비밀번호 분실 시 복구 방법이 없다. Supabase는 `resetPasswordForEmail` API를 제공하므로 구현 가능. |
| LI-3 | **홈(랜딩)으로 돌아가는 링크 없음** | Major | 로그인 페이지에 로고나 홈 링크가 없어 뒤로가기 외에 탈출 경로가 없다. |
| LI-4 | **소셜 로그인 미구현** | Minor | Google/Slack 등 B2B에 적합한 소셜 로그인이 없다. 팀 단위 서비스인 만큼 SSO 또는 최소 Google OAuth가 기대됨. |
| LI-5 | **에러 메시지 일반화** | Minor | "이메일 또는 비밀번호가 맞지 않아요" — 보안상 적절하지만, 존재하지 않는 계정인지 비밀번호 오류인지 분리 안내 없음. `request-access` 안내로 연결하면 전환 기회. |
| LI-6 | **Region/버전 정보 노출** | Minor | 하단 "Region: Horizon-01 · v4.2.0" — 프로덕션에서 내부 정보가 사용자에게 노출됨. 디버깅용이라면 개발 빌드에서만 표시 권장. |

---

## 3. Request Access Page (`RequestAccessPageClient.tsx`)

### Current State
- 2열 레이아웃: 좌측 역할 선택(팀장/팀원) + 신뢰 포인트, 우측 폼
- 역할별 다른 플레이스홀더/라벨/설명 동적 전환
- 폼: 이름, 이메일, 조직, 팀이름, 메시지 (모두 required)
- 제출 후 성공/실패 메시지 AnimatePresence
- `/api/access-request` POST 호출

### Issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| RA-1 | **폼 유효성 검증 미흡** | Major | HTML `required`만 사용. 이메일 포맷 외 클라이언트 검증 없음. 중복 제출 방지가 `isPending` 상태로만 되어 있어 네트워크 지연 시 이중 클릭 가능. |
| RA-2 | **제출 후 next step 안내 부재** | Major | 성공 메시지("파일럿 신청을 접수했습니다") 후 다음 단계가 불명확. 언제 연락이 오는지, 어떻게 확인하는지 안내 없음. |
| RA-3 | **로그인 사용자 구분 없음** | Minor | 이미 로그인한 사용자가 `/request-access`를 방문해도 동일한 폼을 보여줌. 기존 사용자에게는 불필요한 페이지. |
| RA-4 | **역할 선택이 좌측 카드와 우측 탭에 중복** | Minor | 역할 변경이 좌측 카드 클릭과 우측 폼 상단 탭 모두에서 가능. 두 곳이 동기화되지만 UX 관점에서 redundancy. 모바일에서는 스크롤 거리가 길어 혼란 가능. |
| RA-5 | **모바일에서 2열 레이아웃 스택 시 폼이 너무 아래** | Minor | `lg:grid-cols-[1fr_440px]`로 모바일은 단일 컬럼. 역할 카드 2개 + 신뢰 포인트 3칸 이후에야 폼 도달. 스크롤 부담. |
| RA-6 | **헤더에 "팀 화면 미리보기" 링크만 존재** | Minor | 랜딩 헤더와 다른 별도 헤더 사용. 네비게이션 일관성 부재. 로그인 링크도 없음. |

---

## 4. Navigation System

### Current State
- **`nav-items.ts`**: 역할 기반 네비 (`getNavItems(role)`) — 내부 페이지용
- **`page.tsx` NAV_ITEMS**: 하드코딩 — 랜딩 전용
- **`HeaderNav.tsx`**: 경로 매칭 기반 active 표시, team 파라미터 전달
- **Middleware**: 공개 경로 + 데모 경로 + 인증 경로 3계층

### Issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| N-1 | **네비게이션 소스 이원화** | Major | 랜딩의 `NAV_ITEMS`(page.tsx:17-23)와 `getNavItems()`(nav-items.ts)가 독립적. 메뉴 추가/변경 시 양쪽 동기화 필요. |
| N-2 | **비로그인 → 인증 필요 페이지 접근 시 UX** | Major | `/personal` 클릭 → 미들웨어가 `/login?redirect=/personal`로 리다이렉트. 로그인 후 원래 페이지로 복귀는 잘 작동하나, 사용자에게 사전 안내 없이 갑자기 로그인 화면이 뜸. |
| N-3 | **역할별 리다이렉트 로직 분산** | Minor | 로그인 후 리다이렉트 로직이 `LoginPageClient.tsx`의 `getRedirectTarget()`에만 있음. 다른 진입점(미들웨어 리다이렉트 등)에서는 역할 기반 라우팅이 적용되지 않음. |

---

## 5. First-Visitor Funnel Analysis

```
Landing(/) ──[CTA: 우리팀도써보기]──→ Request Access(/request-access)
     │                                        │
     │──[CTA: 대시보드미리보기]──→ Dashboard(/dashboard) [데모 가능]
     │
     │──[Header: 오늘 체크인하기]──→ Input(/input) [인증?]
     │
     └──[Nav: 개인현황]──→ Login redirect ──→ ??? (회원가입 없음)
```

### Critical Funnel Gaps

1. **Discovery → Trial**: "대시보드 미리보기"가 데모 데이터를 보여주는지 보장되지 않음 (`?team=demo` 미포함)
2. **Trial → Signup**: 데모 체험 후 가입/신청으로 연결하는 CTA가 데모 페이지 내에 없음 (분석 범위 밖이나 주요 이탈 지점)
3. **Signup Flow**: 회원가입 자체가 없음. `request-access`만 존재하며 이는 "신청" → "수동 승인" 방식

---

## 6. Mobile Responsiveness

| Area | Status | Notes |
|------|--------|-------|
| Header | OK | 햄버거 + 드로어 |
| Hero text | OK | 반응형 폰트 크기 |
| Hero illustration | OK | 크기 조절됨 |
| CTA buttons | OK | `flex-wrap` 적용 |
| Weather carousel | Partial | 마퀴 작동하나 접근성 미흡 (`prefers-reduced-motion` 미대응) |
| How It Works | OK | 단일 컬럼 스택 |
| Mock dashboard | OK | 반응형 |
| Login page | OK | `max-w-md` + `px-6` |
| Request Access | Partial | 폼이 화면 하단에 밀려남 |

---

## 7. Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| 회원가입 (Self-serve signup) | P0 | 현재 수동 초대 방식만 존재 |
| 비밀번호 찾기/재설정 | P0 | Supabase `resetPasswordForEmail` 활용 가능 |
| 로그인 링크 (랜딩 헤더) | P0 | 기존 사용자 접근 불가 |
| 소셜 로그인 (Google OAuth) | P1 | B2B SaaS에 필수적 |
| 데모 모드 명시적 안내 | P1 | 비로그인 사용자에게 데모 가능 범위 안내 |
| 이메일 인증 | P2 | 가입 시 이메일 소유권 확인 |
| 온보딩 투어 | P2 | 첫 로그인 후 기능 안내 |

---

## 8. Improvement Recommendations

### Quick Wins (코드 소량 변경)

**QW-1. 랜딩 헤더에 로그인 버튼 추가** (L-1)
- `page.tsx` 헤더 영역에 `userSession` 상태에 따라 "로그인" / "마이페이지" 링크 조건 렌더링
- 데스크탑: "오늘 체크인하기" 좌측에 텍스트 링크
- 모바일 드로어: 하단 CTA 영역에 추가

**QW-2. "대시보드 미리보기" href에 `?team=demo` 추가** (L-8)
- `page.tsx:416,793` — href를 `/dashboard?team=demo`로 변경
- 비로그인 사용자가 실제 데모 데이터를 확실히 볼 수 있게 보장

**QW-3. 로그인 페이지에 홈 링크 + request-access 링크 추가** (LI-1, LI-3)
- ClimaLogo에 `<Link href="/">`로 감싸기
- 폼 하단에 "아직 계정이 없다면? 우리 팀도 써보기" → `/request-access`

**QW-4. 랜딩 NAV_ITEMS disabled 항목 처리** (L-4)
- disabled 항목은 `<Link>` 대신 `<span>`으로 렌더 + SOON 뱃지 (HeaderNav.tsx 패턴 참조)

**QW-5. WeatherCarousel에 `prefers-reduced-motion` 대응** (L-6)
- `matchMedia('(prefers-reduced-motion: reduce)')` 감지 시 애니메이션 정지

### Long-term (설계 변경)

**LT-1. 네비게이션 소스 통합** (L-2, N-1)
- 랜딩 `NAV_ITEMS`를 제거하고 `getNavItems(null)`(비로그인)을 활용
- 랜딩 전용 항목("우리 팀도 써보기")은 별도 CTA로 분리

**LT-2. Self-serve 가입 플로우 구축** (LI-1)
- `/signup` 페이지: 이메일 + 비밀번호 + 팀 초대 코드
- 팀장이 초대 링크 생성 → 팀원이 자가 가입
- 현재 `request-access`는 "데모 신청"으로 포지셔닝 재정립

**LT-3. 비밀번호 재설정 플로우** (LI-2)
- `/forgot-password` 페이지: 이메일 입력 → Supabase `resetPasswordForEmail` 호출
- `/reset-password` 페이지: 토큰 검증 + 새 비밀번호 설정
- 로그인 폼에 "비밀번호를 잊었나요?" 링크 추가

**LT-4. 데모 체험 → 전환 유도 개선** (Funnel Gap)
- 데모 페이지(`/dashboard?team=demo`) 내에 "우리 팀도 시작하기" 배너/토스트
- 일정 시간 체류 후 CTA 노출

**LT-5. Request Access 제출 후 플로우** (RA-2)
- 성공 시: 예상 응답 시간, 확인 이메일 발송 안내
- `/request-access/success` 페이지로 리다이렉트 → 데모 링크 제공

**LT-6. 소셜 로그인 (Google OAuth)** (LI-4)
- Supabase Auth의 Google provider 설정
- 로그인 페이지에 "Google로 로그인" 버튼 추가
- B2B 특성상 Workspace 도메인 제한 옵션도 고려

---

## Summary Matrix

| Page | Critical | Major | Minor |
|------|----------|-------|-------|
| Landing | 1 | 3 | 4 |
| Login | 2 | 1 | 3 |
| Request Access | 0 | 2 | 4 |
| Navigation | 0 | 2 | 1 |
| **Total** | **3** | **8** | **12** |

**Top 3 Action Items**:
1. 랜딩 헤더에 로그인 버튼 추가 (L-1) — Quick Win
2. 로그인 페이지에 비밀번호 찾기 + 가입 안내 추가 (LI-1, LI-2) — Quick Win + Long-term
3. "대시보드 미리보기" 데모 모드 보장 (L-8) — Quick Win

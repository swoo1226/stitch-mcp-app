# Clima UI Design Spec: Role-Based Navigation & Views

> 3-Tier Role System (super_admin / team_admin / member) UI 설계 명세

---

## 1. Role-Based Navigation Structure

### 1.1 HeaderNav Menu Items by Role

| Route | Label | member | team_admin | super_admin |
|-------|-------|--------|------------|-------------|
| `/personal` | 내 현황 | O | O | O |
| `/dashboard` | 팀 현황 | O | O | O |
| `/niko` | Niko-Niko | O | O | O |
| `/input` | 체크인 | O | O | O |
| `/admin` | 팀 관리 | X | O | O |

- **member**: 핵심 4개 메뉴만 노출. `/admin` 링크 완전 숨김 (disabled가 아닌 미렌더링)
- **team_admin**: member 메뉴 + `/admin` 팀 관리 메뉴 추가
- **super_admin**: team_admin과 동일 메뉴 + `/admin` 내부에서 전체 팀 전환 UI 접근 가능

### 1.2 Navigation Rendering Logic

현재 `page.tsx`의 `NAV_ITEMS` 배열과 `isAdmin` boolean 체크를 **역할 기반 필터링**으로 변경한다.

```
// Before: boolean check
const [isAdmin, setIsAdmin] = useState(false);

// After: role-based filtering
type UserRole = 'member' | 'team_admin' | 'super_admin';

const NAV_ITEMS_BY_ROLE: Record<UserRole, HeaderNavItem[]> = {
  member: [
    { label: "내 현황", href: "/personal" },
    { label: "팀 현황", href: "/dashboard" },
    { label: "Niko-Niko", href: "/niko" },
    { label: "체크인", href: "/input" },
  ],
  team_admin: [
    { label: "내 현황", href: "/personal" },
    { label: "팀 현황", href: "/dashboard" },
    { label: "Niko-Niko", href: "/niko" },
    { label: "체크인", href: "/input" },
    { label: "팀 관리", href: "/admin", icon: "admin" },
  ],
  super_admin: [
    { label: "내 현황", href: "/personal" },
    { label: "팀 현황", href: "/dashboard" },
    { label: "Niko-Niko", href: "/niko" },
    { label: "체크인", href: "/input" },
    { label: "팀 관리", href: "/admin", icon: "admin" },
  ],
};
```

### 1.3 Mobile Drawer

모바일 드로어도 동일한 역할 기반 필터링 적용. 드로어 하단에 역할 뱃지가 포함된 프로필 영역 추가.

```
┌─────────────────────┐
│  [Clima Logo]    [X] │
│                      │
│  내 현황              │
│  팀 현황              │
│  Niko-Niko           │
│  체크인               │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─  │  (team_admin/super_admin only)
│  팀 관리  [shield]    │
│                      │
│  [  오늘 체크인하기  ] │
│                      │
│  ┌──────────────────┐│
│  │ 김상우  팀장 badge ││  ← 프로필 + 역할 뱃지
│  │ team@clima.app   ││
│  └──────────────────┘│
└─────────────────────┘
```

---

## 2. Member View vs Admin View Differentiation

### 2.1 /personal (개인 현황)

| Aspect | member | team_admin | super_admin |
|--------|--------|------------|-------------|
| 기본 화면 | 자기 데이터만 | 자기 데이터 (기본) | 자기 데이터 (기본) |
| 팀원 선택 | 불가 (셀렉터 미노출) | 가능 (팀원 드롭다운) | 가능 (팀원 드롭다운) |
| 데이터 범위 | 본인 mood/score only | 팀 내 모든 팀원 | 전체 팀 모든 팀원 |

**team_admin의 /personal 팀원 선택 UI:**

```
┌──────────────────────────────────────────┐
│  내 현황                                  │
│                                          │
│  [v 팀원 선택: 김상우 (나)]               │  ← GlassPanel 드롭다운
│                                          │
│  ┌─ 팀원 목록 ─────────────────────────┐ │
│  │  ● 김상우 (나)           맑음  85pt │ │
│  │  ○ 이민수               흐림  52pt │ │
│  │  ○ 박지영               비   38pt │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  [선택된 팀원의 mood 카드, 트렌드 차트]    │
└──────────────────────────────────────────┘
```

- member가 접근 시: 드롭다운 자체가 렌더링되지 않음. 본인 데이터만 바로 표시
- 팀원 선택 드롭다운: `GlassPanel` 스타일, 각 팀원 옆에 현재 날씨 아이콘 + 점수 표시

### 2.2 /dashboard (팀 현황)

| Aspect | member | team_admin | super_admin |
|--------|--------|------------|-------------|
| 팀 선택 | 불가 (자기 팀 고정) | 불가 (자기 팀 고정) | 가능 (팀 전환 셀렉터) |
| 팀원 목록 | 자기 팀 전체 | 자기 팀 전체 | 선택한 팀 전체 |
| 통계 범위 | 자기 팀 | 자기 팀 | 선택한 팀 or 전체 |

**super_admin의 /dashboard 팀 전환 UI:**

```
┌──────────────────────────────────────────┐
│  팀 현황                                  │
│                                          │
│  [v 팀 선택: 디자인팀]  [전체 팀 보기]     │  ← super_admin only
│                                          │
│  ┌─ 팀 목록 ──────────────────────────┐  │
│  │  디자인팀         8명   맑음  78pt │  │
│  │  개발팀          12명   흐림  61pt │  │
│  │  마케팅팀         5명   구름  68pt │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 2.3 /admin (팀 관리)

member 접근 시 자동 리다이렉트 (`/dashboard`로). AuthGuard 레벨에서 역할 체크.

| Aspect | team_admin | super_admin |
|--------|------------|-------------|
| 팀원 관리 | 자기 팀만 | 모든 팀 |
| 팀원 초대 | O | O |
| 역할 변경 | member <-> team_admin | 모든 역할 변경 가능 |
| 팀 생성/삭제 | X | O |
| 알림 설정 | 자기 팀 | 전체 |

---

## 3. Login / Signup UI Flow

### 3.1 /login Page (개선)

현재: 이메일 + 비밀번호 입력 → 로그인 (관리자 전용 느낌)
개선: 모든 역할이 사용하는 통합 로그인 페이지

```
┌────────────────────────────┐
│                            │
│       [Clima Logo]         │
│                            │
│    우리 팀의 오늘 날씨는?    │
│                            │
│  ┌────────────────────────┐│
│  │  이메일                ││  ← ClimaInput
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │  비밀번호              ││  ← ClimaInput
│  └────────────────────────┘│
│                            │
│  [    로그인하기           ]│  ← ClimaButton primary
│                            │
│  비밀번호를 잊으셨나요?     │  ← text link
│                            │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│                            │
│  아직 초대를 받지 못했나요?  │
│  [팀장에게 요청하기]        │  ← secondary link
│                            │
└────────────────────────────┘
```

**변경 포인트:**
- "로그인하기" 문구 (기존 "Sign In" 등 대신 한글)
- 하단에 "초대를 받지 못했나요?" 안내 추가 → 팀원도 이 페이지가 자연스럽도록
- 비밀번호 찾기 링크 추가
- GlassCard + PlayfulGeometry 배경 유지

### 3.2 Invite Link Flow (초대 → 비밀번호 설정 → 프로필 완성)

팀장이 `/admin`에서 이메일로 초대 → 팀원 이메일에 초대 링크 발송

```
Step 1: /invite?token=xxx
┌────────────────────────────┐
│       [Clima Logo]         │
│                            │
│  [팀 이름]에서 초대했어요    │
│                            │
│  ┌────────────────────────┐│
│  │  비밀번호 설정          ││
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │  비밀번호 확인          ││
│  └────────────────────────┘│
│                            │
│  [    시작하기             ]│
└────────────────────────────┘

Step 2: /onboarding (자동 리다이렉트)
┌────────────────────────────┐
│       반가워요! 프로필 완성  │
│                            │
│  ┌────────────────────────┐│
│  │  이름                  ││  ← pre-filled if available
│  └────────────────────────┘│
│  ┌────────────────────────┐│
│  │  프로필 사진 (선택)     ││  ← optional avatar upload
│  └────────────────────────┘│
│                            │
│  [    Clima 시작하기       ]│
└────────────────────────────┘

Step 3: → /input (첫 체크인 유도)
┌────────────────────────────┐
│  오늘의 첫 번째 체크인!     │
│                            │
│  [mood input UI]           │
│                            │
│  처음이니까 가볍게 남겨보세요 │
└────────────────────────────┘
```

### 3.3 Post-Login Redirect by Role

| Role | Default Redirect |
|------|-----------------|
| member | `/personal` (내 현황) |
| team_admin | `/dashboard` (팀 현황) |
| super_admin | `/dashboard` (팀 현황) |

- `?redirect=` 쿼리가 있으면 해당 경로 우선
- 첫 로그인(onboarding 미완료) 시: `/onboarding`으로 강제 리다이렉트

---

## 4. Role Badge & Admin Indicator UI

### 4.1 Role Badge Component

역할을 시각적으로 표시하는 `RoleBadge` 컴포넌트.

```
[member]      → pill shape, surface-overlay bg, text-muted color, "팀원" 라벨
[team_admin]  → pill shape, primary 12% bg, primary color, "팀장" 라벨 + shield icon
[super_admin] → pill shape, gradient bg (primary-container → primary), on-primary color, "관리자" 라벨 + star icon
```

**Styling (DESIGN.md 준수):**
- border 없음, 배경색으로만 구분
- `rounded-full` (pill shape)
- `px-3 py-1 text-xs font-bold tracking-wide`

```
// member
background: var(--surface-overlay)
color: var(--text-muted)

// team_admin
background: color-mix(in srgb, var(--primary) 12%, transparent)
color: var(--primary)

// super_admin
background: var(--button-primary-gradient)
color: var(--on-primary)
```

### 4.2 Admin Menu Indicator

`/admin` 메뉴 항목에 Shield 아이콘 추가 (잠금이 아닌 "관리" 의미).

```
HeaderNav에서 admin 메뉴:
┌──────────────────────┐
│  [shield-icon] 팀 관리 │  ← team_admin/super_admin에만 노출
└──────────────────────┘
```

- Shield 아이콘: 16px, `var(--primary)` 색상
- active 상태: 기존 HeaderNav active 스타일 동일 (primary bg tint + primary text)

### 4.3 Profile Area (Header / Drawer)

데스크톱 헤더 우측, 모바일 드로어 하단에 프로필 영역 추가.

**Desktop Header:**
```
[Nav Items...]   [ThemeToggle] [Avatar ●] [체크인 Button]
                                  │
                                  ▼  (click → dropdown)
                        ┌──────────────────┐
                        │  김상우            │
                        │  팀장 badge       │
                        │  ─ ─ ─ ─ ─ ─ ─  │
                        │  내 프로필         │
                        │  로그아웃          │
                        └──────────────────┘
```

**Avatar:**
- 32px circle, `var(--primary)` 12% bg, 이름 첫 글자 이니셜
- 프로필 사진 설정 시 이미지로 대체
- GlassCard dropdown on click

---

## 5. Page Access Control Summary

| Route | Public | member | team_admin | super_admin |
|-------|--------|--------|------------|-------------|
| `/` (landing) | O | O | O | O |
| `/login` | O | redirect | redirect | redirect |
| `/invite` | O (token) | - | - | - |
| `/onboarding` | X | O (first) | O (first) | O (first) |
| `/personal` | X | O (self) | O (select) | O (select) |
| `/dashboard` | X | O (team) | O (team) | O (all) |
| `/niko` | X | O (team) | O (team) | O (all) |
| `/input` | X | O | O | O |
| `/admin` | X | redirect | O (team) | O (all) |
| `/request-access` | O | O | O | O |

### AuthGuard Enhancement

현재 AuthGuard는 세션 유무만 확인. 역할 기반 접근 제어 추가:

```
AuthGuard props 확장:
- requiredRole?: 'member' | 'team_admin' | 'super_admin'
- fallbackPath?: string (기본: '/dashboard')

동작:
1. 세션 없음 → /login?redirect=current 리다이렉트
2. 세션 있으나 requiredRole 미달 → fallbackPath 리다이렉트
3. 세션 + 역할 충족 → children 렌더
```

---

## 6. Design Token Reference (DESIGN.md 준수 요약)

모든 컴포넌트 구현 시:

- **Border**: 절대 사용 금지. `background`, `box-shadow`, `gap`으로 구분
- **Corner Radius**: 최소 `1.5rem`. 버튼은 `rounded-full` 또는 `rounded-[1.6rem]`
- **Glass Effect**: floating 요소에 `backdrop-filter: blur()` + semi-transparent bg
- **Gradient**: Primary CTA에 `var(--button-primary-gradient)` 사용
- **Typography**: 영문/숫자 Public Sans, 한글 Pretendard, 라벨 ALL-CAPS
- **Elevation**: 그림자 대신 tonal layering, ambient shadow만 허용
- **Divider**: line 금지, spacing으로만 구분

---

## 7. Component Inventory (신규/수정)

| Component | Status | Description |
|-----------|--------|-------------|
| `RoleBadge` | NEW | 역할 표시 pill badge |
| `ProfileDropdown` | NEW | 헤더 프로필 아바타 + 드롭다운 |
| `TeamSelector` | NEW | super_admin 팀 전환 드롭다운 |
| `MemberSelector` | NEW | team_admin 팀원 선택 드롭다운 |
| `HeaderNav` | MODIFY | role-based item filtering, admin icon 추가 |
| `AuthGuard` | MODIFY | requiredRole prop 추가 |
| `LoginPageClient` | MODIFY | 한글화, 초대 안내 추가, 비밀번호 찾기 |
| `InvitePage` | NEW | /invite 토큰 기반 비밀번호 설정 |
| `OnboardingPage` | NEW | 프로필 완성 플로우 |

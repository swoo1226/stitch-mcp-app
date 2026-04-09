# Clima App UX Audit - Core Pages

> 분석 대상: Dashboard, Niko-Niko Calendar, Personal Page
> 분석일: 2026-04-04

---

## 1. Dashboard (`DashboardPageClient.tsx`)

### 현재 상태 요약

대시보드는 팀 전체의 오늘 컨디션을 한눈에 파악하는 "팀 날씨" 페이지이다.

**스크린 구조 (위→아래)**
1. Fixed Header: 로고 + 네비게이션 + 유틸리티 아이콘 (알림/설정/프로필)
2. Hero Section: "팀 날씨" 타이틀 + 날짜 + 설명 문구 + 팀원 아바타 스택
3. Alert Banner: 주의 필요 팀원 경고 (dismissible)
4. Stats Grid (4열): 오늘 평균 / 이번 주 평균 / 월 평균 / 지난 주 대비
5. Calendar Preview: 이번 주 Niko 캘린더 상위 3명 미리보기 + "전체 보기" 링크
6. Summary Cards (2열): 팀 평균 날씨 아이콘 + 가장 많은 날씨 아이콘

**데이터 흐름**: Supabase에서 users + mood_logs를 가져와 주간/월간 집계. 데모 팀 ID 분기 처리.

### 발견된 UX 이슈

#### Critical

**C-1. 히어로 아바타 스택이 날씨 아이콘인데 맥락 없음**
- `src/app/dashboard/DashboardPageClient.tsx:505-519`
- 아바타 영역에 팀원 3명의 날씨 아이콘이 겹쳐 표시되지만, 누구의 아이콘인지 식별 불가
- `+{N}` 배지는 팀원 수를 표시하나, 옆의 아이콘과 연결이 약함
- **개선**: 아바타 이모지를 표시하고, 날씨 아이콘은 배지로 오버레이. 또는 체크인 진행률(3/8명)로 대체

**C-2. 경고 배너가 dismiss 후 세션 내에서 복구 불가**
- `src/app/dashboard/DashboardPageClient.tsx:341,526-589`
- `alertBannerDismissed`가 로컬 state로만 관리. 새 경고가 추가되어도 한번 닫으면 페이지를 벗어나기 전까지 다시 볼 수 없음
- 리더 입장에서 가장 중요한 정보(주의 팀원)를 너무 쉽게 놓칠 수 있음
- **개선**: 경고 팀원 목록을 별도 섹션으로 분리하되, 배너는 최초 진입 시 알림 역할만 수행. 또는 dismiss 시 compact 모드(배지만 남기기)로 전환

#### Major

**M-1. 이번 주/지난 주 탭이 Stats Grid와 Calendar Preview에만 영향**
- `src/app/dashboard/DashboardPageClient.tsx:179`
- weekTab 상태가 캘린더와 통계에 적용되지만, Summary Cards(팀 평균/가장 많은 날씨)도 주간 데이터 기반임에도 탭 전환 시 라벨이 "팀 평균"으로 고정
- 사용자가 "지난 주" 탭을 눌렀을 때 하단 요약 카드가 어느 기간의 데이터인지 혼란
- **개선**: Summary Cards에도 "이번 주 팀 평균" / "지난 주 팀 평균" 라벨 반영

**M-2. 캘린더 미리보기가 "상위 3명"이라는데 정렬 기준 불명**
- `src/app/dashboard/DashboardPageClient.tsx:647,665`
- `visibleMembers.slice(0, 3)`은 서버 응답 순서대로 잘라낸 것이지 점수순/이름순 아님
- "상위 3명"이라는 레이블과 실제 로직 불일치
- **개선**: 점수가 낮은 순(주의 필요 팀원 우선) 또는 오늘 체크인한 팀원 우선으로 정렬. 라벨도 "미리보기 · 최근 체크인 3명"으로 수정

**M-3. Summary Cards의 "↗" 방향 배지가 항상 고정**
- `src/app/dashboard/DashboardPageClient.tsx:696-699`
- `AverageIcon` 존재 시 무조건 "↗" 표시. 실제 추이(상승/하락/유지)와 무관
- **개선**: weeklyDelta 값에 따라 ↗/→/↘ 동적 표시. delta가 없으면 배지 숨김

**M-4. 파트 필터 UI가 대시보드에서 누락**
- Niko 페이지에는 파트 필터가 있으나 Dashboard에는 `selectedPartId` state만 있고 UI 없음
- `parts` 데이터를 가져오지만 필터 UI가 렌더링되지 않음
- **개선**: Stats Grid 위 또는 Hero 영역에 파트 필터 칩 추가

#### Minor

**m-1. "오늘 팀 평균" 수치와 Summary Card "팀 평균" 아이콘이 동일 정보 중복 표시**
- Stats Grid의 첫 번째 카드와 Summary Card가 같은 `averageScore` 기반
- **개선**: Summary Card는 주간 추이 요약(주 시작~현재 흐름)으로 역할 분화

**m-2. 로딩 상태에서 skeleton이 전혀 없음**
- `loading` state는 있으나 `loading === true`일 때의 fallback UI 미구현
- NikoCalendar에 loading prop을 전달하지만 Dashboard 자체의 Stats/Hero는 skeleton 없음
- **개선**: Stats Grid에 pulse skeleton 추가, Hero 영역은 타이틀만 먼저 노출

**m-3. bell/settings 버튼이 기능 없는 장식**
- `src/app/dashboard/DashboardPageClient.tsx:414-419`
- onClick 핸들러 없이 `<button>` 렌더링. 접근성 관점에서 인터랙션 가능한 것처럼 보이나 동작 없음
- **개선**: 미구현 기능이면 `disabled` + tooltip("준비 중") 추가하거나 제거

---

## 2. Niko-Niko Calendar (`NikoPageClient.tsx`)

### 현재 상태 요약

월~금 주간 날씨 캘린더를 팀원 전체 대상으로 보여주는 핵심 페이지.

**스크린 구조 (위→아래)**
1. Fixed Header (Dashboard와 동일 구조)
2. Hero Section: "Niko-Niko 캘린더" 타이틀 + 날짜 범위 + 파트 필터 + 이번 주/지난 주 토글
3. Calendar Section: NikoCalendar 컴포넌트 (그리드 헤더 + 팀원 행 + 팀 평균 행)
4. Weather Legend: 날씨 단계 범례

**핵심 컴포넌트**: `NikoCalendar` → `NikoGridHeader` + `NikoMemberRow[]` + `NikoSummaryRow`

### 발견된 UX 이슈

#### Critical

**C-3. 모바일에서 캘린더 수평 스크롤 시 컨텍스트 유실**
- `NikoCalendar`의 `colTemplate = "120px repeat(5, minmax(80px, 1fr))"` → 최소 너비 520px
- 모바일(375px)에서 수평 스크롤 필수이나, 스크롤 어포던스(affordance) 없음
- 팀원 이름 열이 sticky left로 고정되어 있으나, 사용자가 스크롤 가능하다는 시각적 단서 부재
- **개선**: 
  - 모바일에서 좌우 스와이프 힌트(그라데이션 페이드 또는 화살표) 추가
  - 또는 모바일 전용 세로 레이아웃 (팀원별 카드 뷰)로 전환

**C-4. WeatherCell 툴팁이 hover 기반으로 모바일에서 접근 어려움**
- `src/app/components/ui.tsx:841-842`
- `onMouseEnter/onMouseLeave`와 `onClick` 모두 구현되어 있으나, click 시 토글 로직이 hover와 충돌
- 모바일에서 셀 탭 → 툴팁 열림 → 스크롤 시도 → pointerdown 이벤트로 즉시 닫힘
- **개선**: 모바일 터치 시 툴팁을 bottom sheet나 모달로 표시. hover는 데스크톱 전용

#### Major

**M-5. 파트 필터 선택 시 팀 전체와의 비교 맥락이 약함**
- `partVsTeamSummary`가 텍스트 배지로만 표시 (`src/app/niko/NikoPageClient.tsx:462-476`)
- NikoCalendar에 `comparisonMembers`를 전달해 비교 팀 평균 행을 표시하지만, 시각적 차별화가 label과 tone 차이뿐
- **개선**: 비교 행에 점선 스타일 또는 반투명 처리로 "참고용" 성격 강화

**M-6. ViewModeToggle(icon/chart)의 chart 모드에서 정보 밀도 급감**
- chart 모드 시 `NikoMemberRow`가 `col-span-5`로 MoodTrendChart 하나만 표시
- 개별 요일별 점수/메시지 접근 불가
- **개선**: chart 모드에서도 hover 시 해당 날짜의 점수 표시. 또는 캡슐 위에 날짜 라벨 오버레이

**M-7. 주 이동이 이번 주/지난 주 2개뿐**
- `weekOffset`이 0 또는 -1만 지원 (PrimaryTabToggle)
- 과거 데이터 열람 불가. 장기 사용 시 "지지난 주" 이전 데이터 접근 수단 없음
- **개선**: 좌우 화살표 네비게이션으로 확장. 또는 달력 피커 추가

#### Minor

**m-4. Weather Legend가 캘린더 하단에 항상 노출**
- 반복 방문 사용자에게는 불필요한 공간 차지
- **개선**: 접기/펼치기 토글 또는 "?" 아이콘 클릭 시 표시

**m-5. 캘린더 헤더 날짜 포맷 불일치**
- NikoGridHeader: `"04. 04."` (MM. DD.)
- Hero dateRangeLabel: `"4월 1일 — 4월 4일"` (M월 D일)
- **개선**: 동일한 포맷으로 통일

**m-6. 빈 상태(empty state) 처리 부재**
- 팀원이 0명이거나 아무도 체크인하지 않았을 때 캘린더가 빈 그리드만 표시
- **개선**: "아직 이번 주 체크인이 없어요. 팀원들에게 알림을 보내볼까요?" 같은 안내 + CTA

---

## 3. Personal Page (`PersonalPageClient.tsx`)

### 현재 상태 요약

개인 사용자의 컨디션 추이를 보여주는 자기 관찰(self-reflection) 페이지.

**스크린 구조 (위→아래)**
1. DynamicBackground: 오늘 점수 기반 배경 색상 변화
2. Fixed Header (공통)
3. Hero Section: "개인 현황" 타이틀 + 인사이트 텍스트 + 사용자 카드(아바타+이름+상태)
4. Stats Grid (4열): 오늘 지수 / 오늘 상태 / 이번 주 평균 / 지난 주 대비
5. Weekly Flow: 이번 주 요일별 날씨 아이콘 그리드 (icon/chart 토글)
6. 2-Week Trend: 최근 14일 MoodTrendChart

**특징**: DynamicBackground로 오늘 점수에 따라 페이지 분위기 자체가 변함

### 발견된 UX 이슈

#### Critical

**C-5. mood_logs를 최근 30개만 가져와 2주 추이가 부정확할 수 있음**
- `src/app/personal/PersonalPageClient.tsx:145`
- `.limit(30, { referencedTable: "mood_logs" })` → 하루에 여러 번 기록 시 14일 커버 불가
- **개선**: 날짜 범위 기반 쿼리로 변경 (`.gte("logged_at", 14일 전)`)

#### Major

**M-8. 이번 주 흐름 섹션의 icon 모드에서 빈 날짜가 회색 원으로만 표시**
- `src/app/personal/PersonalPageClient.tsx:453-454`
- 미래 날짜(아직 안 온 요일)와 미기록 날짜의 구분이 없음
- 오늘이 수요일인데 목/금 칸이 "기록 없음"으로 보이면 혼란
- **개선**: 미래 날짜는 점선 원 + "예정" 라벨, 미기록 과거 날짜만 회색 원

**M-9. "지난 주 같은 요일 대비" 비교가 7일 전 단일 데이터에 의존**
- `src/app/personal/PersonalPageClient.tsx:183-191`
- 지난 주 해당 요일에 기록이 없으면 항상 "—" 표시
- **개선**: 지난 주 평균과 비교하는 옵션 추가. 또는 "지난 주 같은 요일 기록 없음" 명시

**M-10. 2주 추이 차트의 날짜 라벨이 3일 간격으로만 표시**
- `src/app/personal/PersonalPageClient.tsx:521`
- `i % 3 === 0` 조건으로 약 5개 라벨만 노출, 나머지는 빈 문자열
- 특정 날짜의 점수를 확인하려면 위치를 세어야 함
- **개선**: 차트에 인터랙티브 커서(탭/호버 시 해당 날짜+점수 표시) 추가

**M-11. 개인 페이지에서 팀 평균과의 비교 정보 없음**
- 자신의 점수만 보이고 팀 평균 대비 위치를 알 수 없음
- "내가 팀에서 어떤 위치인지"는 자기 인식에 중요한 맥락
- **개선**: Stats Grid에 "팀 평균 대비" 카드 추가. 또는 2주 추이 차트에 팀 평균 라인 오버레이

#### Minor

**m-7. DynamicBackground score 기본값이 55**
- `src/app/personal/PersonalPageClient.tsx:209`
- 기록 없을 때 `bgScore = 55` (Cloudy 영역) → 사용자에게 "왜 흐린 배경이지?" 혼란
- **개선**: 미기록 시 중립적인 배경(그라데이션 없이 기본 테마 배경)

**m-8. 인사이트 텍스트가 점수 구간별 정적 문구**
- `src/app/personal/PersonalPageClient.tsx:199-207`
- 추이(상승/하락)를 반영하지 않음. 어제 30에서 오늘 45로 올랐어도 "조금 흐릿한 날" 표시
- **개선**: 추이 방향도 반영한 인사이트 ("어제보다 회복 중이에요" 등)

**m-9. 로딩 상태가 단일 pulse skeleton만**
- `src/app/personal/PersonalPageClient.tsx:212-219`
- 실제 레이아웃과 무관한 하나의 큰 사각형
- **개선**: 실제 섹션 구조를 반영한 skeleton (hero + stats + chart)

---

## 4. MoodTrendChart (`MoodTrendChart.tsx`)

### 현재 상태 요약

점수 배열을 캡슐(pill) + 연결 곡선으로 시각화하는 차트 컴포넌트.

**구조**
- 가이드라인: 25/50/75% 높이에 점선
- SVG 곡선: 연속된 점수 쌍을 cubic bezier로 연결
- 캡슐 레이어: 각 점수를 색상 코딩된 pill로 표시
- 경고 glow: `checkWarning` 해당 시 빨간 breathing 애니메이션

### 발견된 UX 이슈

#### Major

**M-12. 캡슐 hover 툴팁이 모바일에서 접근 불가**
- `src/app/components/MoodTrendChart.tsx:177-199`
- `group-hover:opacity-100` CSS만 사용, 터치 이벤트 미처리
- **개선**: 터치 시 툴팁 표시 + 다른 곳 탭 시 닫기

**M-13. SVG preserveAspectRatio="none"으로 캡슐과 곡선 좌표계 불일치 가능**
- `src/app/components/MoodTrendChart.tsx:84-85`
- 캡슐은 absolute positioning(%)인데 곡선은 SVG viewBox 내 좌표
- 컨테이너 리사이즈 시 곡선이 캡슐 중심을 벗어날 수 있음
- **개선**: 캡슐도 SVG 내부로 이동하여 좌표계 통일

**M-14. 경고 glow의 breathing 애니메이션이 접근성 문제**
- `src/app/components/MoodTrendChart.tsx:157-172`
- `prefers-reduced-motion` 미지원. 깜빡이는 효과가 민감한 사용자에게 불편
- **개선**: `@media (prefers-reduced-motion: reduce)` 시 정적 glow로 대체

#### Minor

**m-10. 가이드라인의 25/50/75 라벨 없음**
- 점선만 표시되고 어떤 점수 구간인지 표시 없음
- **개선**: 좌측 또는 우측에 "25" "50" "75" 작은 라벨 추가

**m-11. null 값(빈 날) 사이의 곡선 끊김이 시각적으로 불명확**
- 연속 null 구간에서 곡선이 그려지지 않으나, 빈 캡슐이 중앙에 위치해 "연결 안 됨"이 약하게 전달
- **개선**: null 캡슐에 점선 아웃라인 적용으로 "데이터 없음" 강조

---

## 5. WeatherIcons (`WeatherIcons.tsx`)

### 현재 상태 요약

5단계 날씨 SVG 아이콘: Stormy → Rainy → Cloudy → PartlyCloudy → Sunny.
각 아이콘은 gradient fill로 시각적 깊이감 표현. `useId()`로 gradient ID 충돌 방지.

### 발견된 UX 이슈

#### Minor

**m-12. Cloudy와 PartlyCloudy의 시각적 차이가 작은 사이즈에서 구분 어려움**
- NikoCalendar의 34px, MoodTrendChart의 암시적 표현 등에서 두 상태 구분이 약함
- PartlyCloudy에 태양이 있지만 작은 사이즈에서 거의 보이지 않음
- **개선**: PartlyCloudy의 태양 색상을 더 강화하거나, 구름 색상 차이를 더 크게

**m-13. 아이콘에 aria-label 없음**
- 스크린 리더 사용자에게 날씨 상태가 전달되지 않음
- **개선**: `<svg role="img" aria-label="맑음">` 등 추가

---

## 6. mood.ts (경고 시스템)

### 현재 상태 요약

- `scoreToStatus`: 0-100점을 5단계 날씨로 변환
- `checkWarning`: 3가지 경고 조건 (40점 이하 / 하루 20pt 하락 / 연속 하락)
- 경고 시 Dashboard 배너 + MoodTrendChart glow 효과

### 발견된 UX 이슈

#### Major

**M-15. 경고 조건이 개인 추이만 반영하고 팀 맥락 없음**
- 팀 전체가 50→30으로 하락한 상황에서 개인도 50→30이면 경고가 뜨지만, 이는 팀 전체 추세일 수 있음
- **개선**: 팀 평균 대비 이탈도를 추가 경고 조건으로 고려 (장기 개선)

#### Minor

**m-14. 점수 구간 경계값(21, 41, 61, 81)에서 한 단계 차이의 민감도**
- 점수 60→61로 1점 올라가면 Cloudy→PartlyCloudy로 날씨가 변함
- **개선**: 경계 근처(+-5)에서 전환 애니메이션이나 "구름 사이로 해가 보이기 시작해요" 같은 전환 문구 추가

---

## 7. 교차 분석

### 7-1. Dashboard vs Niko 정체성 구분

| 관점 | Dashboard | Niko-Niko |
|------|-----------|-----------|
| 목적 | 오늘/이번 주 팀 상태 요약 | 주간 캘린더 상세 |
| 시간축 | 오늘 중심 + 주간 통계 | 주간 일별 상세 |
| 정보량 | 요약 (3명 미리보기) | 전체 팀원 |
| 고유 기능 | 경고 배너, 통계 카드 | 파트 필터, ViewMode 토글 |

**문제**: Dashboard의 캘린더 미리보기가 Niko와 동일한 NikoCalendar 컴포넌트를 사용해 "축소판 Niko"처럼 느껴짐. 대시보드만의 고유한 인사이트(추이 방향, 이상 징후 요약)가 부족.

**개선**: Dashboard는 캘린더 그리드 대신 팀 상태 분포(날씨별 인원수 막대/도넛 차트), 추이 방향(이번 주 곡선), 주의 필요 팀원 하이라이트 등 "인사이트 중심"으로 차별화

### 7-2. 역할별 뷰 차이

현재 `userRole`(member/team_admin/super_admin)은 HeaderNav의 메뉴 항목에만 영향.
페이지 콘텐츠 자체는 역할에 따라 변하지 않음.

**개선 제안**:
- **member**: 개인 페이지 중심, 대시보드에서 자신의 위치 강조
- **team_admin**: 경고 팀원에 대한 액션 버튼 (DM 보내기, 1:1 미팅 제안 등)
- **super_admin**: 팀 간 비교, 전체 조직 뷰

### 7-3. 모바일 터치 UX 종합

| 컴포넌트 | 이슈 | 심각도 |
|---------|------|--------|
| NikoCalendar 수평 스크롤 | 스크롤 어포던스 없음 | Critical |
| WeatherCell 툴팁 | hover/click 충돌 | Critical |
| MoodTrendChart 캡슐 | hover-only 툴팁 | Major |
| PrimaryTabToggle | 탭 타겟이 작음 (py-1.5) | Minor |
| Alert Banner chips | 칩이 작아 탭 어려움 | Minor |

### 7-4. 빈 상태(Empty State) 종합

| 상황 | 현재 처리 | 개선 |
|------|----------|------|
| 팀원 0명 | 빈 캘린더 | "팀원을 초대하세요" CTA |
| 오늘 체크인 0명 | "—" 표시 + 텍스트 인사이트 | "체크인 알림 보내기" CTA |
| 개인 기록 0건 | 빈 차트 | "첫 체크인을 해보세요" CTA + 효과 미리보기 |
| 네트워크 에러 | 무처리 (빈 화면) | 에러 메시지 + 재시도 버튼 |

### 7-5. 로딩/에러 상태 종합

| 페이지 | 로딩 | 에러 |
|--------|------|------|
| Dashboard | skeleton 없음 (NikoCalendar 내부만) | 무처리 |
| Niko | NikoCalendar loading 지원 | 무처리 |
| Personal | 단일 사각형 skeleton | 무처리 |

**개선**: 공통 ErrorBoundary + 재시도 패턴 도입. 각 페이지 섹션별 독립 skeleton.

---

## 8. 우선순위 분류

### Quick Win (1-2일 내 적용 가능)

| # | 이슈 | 파일 | 난이도 |
|---|------|------|--------|
| m-3 | bell/settings 버튼 disabled 처리 | DashboardPageClient.tsx | Low |
| m-6 | 빈 상태 안내 텍스트 추가 | NikoPageClient.tsx | Low |
| m-9 | Personal 로딩 skeleton 개선 | PersonalPageClient.tsx | Low |
| m-13 | 아이콘 aria-label 추가 | WeatherIcons.tsx | Low |
| M-3 | ↗ 배지를 delta 기반으로 동적 변경 | DashboardPageClient.tsx | Low |
| M-14 | prefers-reduced-motion 대응 | MoodTrendChart.tsx | Low |
| m-5 | 날짜 포맷 통일 | NikoPageClient.tsx, ui.tsx | Low |
| M-1 | Summary Cards 라벨에 기간 반영 | DashboardPageClient.tsx | Low |

### Medium-term (1-2주)

| # | 이슈 | 파일 | 난이도 |
|---|------|------|--------|
| C-2 | 경고 배너 compact 모드 전환 | DashboardPageClient.tsx | Medium |
| C-5 | mood_logs 쿼리를 날짜 범위 기반으로 변경 | PersonalPageClient.tsx | Medium |
| M-2 | 캘린더 미리보기 정렬 기준 명확화 | DashboardPageClient.tsx | Medium |
| M-4 | Dashboard 파트 필터 UI 추가 | DashboardPageClient.tsx | Medium |
| M-8 | 미래 날짜 vs 미기록 구분 | PersonalPageClient.tsx | Medium |
| M-10 | 차트 인터랙티브 커서 추가 | MoodTrendChart.tsx | Medium |
| M-12 | 캡슐 터치 툴팁 구현 | MoodTrendChart.tsx | Medium |
| M-7 | 주 이동 화살표 네비게이션 | NikoPageClient.tsx | Medium |

### Long-term (스프린트 이상)

| # | 이슈 | 파일 | 난이도 |
|---|------|------|--------|
| C-1 | 히어로 아바타 스택 리디자인 | DashboardPageClient.tsx | Medium |
| C-3 | 모바일 전용 캘린더 레이아웃 | ui.tsx (NikoCalendar) | High |
| C-4 | WeatherCell 모바일 bottom sheet | ui.tsx | High |
| M-11 | 개인 vs 팀 평균 비교 차트 | PersonalPageClient.tsx | High |
| M-13 | SVG/캡슐 좌표계 통일 | MoodTrendChart.tsx | High |
| M-15 | 팀 맥락 기반 경고 조건 | mood.ts | High |
| 7-1 | Dashboard 인사이트 중심 리디자인 | DashboardPageClient.tsx | High |
| 7-2 | 역할별 뷰 분화 | 전체 | High |
| 7-4 | 공통 Empty State + Error Boundary | 공통 | Medium |

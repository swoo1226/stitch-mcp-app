# Research

Do not implement yet.

## Goal

현재 구현된 페이지들이 아래 MVP를 기본적으로 충족하면서 디자인까지 정돈되어 있는지 점검한다.

## MVP 기준

1. 관리자는 팀원을 추가할 수 있어야 하고, 팀원의 파트 정보까지 다룰 수 있어야 한다.
2. 하루에 한 번씩 각 팀원의 날씨 기록이 가능해야 한다.
3. 관리자는 니코 캘린더나 대시보드에서 팀 전체/파트/개인 평균 상태 또는 추이를 확인할 수 있어야 한다.

## Current Architecture

### Data layer

- [`src/lib/supabase.ts`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/lib/supabase.ts)
  - `users`, `mood_logs` 테이블을 직접 읽고 쓴다.
  - 현재 고정 `DEFAULT_TEAM_ID` 하나에 의존한다.
- [`src/lib/mood.ts`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/lib/mood.ts)
  - 5단계 상태 매핑만 제공한다.
  - `part`, `department`, `daily uniqueness` 같은 비즈니스 규칙은 없다.

### Route map

- [`src/app/admin/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/admin/page.tsx)
  - 팀원 추가/삭제
  - 관리자 대리 mood 입력
  - 개인 입력 링크 표시
- [`src/app/input/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/input/page.tsx)
  - 개인 날씨 선택 UI
  - 축하 모달
  - 현재 코드상 Supabase 저장 로직은 보이지 않음
- [`src/app/niko/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/niko/page.tsx)
  - 주간 niko calendar 중심 화면
  - 이번 주/지난 주 토글
- [`src/app/dashboard/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/dashboard/page.tsx)
  - 팀 overview/dashboard 성격
  - 현재 로컬 워킹트리에서 최근 구조 변경이 들어가 있음
- [`src/app/personal/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/personal/page.tsx)
  - 개인 요약 화면
  - 현재는 정적 mock 성격이 강함
- [`src/app/details/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/details/page.tsx)
  - 파트 상세 분석 화면
  - 전부 하드코딩된 상태
- [`src/app/statistics/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/statistics/page.tsx)
  - 팀 통계 화면
  - 전부 하드코딩된 상태
- [`src/app/team/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/team/page.tsx)
  - 현재 `/dashboard`를 재사용

### Shared UI layer

- [`src/app/components/ui.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/components/ui.tsx)
  - GlassCard, GlassPanel, Badge, Toggle 등 design-token 기반 컴포넌트가 존재
  - 동시에 오래된 버튼/타일 스타일도 섞여 있다
- [`src/app/globals.css`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/globals.css)
  - surface/primary/secondary/tertiary token 존재
  - 최근에야 일부 `.text-*`, `.bg-*` 유틸이 보강됨
  - 전체 페이지가 이 토큰 계층을 일관되게 쓰는 것은 아님

## Findings

### MVP 1: 관리자 팀원 추가 + 파트 정보

- 현재 상태: 부분 충족, 핵심 누락 있음
- 근거
  - [`src/app/admin/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/admin/page.tsx) 에서 팀원 이름/이모지만 추가 가능
  - `users.insert` 시 `team_id`, `name`, `avatar_emoji`만 저장
  - `part` 혹은 유사 필드 입력/저장/노출 로직이 전혀 없음
- 결론
  - MVP 요구의 “팀원의 파트 정보를 포함”을 충족하지 못함

### MVP 1: 하루 한 번 날씨 기록

- 현재 상태: 기능은 있으나 제약이 없음
- 근거
  - [`src/app/admin/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/admin/page.tsx) `submitMood()`는 매번 `mood_logs.insert` 수행
  - 동일 사용자에 대해 같은 날 여러 번 입력을 막는 체크가 없음
  - [`src/app/input/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/input/page.tsx) 는 UI는 있으나 저장 연결 확인이 부족함
- 결론
  - “하루 한 번”이라는 규칙은 현재 보장되지 않음

### MVP 2: 니코 캘린더

- 현재 상태: 가장 MVP에 가까움
- 근거
  - [`src/app/niko/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/niko/page.tsx) 는 사용자 목록 + 주간 mood_logs를 실제 조회
  - 날짜 범위 계산과 주차 토글도 있음
- 한계
  - 파트별 그룹핑/필터 없음
  - 개인/파트 평균 추세 분석은 없음
  - 현재 워킹트리 기준 레이아웃 수정 중이라 안정성이 낮음

### MVP 2: 대시보드/통계/상세

- 현재 상태: 구조는 있으나 데이터 신뢰성이 낮음
- 근거
  - [`src/app/dashboard/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/dashboard/page.tsx): 일부 실데이터 기반
  - [`src/app/statistics/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/statistics/page.tsx): 정적 mock
  - [`src/app/details/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/details/page.tsx): 정적 mock
  - [`src/app/personal/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/personal/page.tsx): 정적 mock
- 결론
  - “평균 상태/추이 확인”은 일부 화면 제목만 있고, 실제 데이터 기준으로 일관되게 충족되지 않음

### Design / UI readiness

- 현재 상태: 화면별 완성도 편차가 큼
- 강점
  - global token과 glass component 방향은 존재
  - `niko`와 `dashboard`는 데스크톱용 정보 구조를 고민한 흔적이 있음
- 문제
  - 페이지마다 레이아웃 언어가 다름
  - `max-w-lg` 모바일 중심 화면과 데스크톱 대시보드형 화면이 혼재
  - mock page와 live-data page의 시각적 밀도/정보 위계가 맞지 않음
  - 일부 페이지는 token을 쓰지만, 일부는 ad-hoc inline style 또는 하드코딩 문구 위주

## Constraints / Rules

- Next.js app router 구조
- Supabase client를 프론트에서 직접 사용
- 현재 확인된 도메인 모델은 `users`, `mood_logs`뿐
- 별도 서버 액션/API 레이어 없음
- 워킹트리가 이미 dirty 상태이며 최근 `/dashboard`, `/niko`, `/team`, `globals.css` 수정이 섞여 있음

## Risks

- `part` 필드가 실제 DB에 있는지 코드에서 확인되지 않는다.
- 하루 1회 입력 제약을 클라이언트만으로 막으면 쉽게 깨진다.
- `/dashboard`와 `/niko`의 방향이 섞이면서 route responsibility가 흔들리고 있다.
- mock 기반 페이지를 실데이터 기반이라고 오해할 수 있다.
- 현재 워킹트리의 미승인 변경이 평가를 더 혼란스럽게 만든다.

## MVP Readiness Verdict

- 기능 MVP: 미충족
- 디자인 MVP: 부분 충족

### 이유 요약

- 관리자 파트 정보 관리가 없다.
- 하루 한 번 기록 규칙이 없다.
- 니코 캘린더는 비교적 살아 있으나, 대시보드/통계/상세/개인 화면은 실데이터 기준으로 일관되지 않다.
- 디자인 시스템 토큰은 생겼지만 화면 전반의 정보 밀도와 레이아웃 규칙이 아직 정리되지 않았다.

## Candidate Impact Areas

- [`src/app/admin/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/admin/page.tsx)
- [`src/app/input/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/input/page.tsx)
- [`src/app/niko/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/niko/page.tsx)
- [`src/app/dashboard/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/dashboard/page.tsx)
- [`src/app/personal/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/personal/page.tsx)
- [`src/app/details/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/details/page.tsx)
- [`src/app/statistics/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/statistics/page.tsx)
- [`src/app/components/ui.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/components/ui.tsx)
- [`src/app/globals.css`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/globals.css)

## Open Questions

- `users` 테이블에 `part` 컬럼이 이미 있는가?
- 팀원 개인 입력 `/input` 이 실제 토큰 기반 인증/저장을 완료하는가?
- `/dashboard`와 `/team`은 분리된 목적이어야 하는가, 아니면 동일한가?
- MVP에서 필요한 “추이”의 최소 단위는 주간인지, 일간인지?

# Plan

Do not implement yet.

## Scope

MVP 기준으로 기능/디자인을 정리하는 다음 단계의 수정 계획을 문서화한다.
우선순위는 `기존 route를 유지한 비교용 v2 route`를 만드는 것이다.

## Non-Goals

- 지금 당장 production code를 수정하지 않는다.
- Stitch 스크린 1:1 복제를 목표로 하지 않는다.
- 고급 권한 체계나 멀티팀 지원까지 이번 범위에 넣지 않는다.

## Recommended Direction

1. 기능 MVP를 먼저 닫는다.
2. 그다음 읽기 화면을 live-data 중심으로 정리한다.
3. 마지막으로 디자인 시스템과 레이아웃 언어를 통합한다.
4. 기존 페이지는 유지하고, 비교 가능한 신규 route로 before/after를 검증한다.

## Phase Scope

### Phase A

- 비교용 route만 추가
- 대상
  - `/dashboard-v2`
  - `/niko-v2`

### Phase B

- 비교 검토 후 채택안 확정
- 필요 시 기존 `/dashboard`, `/niko`, `/team`으로 이관

### Phase C

- 나머지 mock 기반 읽기 페이지를 실데이터 기준으로 정리
- 대상
  - `/personal`
  - `/details`
  - `/statistics`

## File-by-File Change Plan

### 1. Admin / data capture

- [`src/app/admin/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/admin/page.tsx)
  - 팀원 추가 폼에 `part` 입력 추가
  - 목록에도 파트 표시
  - 같은 날짜 mood 로그 중복 입력 차단 UX 추가
  - 저장 전 오늘 입력 여부 확인 로직 반영

- [`src/app/input/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/input/page.tsx)
  - 토큰 기반 사용자 식별이 실제로 동작하는지 정리
  - 선택한 날씨를 Supabase `mood_logs`에 저장
  - 하루 1회 제한 메시지/재입력 정책 반영

- [`src/lib/supabase.ts`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/lib/supabase.ts)
  - 필요한 경우 helper 추가
  - 날짜 단위 조회 helper 분리 검토

### 2. Dashboard / niko / analytics consolidation

- [`src/app/niko/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/niko/page.tsx)
  - 캘린더 중심 화면으로 유지
  - 파트 필터 혹은 그룹핑 추가
  - 주차 전환과 오늘 정보 패널만 남기고 정보 구조 고정
  - 기존 `/niko`는 유지

- [`src/app/niko-v2/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/niko-v2/page.tsx)
  - 비교용 신규 route
  - 캘린더 중심 레이아웃을 안전하게 실험
  - 기존 `/niko`와 동일 데이터 소스를 사용
  - summary card, header density, table width, spacing을 재조정

- [`src/app/dashboard/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/dashboard/page.tsx)
  - 팀 전체 overview 전용으로 역할 고정
  - 파트별 평균, 위험 인원 수, 최근 변동 추이 등 실데이터 기준 지표로 정리
  - `/team`과 책임 분리가 필요하면 route 재정의
  - 기존 `/dashboard`는 유지

- [`src/app/dashboard-v2/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/dashboard-v2/page.tsx)
  - 비교용 신규 route
  - overview dashboard 개선안 반영
  - 기존 `/dashboard`와 같은 데이터 소스를 사용
  - niko calendar를 포함할지, overview 카드 중심으로 갈지 명확히 분리

- [`src/app/team/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/team/page.tsx)
  - `/dashboard` 재사용 유지 여부 결정
  - 중복 route면 제거 또는 redirect 검토
  - Phase A에서는 수정 최소화

- [`src/app/personal/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/personal/page.tsx)
  - mock 제거
  - 개인 최근 기록, 평균, 주간 캘린더를 실제 데이터 기반으로 교체

- [`src/app/details/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/details/page.tsx)
  - 현재 하드코딩된 파트 상세를 실제 파트 데이터 기반으로 교체

- [`src/app/statistics/page.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/statistics/page.tsx)
  - 팀 추세/평균/분포를 실데이터 기반으로 치환

### 3. Design system cleanup

- [`src/app/components/ui.tsx`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/components/ui.tsx)
  - 버튼, 탭, glass panel 규격 통일
  - route별 전용 스타일이 shared UI로 새어 나온 부분 정리

- [`src/app/globals.css`](/Users/sangwoo/.gemini/antigravity/scratch/stitch-mcp-app/src/app/globals.css)
  - token utility 누락/혼용 정리
  - layout container scale, radius scale, label scale 명시

- 원칙
  - v2 route를 만들 때는 공통 토큰/공통 컴포넌트를 우선 사용
  - 기존 route를 깨뜨릴 수 있는 전역 수정은 최소화

## Data Model / Contract Considerations

- `users`
  - `part` 또는 동등 필드 필요
- `mood_logs`
  - 사용자/날짜 단위 uniqueness 정책 필요
  - 앱 레벨 또는 DB 레벨 제약 검토 필요

## Tradeoffs

- 옵션 A: 클라이언트에서 오늘 입력 여부만 체크
  - 빠르지만 race condition에 취약
- 옵션 B: DB uniqueness 또는 upsert 정책 도입
  - 안전하지만 스키마 확인이 필요
- 권장: 가능하면 DB 레벨 제약, 최소한 현재 MVP에서는 query + guard를 같이 사용

- 옵션 C: 기존 route를 직접 덮어쓰기
  - 빠르지만 before/after 비교가 어렵고 회귀 확인이 약하다
- 옵션 D: 비교용 신규 route를 추가
  - 파일 수는 늘지만 서버에서 직접 왕복 비교하기 쉽다
- 권장: 사용자 요청대로 신규 route를 사용해 비교 후 확정되면 기존 route에 반영

## Rejected Alternatives

- 모든 읽기 페이지를 mock 상태로 두고 UI만 먼저 정리
  - MVP 2를 계속 착시 상태로 남긴다.
- `/dashboard`, `/team`, `/niko`를 전부 같은 화면으로 통합
  - 사용자 목적이 다르므로 정보 구조가 약해진다.
- 기존 route를 즉시 덮어써서 비교 없이 진행
  - 현재처럼 의도와 다른 화면을 깨뜨릴 가능성이 높다

## Comparison Route Strategy

- 기존 route는 보존
- 비교 대상은 별도 route로 추가
- 예시
  - `/dashboard-v2`
  - `/niko-v2`
  - 필요하면 `/personal-v2`
- 검증 방식
  - 로컬 서버에서 기존 route와 신규 route를 번갈아 열어 비교
  - 구조, 정보량, 간격, CTA 우선순위, live-data 반영 여부를 직접 확인

## Phase A Validation Plan

- `npx next build --webpack`
- 서버 실행 후 직접 비교
  - `/dashboard` vs `/dashboard-v2`
  - `/niko` vs `/niko-v2`
- 체크 항목
  - 기존 route가 깨지지 않았는지
  - v2 route가 더 명확한 정보 구조를 가지는지
  - spacing, width, typography hierarchy가 개선됐는지
  - 실데이터가 기존 route와 동일하게 반영되는지

## Validation Plan

- `npx next build --webpack`
- route별 수동 점검
  - `/admin`
  - `/input`
  - `/dashboard`
  - `/niko`
  - `/personal`
  - `/details`
  - `/statistics`
- Supabase 실데이터 검증
  - 팀원 추가
  - 파트 저장
  - 하루 1회 입력
  - 니코 캘린더 반영
  - 대시보드 평균/분포 반영

## Resolved Decisions

- 기능 MVP를 디자인 정리보다 우선한다.
- `/niko`는 캘린더 중심 화면으로 유지한다.
- `/dashboard`는 overview 전용으로 정리하는 방향이 맞다.
- 기존 page를 유지한 채 비교용 route에서 개선안을 검증한다.
- Phase A는 `/dashboard-v2`, `/niko-v2` 두 route만 만든다.

## Checklist

- [ ] Phase A: `/dashboard-v2`와 `/niko-v2`를 비교용 route로 추가
- [ ] Phase A: 기존 `/dashboard`, `/niko`, `/team`은 동작 유지
- [ ] Phase A: v2 route에서 공통 token / glass component 사용 원칙 적용
- [ ] Phase A: `/dashboard-v2` 정보 구조를 overview 중심으로 재정의
- [ ] Phase A: `/niko-v2` 정보 구조를 캘린더 중심으로 재정의
- [ ] Phase A: build 통과 및 before/after 비교 검증
- [ ] Phase B: 비교 후 채택안 결정
- [ ] Phase B: `/team` route 역할 정리
- [ ] Phase C: `users`에 파트 정보 저장 경로 확인
- [ ] Phase C: `mood_logs` 하루 1회 정책 정의
- [ ] Phase C: `/admin`에서 파트 입력/표시 계획 구체화
- [ ] Phase C: `/input` 저장 흐름 계획 구체화
- [ ] Phase C: mock 기반 페이지를 live-data 기준으로 대체

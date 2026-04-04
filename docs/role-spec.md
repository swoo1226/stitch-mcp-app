# Clima 역할 체계 기능 명세서

> 문서 버전: v1.0 | 작성일: 2026-04-04
> 대상: super_admin / team_admin / member 3계층 확장

---

## 1. 3계층 역할 정의

### 1.1 super_admin (슈퍼어드민)

| 항목 | 설명 |
|------|------|
| **정의** | Clima 서비스 전체를 관리하는 최상위 관리자 |
| **권한 범위** | 모든 팀·모든 사용자 데이터 조회, 팀 생성/삭제, team_admin 초대/해제, 서비스 설정, Jira 연동 관리, 위험 알림 수신 |
| **제약사항** | 직접 체크인 입력은 member 역할이 별도로 필요 (동일 계정에 member 역할 병행 가능) |
| **인증 방식** | Supabase Auth (이메일/비밀번호) → `admin_users` 테이블 role=super_admin |
| **managed_team_id** | `null` (전체 팀 접근) |

### 1.2 team_admin (팀장)

| 항목 | 설명 |
|------|------|
| **정의** | 특정 팀을 관리하는 팀 리더. 팀원 컨디션 모니터링 및 팀 운영 책임자 |
| **권한 범위** | 자기 팀 데이터 조회(대시보드·니코니코·개인 현황), 팀원 초대/관리, 팀 설정, 위험 알림 수신, Jira 연동 설정(자기 팀) |
| **제약사항** | 다른 팀 데이터 접근 불가. 서비스 전체 설정 변경 불가. team_admin 초대 불가(super_admin 전용) |
| **인증 방식** | Supabase Auth (이메일/비밀번호) → `admin_users` 테이블 role=team_admin, managed_team_id=팀ID |
| **추가** | team_admin은 동시에 자기 팀의 member 역할을 겸할 수 있음 (체크인 입력 가능) |

### 1.3 member (팀원)

| 항목 | 설명 |
|------|------|
| **정의** | 팀에 소속되어 일일 체크인을 수행하는 일반 사용자 |
| **권한 범위** | 체크인 입력, 자기 개인 현황 조회, 자기 팀 대시보드/니코니코 조회(읽기 전용) |
| **제약사항** | 관리 기능(팀원 추가/삭제, 팀 설정, Jira 연동, 위험 알림 설정) 접근 불가. 다른 팀원의 상세 데이터(메시지 내용) 조회 불가 |
| **인증 방식** | (현재) access_token 기반 → (확장 후) Supabase Auth 로그인 또는 매직 링크 |
| **소속** | `team_members` 테이블의 team_id로 팀 결정 |

---

## 2. 역할별 접근 매트릭스

### 2.1 페이지 접근 권한

| 페이지 | 경로 | 인증 필요 | super_admin | team_admin | member | 비로그인 |
|--------|------|-----------|:-----------:|:----------:|:------:|:--------:|
| 랜딩 | `/` | X | O | O | O | O |
| 로그인 | `/login` | X | O | O | O | O |
| 팀 대시보드 | `/dashboard?team=` | O | O (모든 팀) | O (자기 팀만) | O (자기 팀, 읽기 전용) | X |
| Niko-Niko 달력 | `/niko?team=` | O | O (모든 팀) | O (자기 팀만) | O (자기 팀, 읽기 전용) | X |
| 개인 현황 | `/personal?user=` | O | O (모든 사용자) | O (자기 팀원만) | O (본인만) | X |
| 체크인 입력 | `/input?token=` | 토큰 | X (별도 member 필요) | O (겸임 시) | O | X |
| 관리자 패널 | `/admin` | O | O (전체) | O (자기 팀 범위) | X | X |
| 알림 | `/alerts` | O | O (전체) | O (자기 팀) | X | X |
| 접근 신청 | `/request-access` | X | O | O | O | O |
| 팀 관리 | `/team` | O | O | O (자기 팀) | X | X |
| 데모 모드 | `?team=demo` | X | O | O | O | O |

### 2.2 기능별 접근 권한

| 기능 | super_admin | team_admin | member |
|------|:-----------:|:----------:|:------:|
| 팀 생성/삭제 | O | X | X |
| team_admin 초대 | O | X | X |
| 팀원 초대/추가 | O | O (자기 팀) | X |
| 팀원 삭제/비활성화 | O | O (자기 팀) | X |
| 팀 설정 변경 (이름, 파트 등) | O | O (자기 팀) | X |
| Jira 연동 설정 | O | O (자기 팀) | X |
| Jira 티켓 조회 | O | O (자기 팀원) | X |
| 위험 알림 수신 설정 | O | O (자기 팀) | X |
| 위험 알림 조회 | O | O (자기 팀) | X |
| 체크인 입력 | O (member 겸임 시) | O (member 겸임 시) | O |
| 자기 개인 현황 조회 | O (member 겸임 시) | O (member 겸임 시) | O |
| 팀원 개인 현황 조회 | O (모든 팀원) | O (자기 팀원) | X |
| 대시보드 조회 | O (모든 팀) | O (자기 팀) | O (자기 팀, 읽기 전용) |
| Niko-Niko 조회 | O (모든 팀) | O (자기 팀) | O (자기 팀, 읽기 전용) |
| 접근 요청 승인/거부 | O | X | X |

---

## 3. 팀원(member) 온보딩 플로우

### 3.1 팀장이 팀원을 초대하는 경우

```
[team_admin] 관리자 패널(/admin)에서 "팀원 추가" 클릭
    │
    ▼
[team_admin] 팀원 이름, 이메일 입력 → "초대" 버튼
    │
    ▼
[시스템] team_members 테이블에 레코드 생성
         access_token 자동 생성
         초대 이메일 발송 (매직 링크 또는 가입 안내)
    │
    ▼
[member] 이메일 수신 → 링크 클릭
    │
    ├─ (현재 방식) access_token 포함 URL로 /input 직행
    │      └─ 체크인 입력 → 완료
    │
    └─ (확장 후) 가입 페이지로 이동
           │
           ▼
       [member] 비밀번호 설정 → 계정 생성
           │
           ▼
       [시스템] Supabase Auth 계정 생성
                team_members.auth_user_id 연결
           │
           ▼
       [member] 자동 로그인 → /input (첫 체크인) 으로 리다이렉트
           │
           ▼
       [member] 첫 체크인 완료 → /personal (내 현황) 으로 이동
```

### 3.2 팀원이 직접 신청하는 경우

```
[member] /request-access 접속 → "팀원" 탭 선택
    │
    ▼
[member] 이름, 이메일, 소속, 팀명, 메시지 입력 → 제출
    │
    ▼
[시스템] access_requests 테이블에 requester_role='member'로 저장
    │
    ▼
[super_admin] 관리자 패널에서 접근 요청 확인 → 승인
    │
    ▼
[시스템] 해당 팀의 team_admin에게 알림 or super_admin이 직접 팀 배정
    │
    ▼
(이후 3.1 플로우와 동일)
```

---

## 4. 팀장(team_admin) 온보딩 플로우

### 4.1 슈퍼어드민이 팀장을 초대하는 경우

```
[super_admin] 관리자 패널(/admin)에서 "팀장 초대" 클릭
    │
    ▼
[super_admin] 이메일, 대상 팀 선택 → "초대" 버튼
    │
    ▼
[시스템] POST /api/admin/invite 호출
         ├─ Supabase Auth 초대 이메일 발송
         └─ admin_users 테이블에 role='team_admin', managed_team_id=팀ID 등록
    │
    ▼
[team_admin] 이메일 수신 → 초대 링크 클릭
    │
    ▼
[team_admin] 비밀번호 설정 → 계정 활성화
    │
    ▼
[시스템] 자동 로그인 → /admin 으로 리다이렉트
    │
    ▼
[team_admin] 관리자 패널에서 팀 초기 설정
    │
    ├─ 팀명/파트 설정 확인
    ├─ 팀원 목록 확인 및 추가
    ├─ (선택) Jira 연동 설정
    └─ (선택) 위험 알림 채널 설정
    │
    ▼
[team_admin] 설정 완료 → /dashboard?team=자기팀 에서 운영 시작
```

### 4.2 팀장이 직접 신청하는 경우

```
[team_admin 후보] /request-access 접속 → "팀장" 탭 선택
    │
    ▼
[team_admin 후보] 이름, 이메일, 소속, 팀명, 메시지 입력 → 제출
    │
    ▼
[시스템] access_requests 테이블에 requester_role='team_admin'으로 저장
    │
    ▼
[super_admin] 관리자 패널에서 접근 요청 확인
    │
    ▼
[super_admin] 승인 시:
    ├─ 팀이 없으면 팀 생성
    └─ POST /api/admin/invite 호출 (4.1 플로우 합류)
```

---

## 5. 역할 전환 시나리오

### 5.1 team_admin + member 겸임 (가장 일반적)

팀장이 자기 팀에 대해 관리 업무를 하면서 동시에 자기 자신의 체크인을 입력하는 경우.

**구현 방식:**
- `admin_users` 테이블에 team_admin으로 등록 (관리 권한)
- `team_members` 테이블에도 같은 이메일/auth_user_id로 등록 (체크인 입력 가능)
- UI에서 역할에 따라 네비게이션 분기:
  - 관리자 메뉴: `/admin`, `/dashboard`, `/niko`, `/alerts`
  - 내 체크인: `/input`, `/personal`

**UX 흐름:**
```
[team_admin] 로그인 후 → /admin (기본 랜딩)
    │
    ├─ "내 체크인" 버튼/탭 → /input (member 모드)
    │      └─ 체크인 완료 → /personal (내 현황)
    │
    └─ "팀 관리" → /admin (admin 모드)
           └─ /dashboard, /niko, /alerts 등
```

### 5.2 super_admin + member 겸임

슈퍼어드민이 특정 팀의 팀원으로서 체크인도 하는 경우. (예: 김상우)

**구현 방식:**
- `admin_users` 테이블에 super_admin으로 등록
- `team_members` 테이블에도 등록 (특정 팀 소속)
- super_admin 네비게이션에 "내 체크인" 경로 추가

### 5.3 member → team_admin 역할 변경

기존 팀원이 팀장으로 승격되는 경우.

**처리:**
- super_admin이 해당 member의 Supabase Auth 계정(이미 존재)을 `admin_users`에 team_admin으로 등록
- `team_members` 레코드는 유지 (체크인 이력 보존)
- 다음 로그인 시 team_admin 권한 적용

### 5.4 여러 팀 관리

한 사람이 여러 팀의 team_admin인 경우.

**현재 구조의 한계:** `admin_users.managed_team_id`가 단일 값이므로 1인 1팀만 가능.

**확장 방안:**
- `admin_team_assignments` 중간 테이블 도입 (admin_user_id, team_id) → 다대다 관계
- 또는 현 단계에서는 1인 1팀 제약 유지, 필요 시 super_admin이 팀 전환 지원

---

## 6. 권한 에스컬레이션

### 6.1 member → team_admin 승격

| 항목 | 설명 |
|------|------|
| **트리거** | super_admin이 관리자 패널에서 승격 처리 |
| **전제 조건** | 해당 member가 Supabase Auth 계정을 보유해야 함 (access_token 전용이면 먼저 계정 생성 필요) |
| **처리 절차** | 1. `admin_users` 테이블에 role=team_admin, managed_team_id 지정하여 INSERT<br>2. `team_members` 레코드 유지 (겸임)<br>3. 승격 알림 이메일 발송 |
| **롤백** | `admin_users`에서 해당 레코드 DELETE → 자동으로 member 전용 복귀 |

### 6.2 team_admin → super_admin 승격

| 항목 | 설명 |
|------|------|
| **트리거** | 기존 super_admin이 직접 DB에서 변경 (현재 UI 미제공) |
| **처리 절차** | 1. `admin_users.role`을 super_admin으로 UPDATE<br>2. `managed_team_id`를 NULL로 설정 (전체 팀 접근) |
| **주의** | super_admin 수는 최소한으로 유지. 승격은 매우 제한적으로 수행 |

### 6.3 team_admin → member 강등

| 항목 | 설명 |
|------|------|
| **트리거** | super_admin이 관리자 패널에서 처리 |
| **처리 절차** | 1. `admin_users`에서 해당 레코드 DELETE<br>2. `team_members` 레코드 유지 (체크인 이력 보존)<br>3. 다음 로그인 시 member 권한만 적용 |

### 6.4 팀 이동

| 항목 | 설명 |
|------|------|
| **트리거** | team_admin 또는 super_admin이 팀원의 소속 팀 변경 |
| **처리 절차** | 1. `team_members.team_id` 업데이트<br>2. 체크인 이력은 유지 (user 기준 조회)<br>3. 이전 팀 대시보드에서는 더 이상 표시되지 않음 |

---

## 7. 데이터 접근 범위 정리

| 데이터 | super_admin | team_admin | member |
|--------|:-----------:|:----------:|:------:|
| 모든 팀 목록 | O | X (자기 팀만) | X |
| 팀원 점수(score) | O (전체) | O (자기 팀) | O (자기 팀, 집계만) |
| 팀원 메시지(message) | O (전체) | O (자기 팀) | X (본인 것만) |
| 팀원 Jira 티켓 | O (전체) | O (자기 팀) | X (본인 것만) |
| 위험 알림(combined-risk) | O (전체) | O (자기 팀) | X |
| access_requests | O | X | X |
| admin_users 테이블 | O | X | X |

---

## 8. 현재 → 확장 변경 요약

| 영역 | 현재 (2계층) | 확장 후 (3계층) |
|------|-------------|----------------|
| 역할 | super_admin, team_admin | super_admin, team_admin, member |
| member 인증 | access_token (로그인 불가) | Supabase Auth (로그인 가능) + access_token 하위 호환 |
| AuthGuard | 세션 유무만 체크 | 세션 + 역할 기반 접근 제어 (RoleGuard) |
| 네비게이션 | admin 전용 | 역할별 분기 (admin 메뉴 / member 메뉴) |
| /personal | admin이 ?user= 로 조회 | member 본인은 자동으로 자기 데이터, admin은 기존 방식 유지 |
| /dashboard, /niko | admin이 ?team= 로 조회 | member는 자기 팀 자동 세팅, admin은 기존 방식 유지 |
| /input | access_token 필수 | 로그인된 member는 토큰 없이 접근 가능 |

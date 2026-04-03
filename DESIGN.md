# DESIGN.md - Wether: The Vibrant Digital Atrium

이 문서는 "Wether" 서비스의 프론트엔드 및 UI 요소를 일관되게 생성하기 위한 진실의 원천(Single Source of Truth)입니다. AI 에이전트는 이 문서의 규칙을 최우선으로 준수하여 화면을 구성해야 합니다.

## 1. Visual Theme & Atmosphere
핵심 메타포는 **"디지털 온실 속 날씨(The Vibrant Digital Atrium & Weather)"**입니다.
팀원의 컨디션('Whether')을 날씨('Weather')로 시각화하여 심리적 압박감 없이 상태를 기록하는 반응형 공감(Responsive Empathy) 프로덕트입니다. 
- **The Atrium (디지털 온실)**: 1px의 딱딱한 선(Border)이나 그리드를 배제하고, 투명한 유리 질감(Glassmorphism)과 여백만으로 공간을 구성.
- **Botanical & Organic**: 둥글둥글한 곡선(최소 1.5rem, 버튼은 원형), 식물에서 영감을 받은 Mint / Coral 등의 편안한 색상.
- **Apple-style Motion**: 모든 이동과 확장에 스프링 물리 효과(stiffness 170, damping 26)를 사용하여 서비스가 유기체처럼 살아 숨 쉬게 함.

## 2. Color Palette & Roles
극강의 대비(Contrast)와 투명도(Opacity)를 활용하여 모던하고 편집 스러운 분위기를 연출합니다. 컬러는 다크모드/라이트모드에 따라 CSS 변수로 유연하게 적용됩니다.

- **Background & Canvas**
  - `--surface` (Base): 온실의 배경 공기층 (Light: Soft Mint `#ebfaec`, Dark: `#0f1718`)
  - `--surface-container` (Card Base): 주요 콘텐츠가 놓이는 영역
  - `--surface-lowest` (Spotlight): 가장 밝게 강조되는 핵심 유리창
- **Text & Content**
  - `--on-surface` (Primary): 절대 완전한 흰색/검정색을 지양하며, 눈의 피로를 던 미세한 색조(Light: `#253228`, Dark: `#e5f1ee`)
  - `--text-muted`: 보조 설명 및 날짜 (불투명도 조절로 구현)
- **Brand & Accent**
  - `--primary` (Signature Teal): 긍정/안정감 전달 (`#006668` / `#52f2f5`)
  - `--secondary` (Muted Teal): 부가적인 선택/상태 토글
  - `--tertiary` (Soft Coral / Red): 경고, 특별한 라이프스타일 요소 (`#9b3d37` / `#ff9f95`)
- **Weather Dynamics**
  - 점수에 따라 뒷배경(Blob) 색상 변화 (Radiant/Sunny -> Foggy -> Rainy -> Stormy)

## 3. Typography Rules
글로벌 접근성과 에디토리얼한 감각을 결합한 듀얼 폰트 시스템을 사용합니다.
- **English/Numerals**: `Public Sans`. 기하학적이고 현대적인 느낌 (Display).
- **Korean**: `Pretendard`. 극강의 가독성과 네오-그로테스크 양식 제공.
- **Typography Detail (Raycast 스타일)**: 어두운 투명 유리(Glassmorphism) 위에서의 가독성을 높이기 위해, Body 텍스트에는 약간 양수의 자간(`letter-spacing: 0.1px`)을 주어 글자들이 숨을 쉬게 합니다.
- **Scale**:
  - `Display / Header`: 사이즈 극대화(3.5rem~), -0.02em의 타이트한 자간으로 대담한 매거진 느낌 부여.
  - `Body`: 1rem 기준, 편안한 1.6의 라인하이트. `font-weight: 500(Medium)`을 베이스라인으로 삼아 무게감 유지.
  - `Label`: 작은 태그는 영문 시 모두 대문자(All-Caps)로 세련되게 처리.

## 4. Component Stylings
모든 컴포넌트는 직각이 금지되어 있으며(최소 `md` ~ `rounded-full`), 투명도를 우선시합니다.
- **Primary Buttons (FAB / Main Action)**: 완전한 알약 형태(`rounded-full`). Signature Gradient(`--button-primary-gradient`) 사용. Hover 시 배경색 전환 대신 투명도 및 내부 그림자 변경, 또는 살짝 확대(`scale(1.04)`).
- **Secondary / Ghost Buttons**: 배경은 `rgba(255,255,255, 0.04)`처럼 투명도에만 의존하며, 절대 Solid 컬러를 넣지 않음. Hover 시 투명도가 0.08으로 진해짐 (Linear 스타일 상태 변환).
- **Glass Panel (Cards)**: `--glass-bg` (ex. `rgba(255,255,255,0.7)`) + `backdrop-filter: blur(20px)`가 필수.
- **Tab Toggles**: 
  - `PrimaryTabToggle`: 뷰 구조 전체가 변할 때. 활성화 시 시그니처 그라데이션 점유.
  - `TabToggle`: 단순 데이터 전환 시. 활성화 시 흰색(또는 밝은) 알약 + 그림자. `layoutId` 모션 필수.

## 5. Layout Principles
- **The "No-Line" Rule**: 1px의 실선 테두리 사용을 엄격히 금지. 구획은 "여백(Spacing)"과 "배경색 명도 변화"로 나눕니다. (접근성상 필요할 때만 불투명도 8% 미만의 Ghost Border 사용).
- **Spacing Rhythm**: 8px 배수 확장. 카드 사이에는 시원하게 파고드는 여백(최소 24px~32px)을 주어 "디지털 온실 내부의 숨 쉴 공간" 확보.
- **Intentional Asymmetry**: 기하학적 요소나 날씨 Blob이 컴포넌트 사이로 슬쩍 보이도록 비대칭 배치 지향.

## 6. Depth & Elevation
단일 레이어의 뿌연 그림자에서 탈피하여 다중 레이어로 깊이감(macOS style)을 부여합니다. 어두운 표면에서도 빛의 반사를 묘사하여 물리적 볼륨을 생성합니다. (globals.css 클래스 참조)

- **Level 1 (Subtle Lift)**: `box-shadow: var(--shadow-level-1)` - 작은 태그, 가벼운 데이터 행.
- **Level 2 (Ring Containment)**: `box-shadow: var(--shadow-level-2)` - 표준 카드레이아웃.
- **Level 3 (Action Button)**: `box-shadow: var(--shadow-level-3)` - 외곽 그림자와 Inset 하이라이트 결합.
- **Level 4 (Floating / Dialog)**: `box-shadow: var(--shadow-level-4)` - 최상단 모달, 드롭다운.

## 7. Do's and Don'ts
- **DO**: Glassmorphism 카드 밑으로 색상(Blob)을 배치해 투명함을 강조하라.
- **DO**: 본문 읽기가 편안하도록 양수 자간(+0.1px)과 Medium(500) 굵기를 기본으로 사용하라.
- **DON'T**: 딱딱한 1px 테두리를 사용해 영역을 가두지 마라(No-Line).
- **DON'T**: 투명도가 없는 순수 Solid 배경의 보조 버튼을 만들지 마라 (Linear-style 투명도 hover를 사용).
- **DON'T**: 날카로운 모서리(4px 이하)를 사용하지 마라. `0.75rem ~ 3rem` 곡률 유지.

## 8. Responsive Behavior (반응형 규칙)
- **모바일 (< 640px)**
  - 네비게이션: 데스크톱 가로형 링크 -> 하단 안전 영역(Safe Area)에 닿은 Floating Bottom Bar 또는 햄버거 메뉴 붕괴.
  - 여백: 외부 컨테이너 여백 16px 축소, 블록 간 Spacing 24px 수준으로 통일.
- **태블릿 (640px ~ 1024px)**
  - 컴포넌트 2단 분할 시작. 사이드바가 존재할 경우 축소 아이콘 모드 전환.
- **데스크톱 (> 1024px)**
  - 카드들이 화면을 꽉 채우지 못하게 Max Width Container 내부에 비치하고, 바깥 공간은 날씨 Blob이 담당하여 여백의 극대화 연출.

## 9. Agent Prompt Guide (마법의 주문)
AI 에이전트(Claude 등)로 새 컴포넌트를 만들 때 아래 문구들을 프롬프트에 활용하세요:

- **버튼 생성 시**: "Primary CTA 버튼(`btn-sanctuary` 아님)을 만들어줘. 완전한 원형(rounded-full)이고 백그라운드 색상은 Primary 그라데이션. 모바일 환경에 적합한 16px 폰트 (Medium 500) 탑재."
- **유리 질감 카드 생성 시**: "유리질감 카드를 만들어줘. 1px 테두리는 생략하고, 클래스는 `glass`를 붙이며 추가로 `shadow-level-2` 그림자를 적용해. 컨텐츠 패딩은 1.5rem이며 모서리는 3rem(xl)이야."
- **섹션/헤더 생성 시**: "온실 테마를 유지하며 섹션 헤더를 그려. Public Sans 폰트로 제목은 32px(Display), 자간은 약간 줄여(-0.02em). 그 위엔 All-Caps로 작은 Label 텍스트를 배치해 줘."
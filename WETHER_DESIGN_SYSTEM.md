# WETHER_DESIGN_SYSTEM.md

📋 Project: Wether (웨더)
"Check Wether it's sunny."
팀원의 컨디션(Whether)을 날씨(Weather)로 시각화하는 인터랙티브 대시보드

## 1. 브랜드 아이덴티티 (Brand Identity)
- **네이밍 원리**: '어떠한지'를 묻는 Whether와 '날씨'를 뜻하는 Weather의 동음이의어 결합.
- **핵심 가치**:
    - 공감(Empathy): 숫자가 아닌 감성적인 날씨 메타포로 상태 전달.
    - 연속성(Continuity): 끊김 없는 레이어 확장과 물리 기반 애니메이션.
    - 직관(Intuition): 한눈에 팀의 '기류'를 파악하는 글랜서블(Glanceable) 디자인.

## 2. 디자인 시스템 (Design System)
### 2.1 컬러 및 질감 (Visuals)
- **Glassmorphism**: 모든 카드는 유리 질감을 기본으로 함.
  `backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.7);`
- **Dynamic Background**: 점수에 따라 배경색이 유기적으로 변화.
    - 100-80점: #FFD700 (Sunny Gold)
    - 80-60점: #C0C0C0 (Cloudy Silver)
    - 60-40점: #60A5FA (Rainy Blue)
    - 40-0점: #4F46E5 (Stormy Indigo)

### 2.2 타이포그래피 (Typography)
- **폰트**: Pretendard 또는 SF Pro (Apple System Font).
- **로고 디테일**: Wether (중의성을 위해 'he' 부분의 투명도를 50%로 조절 권장).

## 3. 핵심 인터랙션 가이드 (Interaction Spec)
### 3.1 모션 원칙 (Apple-style Motion)
- **Spring Physics**: 모든 애니메이션에 탄성 적용.
  `stiffness: 170, damping: 26` (표준 애플 스프링 값)
- **Shared Element (layoutId)**: 리스트의 날씨 아이콘이 상세 바텀 시트의 메인 아이콘으로 '전이'되는 효과.

### 3.2 핵심 UX 패턴
| 패턴 | 설명 | 기술적 키워드 |
| :--- | :--- | :--- |
| **Intro Splash** | 글자가 안개 속에서 나타나듯 Blur와 함께 등장 | `filter: blur`, `stagger` |
| **Bottom Sheet** | 모바일 한 손 조작을 위한 드래그 가능한 상세 레이어 | `drag="y"`, `dragElastic` |
| **Wave Chart** | 점수에 따라 파도의 속도와 높이가 변하는 통계 차트 | `SVG Path`, `Infinity Loop` |

## 4. 기술 스택 (Tech Stack)
- **Framework**: Next.js 14+ (App Router)
- **Animation**: Framer Motion
- **Styling**: Tailwind CSS
- **Feedback**: Web Vibration API (Haptic)

## 6. Tone & Manner (Copywriting)
발음은 똑같지만 의미는 다른 두 단어(Whether vs Weather) 사이의 긴장감을 활용하여 지적인 유머와 직관성을 제공합니다.

| 위치 | 카피라이팅 (Copywriting) | 숨은 의도 |
| :--- | :--- | :--- |
| **메인 대시보드** | "Check Wether it's sunny." | 오늘 팀의 기분이 어떤지 확인하세요. |
| **입력 화면** | "Tell us Wether you're okay." | 당신의 컨디션이 어떤지 알려주세요. |
| **통계 리포트** | "No matter Wether." | 어떤 날씨(기분)든 우리는 함께입니다. |
| **알림/경고** | "Find out Wether the team is storming." | 팀에 폭풍(갈등/저조)이 불고 있는지 확인하세요. |

## 7. 구현 예시 코드 (Wether Wave Chart)

# Design System Strategy: The Vibrant Digital Atrium

## 1. Overview & Creative North Star: "The Chromatic Conservatory"

The Creative North Star for this design system is **The Chromatic Conservatory**. This is not a static interface; it is a living, breathing digital space that mimics the airy, light-filled transparency of a modern glass atrium. We are moving away from the rigid, "boxed-in" layout of traditional SaaS and towards a fluid, expressive environment designed for the Gen Z sensibility.

To achieve this, we break the "template" look through **Intentional Asymmetry** and **Physicality**. Elements shouldn't just sit on a grid; they should float, overlap, and respond with **Contextual Continuity**. By utilizing high-saturation accents against a soft mint foundation, we create a high-contrast editorial experience that feels premium yet energetic. This is "Responsive Empathy" in practice—a UI that feels as vibrant and tactile as the generation it serves.

---

## 2. Colors & Surface Architecture

Our palette balances the calm of "Soft Mint" with the high-octane energy of "Muted Teal" and "Soft Coral."

### The Surface Hierarchy
We move beyond flat backgrounds by using a tiered system of `surface` tokens to define importance.
* **Base Layer:** `surface` (#ebfaec) - The foundational "air" of the atrium.
* **Mid Layer:** `surface_container_low` (#e4f5e5) - Used for grouping secondary content.
* **High Layer:** `surface_container_highest` (#cde2cf) - Reserved for prominent interactive cards.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or tonal transitions. Use `surface_container_low` sections sitting on a `surface` background to create natural separation.

### The "Glass & Gradient" Rule
To capture the "Atrium" essence, floating elements (modals, dropdowns, navigation bars) must utilize **Glassmorphism**.
* **Token:** Use semi-transparent versions of `surface_container_lowest` (#ffffff at 70% opacity) with a `backdrop-filter: blur(20px)`.
* **Signature Gradients:** For primary CTAs and hero moments, use a linear gradient transitioning from `primary` (#006668) to `primary_container` (#52f2f5) at a 135-degree angle. This adds "visual soul" and depth.

---

### 3. Typography: Editorial Kineticism

We utilize a dual-font system to balance global accessibility with high-end personality.

* **English & Numerals:** *Public Sans*. This font provides a geometric, modern "pop" perfect for titles.
* **Korean Text:** *Pretendard*. A clean, highly legible neo-grotesque that ensures "Responsive Empathy" for local users.

**Hierarchy Strategy:**
* **Display & Headline Scale:** Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for high-impact hero sections. These should feel like magazine headlines—bold and unapologetic.
* **Body Scale:** `body-lg` (1rem) using *Public Sans* for English-heavy descriptors ensures a premium, international feel.
* **Label Scale:** `label-md` (0.75rem) should always be in All-Caps for English text to act as a sophisticated "tag" against the playful shapes.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are too "heavy" for a glass atrium. We achieve depth through **Physicality** and **Ambient Light**.

* **The Layering Principle:** Stacking is our primary tool. A `surface_container_lowest` card placed on a `surface_container` section creates a soft, natural lift without a single pixel of shadow.
* **Ambient Shadows:** For elevated components (Floating Action Buttons or Tooltips), use an extra-diffused shadow:
* *Blur:* 40px
* *Spread:* -10px
* *Color:* `on_surface` (#253228) at 6% opacity. This mimics natural light diffusion through frosted glass.
* **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline_variant` (#a2b1a3) at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.

---

## 5. Components: The Pill & The Pattern

All components must adhere to the `ROUND_FULL` (9999px) or `xl` (3rem) corner radius scale to maintain the "Friendly & Energetic" tone.

* **Buttons:**
* **Primary:** Pill-shaped (`full`). Uses the Signature Gradient (Teal to Mint) with `on_primary` text.
* **Secondary:** `surface_container_highest` background with `secondary` (#52f2f5) text. No border.
* **Input Fields:** Use `surface_container_low` as the field background. On focus, the background shifts to `surface_container_lowest` with a subtle `primary` "Ghost Border."
* **Tab Toggle — Two variants:**

  ### `TabToggle` (Neutral)
  Secondary navigation toggle. Use when switching **views of the same data** without changing the user's core interaction mode.
  * Container: `rgba(37,50,40,0.05)` background, `rounded-full`, `p-1`
  * Active tab: white pill (`bg-white`) + `primary` text + `shadow-sm`. Animated with Framer Motion `layoutId`.
  * Inactive tab: `on-surface-variant` text, no background.
  * **When to use:** Time range switches (This Week / Last Week), filter tabs (All / Mine), display mode (List / Grid).
  * **Implementation:** `<TabToggle tabs={[...]} active={value} onChange={fn} />`

  ### `PrimaryTabToggle` (Signature)
  Primary mode switch. Use when the toggle **fundamentally changes the interaction paradigm** on the screen — not just the data shown.
  * Container: `rgba(37,50,40,0.05)` background, `rounded-full`, `p-1.5`
  * Active tab: **Signature Gradient pill** (`linear-gradient(135deg, #2b6867 0%, #52f2f5 100%)`) + `on-primary` (white) text + `rounded-[1.5rem]`. Animated with Framer Motion `layoutId`.
  * Inactive tab: `secondary` (#52f2f5) text, no background.
  * **When to use:** Input mode switches (Quick / Precise), view paradigm switches where the entire UI structure changes.
  * **Implementation:** `<PrimaryTabToggle tabs={[...]} active={value} onChange={fn} />`

  ### Decision guide
  `PrimaryTabToggle` is the default for all toggles in this project — consistent Signature Gradient style across views. Reserve `TabToggle` (neutral) only when a screen already contains a `PrimaryTabToggle` and a secondary, lower-emphasis toggle is also needed.

  Both components live in `src/app/components/ui.tsx` and are exported for use across all pages.
* **FAB (Floating Action Button):** The primary CTA placed `fixed bottom-8` centered. Uses `btn-sanctuary` (Signature Gradient, pill-shaped). Hover: `scale(1.04) y(-3px)`. This is the single most prominent action on the screen — use sparingly, one per view.
* **Cards & Lists:** **Strictly forbid divider lines.** Use `Spacing Scale 4` (1.4rem) to create separation. Content within cards should be grouped using subtle shifts in background color (e.g., a `tertiary_container` header within a `surface_container` card).
* **Playful Geometry:** Use the "Sunshine Yellow" and "Soft Coral" accents to create abstract, geometric patterns (circles, arcs) that peek out from behind containers, reinforcing the "Atrium" view.
* **Glassmorphism Icons:** Icons should be 2D flat shapes with one or two overlapping "frosted" layers at 40% opacity to create a 3D glass-layered effect.

### Niko-Niko Calendar Components
Specialized components for the team mood calendar grid. All live in `src/app/components/ui.tsx`.

* **`SectionHeader`** — 섹션 제목 블록. 원형 아이콘 래퍼(`h-11 w-11 rounded-[1.5rem] rgba(0,102,104,0.09)`) + 제목(`text-2xl~3xl font-black primary`) + 부제목(`text-sm rgba(37,50,40,0.55)`). Props: `icon`, `title`, `subtitle?`.

* **`WeatherCell`** — 날씨 셀. 3가지 상태:
  * `status=null` → 빈 원 (`h-9 w-9 rounded-full rgba(37,50,40,0.07)`)
  * `status=값` → `WEATHER_ICON_MAP` 아이콘 (size 34, `h-12 w-12 rounded-[1.5rem]` 래퍼)
  * `isToday=true` → 래퍼 배경 `rgba(0,102,104,0.08)` + 하단 primary 점
  * Props: `status`, `score?`, `isToday?`

* **`NikoGridHeader`** — 요일+날짜 헤더 행. 오늘 컬럼은 primary 컬러, 나머지 muted. `colTemplate` prop으로 부모 그리드와 정렬 맞춤. Props: `days`, `todayIso`, `colTemplate`.

* **`NikoMemberRow`** — 팀원 한 행. 아바타+이름+서브텍스트 좌측 고정 + WeatherCell 배열. `loading=true` 시 skeleton. Framer Motion `whileHover rgba(0,102,104,0.05)`. Props: `avatar`, `name`, `subtitle?`, `week`, `todayIndex`, `colTemplate`, `loading?`.

* **`MiniStatCard`** — 작은 인라인 통계 카드. `GlassPanel px-4 py-3` 기반, `text-xl font-black` 수치. `StatCard`(대형)와 구분: 헤더 영역 요약 수치 전용. Props: `label`, `value`, `valueColor?` ("primary" | "default").

* **`WeatherLegend`** — 날씨 범례 바. Stormy→Radiant 아이콘+한글 라벨 + "기록 없음" 빈원 고정 포함. Props: `className?`.

---

## 6. Do's and Don'ts

### Do:
* **Use Asymmetry:** Overlap a glass card slightly over a geometric background pattern to create "Contextual Continuity."
* **Embrace White Space:** Use the `Spacing Scale 16` (5.5rem) for section breathing room.
* **Color-Code Context:** Use `secondary` (Muted Teal) for action-oriented flows and `tertiary` (Soft Coral) for lifestyle or social features.

### Don't:
* **Don't use 1px Dividers:** They shatter the illusion of a seamless glass atrium.
* **Don't use Photo Backgrounds:** The system relies on "Visual Style" through flat/3D glass icons and patterns, not realistic photography.
* **Don't use Hard Corners:** Even a 4px radius is too sharp. Stick to `md` (1.5rem) as your absolute minimum.
* **Don't Over-Saturate:** Keep the high-saturation accents (Muted Teal, Yellow, Coral) to less than 10% of the screen real estate; the Soft Mint and Teal must do the heavy lifting to maintain the "Premium" feel.
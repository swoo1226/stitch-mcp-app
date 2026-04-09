# UX Audit: Admin Page & Check-in (Input) Page

**Date**: 2026-04-04
**Scope**: `AdminPageClient.tsx` (2642 lines), `input/page.tsx` (601 lines), invite APIs, api-auth

---

## 1. Admin Page Structure

### Current State
- Single `AdminPageClient.tsx` file (~2642 lines) containing login screen, member management, team/part CRUD, Jira integration, risk alerts, mood input modal, team link sharing, and two invitation flows.
- Two tabs: "팀원" (members) and "팀 · 파트" (teams). `team_admin` sees only the "팀원" tab.
- Mobile navigation is handled via a slide-in drawer from the right.
- ~45 useState hooks in one component. All business logic (fetch, insert, delete, overwrite) lives inline.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| A1 | **Monolithic component** | Major | 2642 lines, 45+ state variables, all in a single component. Makes reasoning, testing, and future changes extremely difficult. |
| A2 | **Tab count insufficient** | Minor | Two tabs for 7+ distinct features. "팀원" tab vertically stacks member list, member add, and member invite — user must scroll to discover all sections. |
| A3 | **Duplicated WEATHER_METAPHORS** | Minor | `WEATHER_METAPHORS` is defined identically in both `AdminPageClient.tsx` (line 31) and `input/page.tsx` (line 23). DRY violation. |
| A4 | **ModalWeatherIcon dead branch** | Minor | `input/page.tsx` line 463-483: two identical `if (label === "Sunny")` branches. The second is unreachable dead code. |

### Recommendations
- **Split AdminPageClient into sub-components**: `AdminMemberList`, `AdminMemberAdd`, `AdminMemberInvite`, `AdminTeamCrud`, `AdminPartCrud`, `AdminTeamLinks`, `AdminJiraImport`, `AdminRiskPanel`, `AdminMoodModal`, `AdminLogin`. Each gets its own file under `src/app/admin/components/`.
- Extract shared state into a custom hook (`useAdminState`) or use React context to avoid prop drilling.
- Extract `WEATHER_METAPHORS` into a shared constant file (e.g., `src/lib/weather.ts`).

---

## 2. Member Management UX

### Current State
- Members displayed as horizontal carousel cards (300px wide, drag-scrollable).
- Each card shows: weather icon/avatar, name, part selector, Jira ticket section, and 5 action buttons at the bottom (add mood, copy link, personal page, reset mood, delete).
- Delete and reset require a two-step confirmation (click -> popup with confirm/cancel).

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| B1 | **5 icon buttons without labels** | Major | Bottom row has 5 round icon-only buttons. On mobile, it's hard to distinguish "copy link" from "personal page" from "reset" without trial-and-error. Title tooltips don't appear on touch devices. |
| B2 | **Carousel not ideal for management** | Major | Horizontal carousel makes comparing multiple members difficult. No search, filter, or sort. With 20+ members, finding a specific person requires slow horizontal scrolling. |
| B3 | **Confirmation popup position** | Minor | Delete/reset confirmation pops up above the button (`bottom-14`). On the first card, this may clip above the viewport on short screens. |
| B4 | **No undo for delete** | Major | `deleteMember()` performs optimistic removal + immediate DB delete. No undo toast or soft-delete mechanism. A misclick on the checkmark destroys the member permanently. |
| B5 | **Inline part selector on card** | Minor | `PortalSelect` for part assignment is on every card. Accidental touches can reassign parts. No confirmation step. |
| B6 | **No bulk actions** | Minor | Cannot select multiple members for bulk delete, bulk mood reset, or bulk link copy. |

### Recommendations
- Replace carousel with a **table/list view** (with optional card view toggle). Add search bar and team/part filter.
- Add text labels below or beside icon buttons, or use a kebab menu (three-dot) for secondary actions (reset, delete).
- Implement soft-delete with undo toast (3-5s window).
- Move part assignment into an edit modal or detail sheet rather than inline on every card.

---

## 3. Jira Integration

### Current State
- Jira ticket snapshots are auto-fetched when the members tab is active.
- Manual refresh button with 30-second rate limiting and clear "X seconds remaining" feedback.
- Each member card shows open ticket count and individual ticket links.
- Jira user search (debounced 350ms) for importing members from Jira.
- Rate limit error message displayed inline.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| C1 | **No Jira connection status indicator** | Minor | Users can't tell if Jira API credentials are configured or if the connection is healthy. Errors only appear after a failed request. |
| C2 | **Jira import team assignment is implicit** | Major | When importing from Jira, the team is determined by `newTeamId` or `DEFAULT_TEAM_ID`. The user may not realize which team imports will go to, especially `team_admin` users. No visible "importing to: Team X" indicator. |
| C3 | **No Jira account linking feedback** | Minor | Member cards show "Jira 계정 정보가 아직 연결되지 않았어요" but provide no way to connect the account from the admin page. |
| C4 | **Jira project key management buried** | Minor | Jira project keys are managed inside the team CRUD accordion on the "팀 · 파트" tab, but Jira tickets appear on the "팀원" tab. The mental model is split. |

### Recommendations
- Add a Jira connection health indicator (green/red dot) in the header or Jira sync button area.
- Show explicit "importing to: [Team Name]" text above the Jira search panel.
- Provide a "Link Jira account" action per member card for members without `jira_account_id`.
- Consider a dedicated "Integrations" tab or section for Jira settings.

---

## 4. Risk Alert UX

### Current State
- "주의 필요 팀원 보기" button fetches combined risk targets (mood score <= 50 + open tickets >= 5 or blocker >= 1).
- Results shown in an expandable panel with CRITICAL/WARNING badges.
- "Teams로 전송" button sends alert to Microsoft Teams webhook.
- Clear feedback messages for edge cases (no targets, no eligible users, success with count).

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| D1 | **Two-step send is confusing** | Minor | User must click "주의 필요 팀원 보기" first, then "Teams로 전송". The first button name doesn't indicate that it's a prerequisite for sending. |
| D2 | **No preview of Teams message** | Minor | Users send the alert without seeing what the Teams message will look like. No "preview message" step. |
| D3 | **No history of sent alerts** | Minor | No log of when alerts were last sent or what they contained. Risk of duplicate sends. |
| D4 | **Risk panel placement** | Minor | Risk panel appears at the top of the members tab content, pushing the member list down. With many risk targets, the member list is pushed far below the fold. |

### Recommendations
- Combine into a single "주의 필요 팀원 확인 & Teams 전송" flow: click once to fetch + show panel, then confirm to send.
- Add a preview of the Teams message content before sending.
- Show "last sent: [timestamp]" next to the send button.
- Consider placing the risk panel in a side sheet or modal instead of inline.

---

## 5. Member Addition vs Jira Import vs Email Invite

### Current State
Three distinct paths for adding team members:
1. **Manual add** ("팀원 추가"): Name + email + team + part -> direct DB insert. No auth account created.
2. **Jira import**: Search Jira users -> select -> bulk insert. Sets `jira_account_id`. No auth account.
3. **Email invite** ("팀원 초대"): Name + email + team + part -> Supabase auth invite email -> creates auth user + user_roles entry.

An explanatory note distinguishes paths 1 and 3.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| E1 | **Three paths create confusion** | Critical | The relationship between "추가" and "초대" is unclear. A manually added member cannot log in. An invited member gets an auth account. Users must read a small help text to understand. |
| E2 | **Jira import doesn't create auth** | Major | Jira-imported members have no auth account. They can't log into the check-in page themselves. This limitation is not communicated. |
| E3 | **Different sections for related actions** | Major | "팀원 추가" and "Jira에서 팀원 검색" are in one accordion. "팀원 초대" is a separate section below. The logical relationship is obscured by layout. |
| E4 | **invite-member vs invite routes use different onConflict** | Minor | `invite-member/route.ts` uses `onConflict: "auth_user_id"` while `invite/route.ts` uses `onConflict: "email"`. Inconsistent upsert strategies could cause subtle bugs. |

### Recommendations
- **Unify into one "팀원 추가" flow** with three modes: Manual, Jira Import, Email Invite. Use a tab or step within a single section.
- Clearly label each mode's outcome: "DB만 등록 (로그인 불가)" vs "초대 이메일 발송 (로그인 가능)".
- After Jira import, offer an optional "초대 이메일도 보내기" action.
- Standardize `onConflict` strategy across invite APIs.

---

## 6. team_admin Experience

### Current State
- `team_admin` sees only the "팀원" tab (the "팀 · 파트" toggle is hidden via conditional tabs).
- Member list is filtered to `managed_team_id`.
- Team/part selectors are locked to the admin's own team.
- "팀장 초대" section is gated behind `isSuperAdmin()` check with a "SUPER ADMIN" badge.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| F1 | **No role label for team_admin** | Minor | `team_admin` sees no indication of what team they're managing or what role they have. The header just says "Clima 관리자". |
| F2 | **Risk alert visible to team_admin** | Minor | "주의 필요 팀원 보기" button and Teams send are visible to `team_admin`, but the underlying API (`combined-risk`) may not be scoped to their team. Unclear if this is intentional. |
| F3 | **team_admin can see all Jira project keys** | Minor | The Jira snapshot fetch collects keys from all teams (line 476-482), not just the admin's managed team. Data leakage risk. |

### Recommendations
- Show "Managing: [Team Name]" or "[Role: 팀장]" in the header.
- Scope risk alerts to `team_admin`'s own team.
- Filter Jira project keys to only the managed team.

---

## 7. Check-in (Input) Page UX

### Current State
- Two input modes: "빠른 선택" (5 weather tiles in 3+2 grid) and "직접 입력" (0-100 range slider).
- Weather icon and Korean label update reactively as score changes.
- Optional "오늘의 한마디" textarea.
- Dynamic background and atmospheric effects respond to score.
- Celebration modal after submission with weather-specific colors and messages.
- Duplicate entry handling: if today's record exists (unique constraint), offers overwrite option.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| G1 | **Tile mode only allows 5 fixed scores** | Minor | Tile mode maps to scores 10/30/50/70/90 only. Users who feel "between" two states have no option without switching to range mode. This is acceptable as a design choice but worth noting. |
| G2 | **Slider handle not visible as interactive** | Minor | The custom slider uses an invisible `<input type="range">` overlaying a decorative handle. Screen readers may work, but the visual handle doesn't look draggable (no grab cursor on the decorative element). |
| G3 | **No loading indicator for initial auth check** | Minor | On page load, `useEffect` resolves the user session. During this time, the submit button is active but will silently submit without a user ID (the non-auth path just shows the celebration modal without saving). |
| G4 | **Overwrite confirmation inline** | Minor | The overwrite prompt appears inline below the textarea, which may be below the fold. User might miss it and think submission failed. |
| G5 | **Dead code: duplicate Sunny branch** | Minor | Lines 463-483 in `input/page.tsx`: identical `if (label === "Sunny")` blocks. Second one is unreachable. |
| G6 | **Celebration modal "나의 예보 보러가기" for unauthenticated users** | Minor | When `resolvedUserId` is null (non-auth path), the link goes to `/personal` without a user param, which may show empty or error content. |

### Recommendations
- Consider adding a "6th tile" (e.g., "Clear Sky" at 100) or allowing tile selection to be fine-tuned with a small +/- nudge.
- Add `cursor: grab` to the visible slider handle.
- Show a brief skeleton/spinner during auth resolution.
- Show the overwrite prompt in a modal or toast instead of inline.
- Remove the dead duplicate `Sunny` branch.
- Hide "나의 예보 보러가기" button when no user is resolved, or show a different CTA (e.g., "홈으로 돌아가기").

---

## 8. Check-in Access: Token vs Login

### Current State
- **Token-based** (`/input?token=xxx`): Looks up `users.access_token`, inserts mood log. No auth required. Anyone with the link can submit.
- **Login-based**: Resolves `linkedUserId` from session. Requires Supabase Auth login.
- **Unauthenticated fallback**: Shows celebration modal but doesn't save to DB.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| H1 | **Token URL is a security risk** | Critical | `access_token` in URL means anyone who obtains the link can submit mood on behalf of another user. Links are shared via clipboard (admin copies them). URLs appear in browser history, server logs, and shared screens. |
| H2 | **No expiration on tokens** | Major | `access_token` never expires. A leaked token remains valid indefinitely. |
| H3 | **Inconsistent experience** | Minor | Token users see no indication of who they are. Login users get session-resolved identity. Both paths look identical visually. |
| H4 | **Silent non-auth submission** | Major | If neither token nor login resolves, the page shows a celebration modal as if submission succeeded, but nothing is saved. No warning. |

### Recommendations
- Migrate to short-lived, single-use or time-limited tokens (e.g., JWT with 24h expiry).
- Add user name display at the top (e.g., "김상우님의 체크인") regardless of auth method.
- Show an explicit error or login prompt instead of the silent non-auth celebration path.
- Long-term: deprecate token-based access in favor of login-only with magic links.

---

## 9. Mobile Admin

### Current State
- Mobile nav drawer (slide from right) with tab navigation + home + logout.
- Viewport detection via `matchMedia("(max-width: 767px)")`.
- Member cards are 300px wide with `max-width: calc(100vw - 3rem)`, scrollable horizontally.
- Mood input modal renders as a `BottomSheet` on mobile, centered modal on desktop.

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| I1 | **Form inputs wrap poorly on narrow screens** | Major | "팀원 추가" form has 5 inputs in a flex-wrap row. On 375px screen, each input takes full width, creating a very long form. Team/part selects are particularly hard to use. |
| I2 | **Carousel drag conflicts with page scroll** | Minor | Custom drag-to-scroll on the member carousel can conflict with vertical scrolling. The `onMouseDown` handler doesn't `preventDefault()` on the initial event, but subsequent `onMouseMove` does, which can feel jerky. |
| I3 | **No mobile-optimized bulk actions** | Minor | All member management requires card-by-card interaction. Selecting multiple members on mobile is impossible. |
| I4 | **Risk panel takes excessive mobile space** | Minor | The risk panel with multiple target cards can fill the entire mobile viewport, making it hard to scroll past to the member list. |

### Recommendations
- Collapse form inputs into a multi-step wizard or bottom sheet on mobile.
- Consider replacing custom drag carousel with CSS `scroll-snap` only (remove JS drag handlers).
- Add a floating "collapse" button on the risk panel or make it a bottom sheet on mobile.

---

## 10. AdminPageClient Code Quality

### Current State
- **2642 lines** in a single file.
- **45+ useState hooks** — state management is entirely local.
- **No TypeScript strict mode issues visible**, but heavy use of `as unknown as Member[]` casts.
- All API calls are inline `async function`s inside the component.
- Shared `confirmDeleteId` state is reused across members, teams, and parts — only one confirm dialog can be open at a time, which works but is fragile.
- SVG icons are inline rather than componentized (except a few like `PlusIcon`, `LinkIcon`).

### Issues

| # | Issue | Severity | Detail |
|---|-------|----------|--------|
| J1 | **File size / complexity** | Critical | 2642 lines violates any reasonable single-file limit. Cognitive load is extreme. |
| J2 | **State explosion** | Major | 45+ useState hooks with complex interdependencies. No state machine, no reducer, no context. |
| J3 | **Inline SVGs** | Minor | Multiple inline SVG definitions (close icon, home icon, etc.) repeated across the file. |
| J4 | **Unsafe type casting** | Minor | `normalized as unknown as Member[]` (line 449) bypasses type checking. |
| J5 | **No error boundaries** | Minor | Any runtime error in this component crashes the entire admin page. |
| J6 | **Optimistic updates without rollback** | Minor | `deleteMember()` removes from state immediately but doesn't restore on DB error. `resetTodayMood()` does restore on error (line 666), showing inconsistency. |

### Recommendations
- **Phase 1 (Quick Win)**: Extract sub-components (login, member list, team CRUD, etc.) into separate files. Extract inline SVGs into icon components.
- **Phase 2**: Introduce `useReducer` or a lightweight state manager for admin state. Extract API calls into `src/lib/admin-api.ts`.
- **Phase 3**: Add error boundaries. Standardize optimistic update patterns with rollback.

---

## Summary: Quick Wins vs Long-term

### Quick Wins (1-2 days each)
1. Remove dead code: duplicate `Sunny` branch in `input/page.tsx` (G5)
2. Extract `WEATHER_METAPHORS` to shared constant (A3)
3. Add user name display on check-in page (H3)
4. Add role/team label in admin header for `team_admin` (F1)
5. Fix silent non-auth celebration — show login prompt instead (H4)
6. Add "importing to: [Team Name]" label in Jira import (C2)
7. Hide "나의 예보 보러가기" when no resolved user (G6)

### Medium-term (1-2 weeks)
1. Split `AdminPageClient.tsx` into ~10 sub-components (J1, A1)
2. Replace member carousel with searchable list/table view (B2)
3. Unify three member addition paths into one section with mode tabs (E1)
4. Add text labels to member card action buttons (B1)
5. Implement soft-delete with undo toast for members (B4)
6. Standardize optimistic updates with rollback (J6)

### Long-term (1+ months)
1. Migrate token-based check-in to time-limited tokens or login-only (H1, H2)
2. Introduce state management solution (useReducer/context) for admin (J2)
3. Add dedicated "Integrations" tab for Jira settings (C4)
4. Add risk alert history/log (D3)
5. Mobile-optimized admin forms with multi-step wizard (I1)
6. Extract admin API layer with proper error handling (J2)

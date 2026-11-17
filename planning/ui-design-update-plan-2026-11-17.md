# Forge — UI and design update plan

Date: 17 November 2026
Status: **Proposal only.** Nothing here is implemented. Ask before any code change, commit or deployment.

This plan builds on [the UI interface roadmap](ui-interface-roadmap.md). Batches 1–3 there are done. Batches 4 (editors), 5 (tracking screens) and 6 (consistency and device acceptance) are still open, and this plan folds them in instead of starting a new redesign. The direction stays the same: Apple-inspired neutral surfaces, system type, blue accent, light and dark themes, and **the existing button design is kept**. [`planning/design.md`](design.md), the Raycast style reference, is legacy and is not used here.

## How this was reviewed

- Read `src/app/App.tsx`, `src/app/navigation.ts`, all `src/features/*` pages, the shared components and the four stylesheets (`tokens.css`, `global.css`, `apple.css`, `motion.css`).
- Read `docs/ui-redesign.md`, `docs/releases/` (up to `2026-11-17-split-export-add-exercise.md`) and the e2e specs, especially `ui-redesign.spec.ts` and `ui-next-update.spec.ts`.
- Ran `node scripts/start-workout-test.mjs` on port 4180 (local storage only, cloud off) and looked at it at 1280 × 900 and 390 × 844 in the dark theme.

**Limits.** The local test storage had one program and one in-progress workout, with no completed sessions, body entries or diary entries. So History, Progress, Body and Nutrition were seen only in their empty states. The light theme, tablet widths and the populated tracking screens were not reviewed visually. I didn't add test data, so the existing in-progress workout stayed untouched. Screenshots often timed out because the PC was busy, so the "slow entrance" finding (P4) needs confirming on a quiet machine.

## Current problems and inconsistencies

Priority: **High** means it hurts a common flow or is a visible bug. **Medium** means a clear polish gap. **Low** means cleanup.

### Shell and navigation

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| S1 | Every page header repeats the eyebrow "Your personal training space" (already in the sidebar brand) plus a description. On a 390px phone the header, theme switch and "Stored locally" pill take about 130px before any content. | `App.tsx` page header (`.page-header`, `.page-title`); all routes | Medium |
| S2 | The three-button theme switch sits in the header of every page. On phones its buttons are 30 × 32px, below the 44px touch target used elsewhere (the Programs export button is 44 × 44). | `App.tsx` `header-tools`; `apple.css:48-50, 386-387`; `global.css:618-619` | Medium |
| S3 | The nav order differs between layouts: desktop is Today, Programs, Workout…, while mobile is Today, Workout, Programs, Progress, More. Mobile puts Workout first, which may be intended, but the two orders are inconsistent. | `navigation.ts:16` | Low (question) |
| S4 | Nothing shows that a workout is running when you're on another tab. You have to open Today or Workout to see "In progress". | `App.tsx` nav buttons; `.nav-item` | Medium |
| S5 | Some route descriptions are wrong. Settings says "Control alerts, units, and your local data", but there is no units setting. Body says "…and nutrition estimates" while targets live on Body and the diary on Nutrition, which is unclear. | `navigation.ts:11, 13` | Low |
| S6 | `App.tsx` has an unreachable fallback, "Coming in the next build", left over from scaffolding. | `App.tsx` final `empty-stage` branch | Low |

### Motion

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| P4 | Under load, a page stayed blank (header and cards invisible) for more than 2s after switching tab at 390px (Today, Programs). The nav highlight stayed on the old tab during that time. The entrance runs `.motion-enter` on up to 5 surfaces with a 40ms stagger, and the content starts invisible. On a slow phone this reads as "the app is empty". **Update (Chunk 1 check):** this was most likely caused by the in-app browser pane being hidden. In that state the page reported itself visible, but the entrance animation sat at time 0 with the header and cards at opacity 0 after 1.5s, because no frames were drawn. Real users probably don't see this. It does show a fragility, though: if animation frames stall (a background webview, a frozen renderer), content stays invisible because the entrance starts from opacity 0. | `components/PageScene.tsx`; `motion.css` (`.motion-enter`); `NavigationHighlight.tsx` | Low (fragility only) |

### Today

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| T1 | The "This week" tile says "0" and then "0 sessions this week", and the "Programs" tile says "1" and then the program name. Each label just repeats its number. | `features/today/TodayPage.tsx:73` (`stat-block`) | Low |

### Workout

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| W1 | **Bug:** the elapsed timer has no hours, so it showed `134:41` for a 2h 14m session. | `hooks/useElapsedTime.ts:24`; shown by `WorkoutPage.tsx:27-29` | High |
| W2 | At 390px "Watch technique" shrinks to a bare play icon next to the `⋯` menu. It has an aria-label, but the icon alone is hard to read and the tap target looks small. | `components/ExerciseTechnique.tsx:51`; workout header CSS in `apple.css` | Low |
| W3 | The helper "Drafts save on this device as you type…" appears under every set and pushes Add/Replace exercise down on phones. | `features/workout/GuidedWorkout.tsx` | Low |

### Programs

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| G1 | On program cards the destructive Delete is a red-filled icon in the same row as Edit, Duplicate and Export. That puts the strongest colour on the least common action, right next to the new export button. | `features/programs/ProgramsPage.tsx:66` (`icon-button danger-icon`) | Medium |
| G2 | Long editor forms are still open from Batch 4: two large muscle grids, and save/cancel placement. | `ProgramForm.tsx`, `WorkoutTemplateForm.tsx`, `ExerciseContributionForm.tsx`, `ProgramVolumeSettings.tsx` | Medium (Batch 4) |
| G3 | At 1280px the search field is narrow and floats away from Create program. The split library chips and the 4-templates badge use a different chip style from the segmented controls. | `ProgramsPage.tsx`, `TrainingLibrary.tsx` | Low |

### Tracking screens

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| H1 | The History and Progress empty states have no action. The roadmap says each empty state should offer one relevant action, as Body already does with Log weight and Set up profile. | `history/HistoryPage.tsx:23`; `progress/ProgressPage.tsx:32` | Medium |
| H2 | Progress shows its From/Through range, warm-up toggle and Training/Muscles switch even when there is no data. That's a lot of controls above an empty state. | `progress/ProgressPage.tsx` | Low |
| N1 | Nutrition shows the date twice, as the heading "Tuesday, November 17" and as the date input `11/17/2026`. On phones the toolbar (heading, date row, then Today, Create food and My foods) takes most of the first screen before the totals. | `nutrition/NutritionPage.tsx:48` | Medium |
| N2 | Each meal card repeats a "Meal" eyebrow above Breakfast, Lunch, Dinner and Snack. "Add your first food" also appears four times on an empty day. | `nutrition/NutritionPage.tsx:58` | Low |
| N3 | The "No nutrition target…" note and "Set manual target" float between the totals and the meals instead of belonging to the totals card. | `NutritionPage.tsx`, `MacroSummary.tsx` | Low |
| B1 | Batch 5 is still open for Body, History and Progress: hierarchy, chart legends and units, and date grouping. These need review with real data. | `features/body/*`, `history/*`, `progress/*`, `components/TrendChart.tsx`, `TrendPlot.tsx` | Medium (Batch 5) |

### Settings

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| C1 | The workout preferences are toggles but need an explicit "Save workout preferences" button, while other immediate controls (theme, segmented controls) apply at once. The App updates card sits above preferences without a section heading like the others. | `settings/WorkoutPreferencesForm.tsx`; `App.tsx` settings branch; `components/AppUpdate.tsx` | Low |

### Styling system (Batch 6)

| # | Problem | Where | Priority |
| --- | --- | --- | --- |
| D1 | Two overlapping stylesheets: `apple.css` restyles 178 selectors that `global.css` also defines (85 KB + 38 KB). So a control's final look depends on cascade order, which is the "one authoritative definition" item in Batch 6. | `styles/global.css`, `styles/apple.css` | Medium |
| D2 | There's no type scale. About 40 distinct `font-size` values are mixed between px and rem, with many px sizes of 10–13px (29 rules at 10/11px or .625rem). Px sizes ignore the user's browser font-size setting. | `global.css`, `apple.css` | Medium |
| D3 | Radii are mostly ad hoc. Besides the four radius tokens there are about 20 literal values (6–22px, 99px, 999px, 50%). | `global.css`, `apple.css` | Low |
| D4 | Breakpoints vary: 380, 600, 640, 800, 880, 960, 1060 and 1100px. Some media queries are written `@media(max-width…)` without a space, which suggests copy-paste drift. JS uses 640px (`App.tsx` `mobileQuery`). | all stylesheets | Low |
| D5 | Colours are already tokenized (one hex outside `tokens.css`). That's good and should be kept. | `tokens.css` | — |

## Proposed changes, in shippable chunks

Each chunk is a separate PR or release and can be reviewed on its own. The order is the recommendation.

### Chunk 1 — Quick fixes (small, low risk)

Fixes W1, S5, S6, T1, H1, N2.

- Format elapsed time as `h:mm:ss` once it passes 59:59. Keep the stable tabular digits.
- Correct the Settings and Body route descriptions.
- Remove the unreachable "Coming in the next build" branch.
- Today stat tiles: replace the repeated label with useful context, for example "0 of 3 planned" or the last session date, from data already loaded.
- Add one action to the empty states: History gets "Go to Workout" (or "Start Push" when a program exists) and Progress gets the same. Use the existing `primary-action`/`secondary-action` buttons.
- Nutrition: drop the per-card "Meal" eyebrow. Keep a single empty hint per card.

**Files:** `hooks/useElapsedTime.ts`, `app/navigation.ts`, `app/App.tsx`, `features/today/TodayPage.tsx`, `features/history/HistoryPage.tsx`, `features/progress/ProgressPage.tsx`, `features/nutrition/NutritionPage.tsx`.
**Risks:** Very low. Copy changes can break text-based selectors.
**Tests:** `timer-cadence.test.tsx` and `workout-page.test.tsx` (add an over-one-hour case), `today-page.test.tsx`, `history-page.test.tsx`, `progress-page.test.tsx`, `nutrition-page.test.tsx`, `app-route.test.tsx`; e2e `journal-improvements.spec.ts` and `body-nutrition.spec.ts` if they match those strings.
**Screenshots:** `artifacts/today-dark.png`, `artifacts/nutrition-mobile.png`, `output/playwright/journal-history-mobile.png`.

### Chunk 2 — Page entrance and nav highlight on slow devices (investigate, then fix)

Fixes P4. **Moved down in priority:** the Chunk 1 check suggests the blank pages came from the hidden in-app browser pane, so do Chunk 3 first and keep this as a robustness fix (start entrances from a visible state).

- First, reproduce with Playwright CPU throttling (CDP `Emulation.setCPUThrottlingRate` 4–6×) on 390px Today and Programs. Measure the time until the main surfaces have opacity 1.
- If confirmed: start entrances from a visible state (for example opacity .6 → 1 with a small translate), cap the total stagger (5 × 40ms already, so check the duration and fill mode), and skip the entrance when the first frame is late (for example if `performance.now()` since navigation is over 100ms) or when the route was opened by keyboard. Make sure the nav highlight never lags behind `aria-current`.

**Files:** `components/PageScene.tsx`, `styles/motion.css`, `components/NavigationHighlight.tsx`.
**Risks:** Medium. The motion behaviour is covered by detailed tests: reduced motion, no replay on edits, no transform kept for nested dialogs.
**Tests:** `ui-redesign.spec.ts` › "effects respect reduced motion…" and "navigation highlight follows rapid destination changes…". Add a throttled-CPU check that content is visible within 300ms.
**Screenshots:** none change in steady state.

### Chunk 3 — Shell and header on phones

Fixes S1, S2, S4, and S3 depending on your answer.

- On ≤640px, hide the header eyebrow and description. Keep the H1 and a single compact status dot.
- Move the theme switch into Settings, under a new "Appearance" section, on all widths. Or keep it in the desktop header only (see open questions). Any theme control that stays should have 44px targets.
- Add a small "in progress" dot or badge to the Workout nav item (desktop sidebar and mobile dock) while a session has no `completedAt`. Include accessible text such as "Workout, in progress".
- If you want one nav order, apply it in `navigation.ts`.

**Files:** `app/App.tsx`, `app/navigation.ts`, `components/ThemeControl.tsx`, `features/settings/*` (new Appearance section), `styles/apple.css`, `styles/global.css`.
**Risks:** Medium. **Five e2e specs click the header "Light theme" / "Dark theme" buttons**: `ui-redesign.spec.ts`, `ui-next-update.spec.ts`, `body-nutrition.spec.ts`, `workout-design.spec.ts` and `workout-replacement-layout.spec.ts`. They would need a shared helper that sets `localStorage['forge:theme']` (already used in `ui-redesign.spec.ts:7`) or opens Settings. The `meta[name=theme-color]` sync must keep working.
**Tests:** those five specs, plus `ui-redesign.spec.ts` "all destinations fit…" and "dashboard survives large text…", `mobile-timer.spec.ts`, `workout-editing.spec.ts` (mobile nav), and `app-route.test.tsx` and `unsaved-navigation.test.tsx` (nav buttons).
**Screenshots:** every `output/playwright/ui-redesign-{width}-{theme}.png`, `ui-next-today-*`, `artifacts/*-mobile.png`.

### Chunk 4 — Programs page and editors (roadmap Batch 4)

Fixes G1, G2 and G3.

- Program card: keep Edit as the visible primary action. Put Duplicate and Export beside it as neutral icon buttons. Move Delete into a `⋯` overflow menu, or show it as a neutral icon that turns red only on hover and focus. It keeps its confirmation dialog.
- Line up search and Create program on one row at desktop width. Use the shared chip and segmented style for the split-library filters.
- Batch 4 as written in the roadmap: grouped sections in the program editor (identity, workouts, schedule, targets), exercise basics kept apart from the contribution grids, consistent row summaries, sticky save/cancel, and an unsaved indicator only when the form differs from what was saved.

**Files:** `features/programs/ProgramsPage.tsx`, `ProgramForm.tsx`, `WorkoutTemplateForm.tsx`, `ExerciseContributionForm.tsx`, `ProgramVolumeSettings.tsx`, `ProgramMuscleSummary.tsx`, `TrainingLibrary.tsx`, styles.
**Risks:** Medium to high. The export button shipped today. The editor holds drafts with unsaved-change guards, conflict handling and validation focus. **Wait until `feature/split-export-add-exercise` is committed or merged**, because its uncommitted fixes touch nearby workout and program code.
**Tests:** `program-form.test.tsx`, `program-export.test.tsx`, `training-library.test.tsx` (it already needs a 20s timeout), `program-muscle-volume.test.tsx`, `exercise-library-controls.test.tsx`, `edit-conflicts.test.tsx`, `form-validation-ui.test.tsx`, `unsaved-navigation.test.tsx`; e2e `muscle-volume.spec.ts`, `selection-controls.spec.ts`, `unsaved-edits.spec.ts`.
**Screenshots:** `artifacts/editor-{light,dark,mobile}.png`, `artifacts/training-library-mobile.png`, `artifacts/muscle-volume-*.png`.

### Chunk 5 — Tracking screens (roadmap Batch 5)

Fixes N1, N3, H2 and B1, plus the rest of Batch 5.

- Nutrition: a single date control in which the readable date is the button that opens the picker, with prev and next arrows. Put Today, Create food and My foods in one compact row or a `⋯` menu on phones. Move the "no target" note and "Set manual target" into the totals card.
- Progress: hide the range and warm-up controls until there is data, keeping the Training/Muscles switch.
- History, Body and Progress with real data: date groups, compact session facts, chart legends and units, and latest/trend/target hierarchy on Body, as Batch 5 already describes.
- Create one **synthetic seed** (for example a `?seed=demo` dev-only flag in `start-workout-test.mjs`, or a fixture JSON imported through Settings) so these screens can be reviewed with data and without personal records.

**Files:** `features/nutrition/NutritionPage.tsx`, `MacroSummary.tsx`, `features/progress/*`, `features/history/*`, `features/body/*`, `components/TrendChart.tsx`, `TrendPlot.tsx`, styles, and possibly `scripts/start-workout-test.mjs`.
**Risks:** Medium. Nutrition's header already had a layout regression at intermediate widths (see the 11 October entry in `docs/ui-redesign.md`). Unknown macros must never appear as zero, and local-date rules must not change.
**Tests:** `nutrition-page.test.tsx`, `nutrition-limits.test.tsx`, `diary-edit-copy.test.tsx`, `my-foods.test.tsx`, `body-page.test.tsx`, `history-page.test.tsx`, `history-correction.test.tsx`, `journal-details.test.tsx`, `progress-page.test.tsx`, `analytics-range.test.tsx`, `muscle-summary-page.test.tsx`, `current-day.test.tsx`; e2e `nutrition-header-layout.spec.ts`, `body-nutrition.spec.ts`, `journal-improvements.spec.ts`, `muscle-volume.spec.ts`.
**Screenshots:** `artifacts/nutrition-mobile.png`, `artifacts/progress-dark.png`, `artifacts/food-selection-mobile.png`, `output/playwright/nutrition-header-1110-*.png`, `journal-*.png`.

### Chunk 6 — Workout screen polish (small, after the current branch lands)

Fixes W2, W3 and C1.

- Workout: on phones, show "Technique" as a short labelled pill instead of a bare icon. Show the drafts helper once per session, or as a quiet line under the progress bar, instead of under every set.
- Settings: make workout preference toggles save immediately, using the same pattern as theme, with a toast on success and the value restored on failure. Or keep the button but give App updates a section heading like the other cards.

**Files:** `components/ExerciseTechnique.tsx`, `features/workout/GuidedWorkout.tsx`, `features/settings/WorkoutPreferencesForm.tsx`, `App.tsx`, styles.
**Risks:** `GuidedWorkout.tsx` has **uncommitted changes on the current branch**, so wait for them to be committed. Saving immediately changes save semantics and needs failure handling.
**Tests:** `workout-page.test.tsx`, `exercise-technique.test.tsx`, `workout-preferences.test.tsx`, `workout-add-exercise.test.tsx`; e2e `workout-design.spec.ts`, `exercise-technique.spec.ts`, `mobile-timer.spec.ts`, `workout-exercise-controls.spec.ts`.
**Screenshots:** `artifacts/workout-{light,dark,mobile}.png`, `output/playwright/technique-*.png`.

### Chunk 7 — Styling system consolidation (roadmap Batch 6, last)

Fixes D1–D4.

- Add type tokens to `tokens.css`: about 7 rem steps, for example caption .75, footnote .8125, body .9375/1, title-3 1.25, title-2 1.625, title-1 clamp, and display. Map the 40 existing sizes onto them, with nothing under .75rem for readable text.
- Add radius tokens for pill and circle. Replace literal radii.
- Settle on breakpoints of 380, 640 and 1100px, plus `hover`/`pointer` queries, and align `App.tsx`'s `mobileQuery`.
- Merge the `apple.css` overrides into the base rules in `global.css` one component at a time (nav, header, cards, buttons, forms, dialogs, workout, nutrition…), deleting the overridden declarations. No visual change is intended.
- Write the shared-control state sheet (default, hover, pressed, focus, selected, disabled, empty, loading, error) into `docs/ui-redesign.md`, as Batch 6 asks.

**Files:** `styles/tokens.css`, `global.css`, `apple.css`, `motion.css`, `app/App.tsx`, `docs/ui-redesign.md`.
**Risks:** High, because one cascade change can affect every screen and nothing catches pixel drift (see open question 4). Do it in small per-component commits, comparing before/after screenshots for each.
**Tests:** the whole e2e suite (`pnpm test:e2e`), especially `ui-redesign.spec.ts` (all destinations × widths × themes, large text, forced colours), `selection-controls.spec.ts`, `nutrition-header-layout.spec.ts` and `workout-replacement-layout.spec.ts`. Unit tests are mostly unaffected.
**Screenshots:** all of them. Capture a full "before" set first.

### Not in this plan

Physical iOS/Android acceptance (software keyboard, safe areas, installed PWA) stays the Batch 6 device pass. It needs your phones and should be recorded separately from emulation. The roadmap's "later ideas" (configurable dashboard, quick-action search, gestures) remain out of scope.

## Verification for every chunk

`corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm build`, `corepack pnpm test:run` (use `--testTimeout=20000` if the PC is busy), `corepack pnpm test:e2e` after a build (needs the pnpm shim on PATH), and a look at 390px and 1280px in both themes with the test server. Update `docs/ui-redesign.md` and add a release note. No deployment without your go-ahead.

## Decisions (answered 17 November 2026)

1. **Theme switch:** move it into a new Settings → Appearance section and remove it from every page header (Chunk 3). The five e2e specs that click the header buttons get a shared helper that sets `localStorage['forge:theme']`.
2. **Nav order:** put Workout second on both layouts. The desktop sidebar becomes Today, Workout, Programs, History, Progress, Body, Nutrition, Settings, matching the phone dock (Chunk 3).
3. **Program card Delete:** move it into a `⋯` overflow menu. It keeps its confirmation dialog (Chunk 4).
4. **Visual baselines:** yes. Add `toHaveScreenshot` baselines for a few key screens before the CSS consolidation in Chunk 7, and update them only for intended changes.
5. **Base branch:** commit and merge `feature/split-export-add-exercise` first (with your go-ahead), then start each UI branch from `main`.
6. **Workout preferences:** each toggle saves when changed, shows a toast, and goes back to its old value if the save fails. The Save button is removed (Chunk 6).
7. **Legacy reference:** add an "archived" note at the top of `planning/design.md` that points to `docs/ui-redesign.md`. This can go with Chunk 1.

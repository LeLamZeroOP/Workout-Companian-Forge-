# Forge — next UI, design and interface updates

Date: 9 October 2026  
Status: In progress. Today refinements and workout feedback/completion are implemented locally. The editor and tracking batches remain planned; validation review continues with those screens. No deployment is included.

## First local update — 9 October 2026

Today now leads with the Start/Resume/Create action. The full exercise preview expands on demand, with real exercise and planned-set counts; weekly activity follows the training panel. Body readings include their recorded local date. The existing button design is retained.

Short menus support typed prefixes and repeated-letter cycling, and only one menu stays open. Placement follows viewport changes, including visual-viewport events, and keeps focused options within the list. Confirmation, food and workout dialogs share headers, close controls, focus trapping/restoration, background scroll locking and internal scrolling. Workout detail errors appear beside their fields and focus the first invalid input.

The first update left dialog/menu exits, broader validation, daily-card refinements and workout completion for the next slice. That slice is described below. Physical software-keyboard testing remains in Batch 6; desktop resizing is not a substitute for it.

Verified locally: build and lint passed; 305 unit tests and 51 Chromium browser tests passed. The final unit run used two workers and a 15-second per-test limit after intermittent runner timeouts; the assertions were unchanged. See [the design document](../docs/ui-redesign.md) for the commands and verification boundaries.

## Second local update — 9 October 2026

Menus and occasional dialogs now fade out briefly for pointer use. Closed surfaces immediately become inert and leave the focus/scrolling contract; reopening or switching editors during exit remains usable. Keyboard and reduced-motion dismissal is immediate.

Body measurements/profile, nutrition targets, custom foods, food amounts, diary edits, and program/exercise inputs have inline errors linked to their controls. Submitted errors focus the first affected field and open collapsed measurement/target sections. Structural program errors retain a focusable summary. Correction and recovery forms still need their later screen review.

Today has recorded-value context, a small weight preview from daily measurements and a calorie-target fill that preserves actual totals and unknown macros. Tablet overview spacing and mobile metric density are refined. Workout fills animate without delaying accessible values; rest and entry states are clearer. Accepted finishes show working-set count, duration, recorded volume, local/cloud save status, and history/next-session actions. A rejected finish keeps its review open; the summary also waits for the authoritative completed record.

Verified locally: build, lint and whitespace checks passed; 319 unit tests and 54 Chromium browser tests passed. Synthetic light/dark previews and the precise commands are recorded in [the design document](../docs/ui-redesign.md). Physical-device acceptance remains open.

## Direction

Make Forge feel polished and responsive while keeping the next training action easy to find. Continue the current Apple-inspired system: neutral surfaces, system typography, a blue accent, soft depth, and light/dark themes. Preserve the existing button design the user likes. Extend the recent motion and selection work rather than starting another visual redesign.

The current design and completed changes are recorded in [the interface design document](../docs/ui-redesign.md). The older [product roadmap](../docs/superpowers/specs/2026-09-26-forge-next-updates-roadmap.md) remains context for larger features; its earlier visual observations are not the current backlog. `planning/design.md` is an older style reference, not the direction for these updates.

## Already completed

- App-wide typography, surfaces, navigation, and light/dark theme styling.
- Card entrances, hover lighting, button feedback, and moving navigation highlights.
- Shared styled dropdowns and segmented controls with selected checkmarks and sliding highlights.
- Repeated-arrow focus bug fixed; mobile menus avoid the navigation dock and preserve focus.
- Redundant chest-emphasis and contributing-exercise breakdowns removed from the planned muscle summary.
- Keyboard and reduced-motion behavior retained. Baseline automated browser suite: 49 passing tests; the first roadmap update extends it to 51.

These items are the baseline, not new features to implement again. The current changes have been verified locally; physical-device acceptance and publishing are separate work.

## Delivery order

Each batch should be reviewable on its own. Priorities describe order, not dates or promised delivery times.

| Batch | Priority | Focus | Visible outcome |
| --- | --- | --- | --- |
| 1 | In progress | Controls, menus and dialogs | Predictable overlays, better keyboard selection, and comfortable mobile editing. |
| 2 | Implemented locally | Today and daily hierarchy | A clearer next action with useful supporting information. |
| 3 | Implemented locally | Workout feedback and completion | Clear transitions between logging, resting and finishing. |
| 4 | Following | Program and exercise editors | Less visual overload in long forms and easier review before saving. |
| 5 | Following | History, progress, body and nutrition | Clearer summaries, filters and relationships between numbers. |
| 6 | Final pass | Consistency and device acceptance | One coherent interface across screens, themes and input methods. |

## Batch 1 — controls, menus and dialogs

**Relevant files:** `src/components/SelectControl.tsx`, `SegmentedControl.tsx`, `ChoiceGroup.tsx`, `ConfirmDialog.tsx`; `src/features/workout/WorkoutEditDialog.tsx`; `src/features/nutrition/FoodEntryDialog.tsx`; `src/styles/apple.css`, `motion.css`.

- [x] Add type-to-select to short, non-searchable menus. Preserve searchable menus for large lists. Repeated characters should cycle matching options; Escape closes only the active menu and returns focus to its trigger.
- [x] Add viewport-aware overlay placement and visual-viewport event handling. Keep the active option visible without moving the page; reserve space for navigation and safe areas. Desktop resize verified; physical software-keyboard acceptance remains open in Batch 6.
- [x] Standardize dialog headers, close controls, action placement and internal scrolling. On short phones, keep actions reachable while editing. Consolidate repeated focus/dismissal behavior into a shared dialog surface after mapping the existing confirmation, food and workout requirements.
- [x] Add an exit transition to occasional dialogs and menus while preserving immediate state changes. Focus restoration and dismissal must still complete when animation is disabled or interrupted.
- [ ] Make validation consistent across remaining forms: an inline message beside the affected field, an explicit invalid state, and focus on the first invalid field after a rejected submission. Keep typed values available for correction. Workout details now use this behavior.

**Acceptance:** Menus remain within usable viewport bounds at 320px width and 375×480; long option lists scroll independently; arrow keys, typeahead, Tab and Escape work; opening one menu closes the previous one; dialog actions remain reachable with large text. Verify the software keyboard on physical phones before describing that behavior as complete.

**Verification:** Extend `tests/features/select-control.test.tsx`, `tests/e2e/selection-controls.spec.ts` and the existing dialog/editing tests. Cover cancel, save rejection, resize, nested menu dismissal, focus restoration and reduced motion.

## Batch 2 — Today and daily hierarchy

**Relevant files:** `src/features/today/TodayPage.tsx`; `src/domain/trainingOverview.ts`; shared surface styles.

- [x] Refine the three Today states: first use, a planned workout ready to start, and an active workout ready to resume. Each state should have one unmistakable primary action.
- [x] Make the session preview more compact on phones: program/workout choice, exercise preview and action remain together; supporting copy should not push the action unnecessarily far down the page.
- [x] Keep the activity strip useful in empty and populated states. Its dates and completed-session counts must continue to use the existing local-date rules.
- [x] Improve the daily body/nutrition cards with a clear value, context and next action. Use recorded measurements and diary entries; represent missing information explicitly.
- [x] Refine tablet spacing and the balance between the training panel and overview. Check long program names, multiple programs and empty libraries.

**Acceptance:** A user can identify Start/Resume/Create immediately. Supporting cards do not compete with the training action. Nothing is hidden behind mobile navigation. Empty, active and recently completed states use real records and retain the existing next-workout suggestion behavior.

**Verification:** Extend `tests/features/today-page.test.tsx` and the responsive Today/workout browser checks with all three states. Review screenshots in both themes at 320, 375, 768 and 1440px.

## Batch 3 — workout feedback and completion

**Relevant files:** `src/features/workout/GuidedWorkout.tsx`, `RestTimer.tsx`, `SetValueInput.tsx`, `WorkoutPage.tsx`; shared feedback components.

- [x] Strengthen the visual distinction between entering a set, resting, and being ready for the next set. Keep the current exercise and upcoming action visible in each state.
- [x] Add a smooth visual fill for workout completion while preserving the accessible progress value and immediate data updates. Timer digits and editable weight/repetition values remain stable.
- [x] Improve rest completion feedback with a short state transition and a clear Next set action. Keep the existing sound, vibration and wake-lock preferences; avoid promising alerts while the browser is suspended.
- [x] Add a concise completion summary showing the finished workout, valid completed sets, duration and recorded volume using existing metric definitions. Present it only after the finish callback accepts the operation; pending cloud sync remains visibly pending.
- [x] Use one brief completion accent or check animation for this occasional milestone. Provide a clear route to history and the next training session without changing the finish/save workflow.

**Acceptance:** Failed set saves do not advance progress or start rest. Failed finishing keeps the workout available for retry. Completing early excludes unfinished sets from totals. Keyboard focus lands on the next useful control; reduced motion removes movement. The new summary must not imply server confirmation for a queued cloud mutation.

**Verification:** Extend the existing workout, finish-early, save-failure and timer tests. Test zero rest, skipped rest, undo, partial completion, reload during rest, interrupted motion and a rejected finish.

## Batch 4 — program and exercise editors

**Relevant files:** `src/features/programs/ProgramForm.tsx`, `WorkoutTemplateForm.tsx`, `ExerciseContributionForm.tsx`, `ProgramVolumeSettings.tsx`, `ProgramMuscleSummary.tsx`.

- [ ] Group program editing into readable sections: identity, workouts, repeat schedule and optional targets. Keep advanced content discoverable with concise summaries when collapsed.
- [ ] Separate exercise basics from contribution/role editing so the two large muscle grids do not dominate every edit. Keep weighted contributions and reviewed direct/indirect roles visibly distinct.
- [ ] Improve the summary of each workout and exercise row: show sets, rep range, rest and notes with consistent units and aligned secondary text.
- [ ] Keep the muscle-set table readable on small screens using a contained scroll area and persistent row context. Preserve counting-basis labels and unknown/partial values.
- [ ] Review save/cancel placement for long forms. Show unsaved-change status only when a draft differs from its saved version, and keep drafts intact on save rejection or conflict.

**Acceptance:** Opening advanced sections does not reset values. Collapsing a section does not hide unresolved errors without an error indicator. Cancel preserves the saved program, and retry preserves the draft. Existing exercise IDs, historical snapshots and volume calculations remain unchanged.

**Verification:** Extend program-form, muscle-volume, exercise-library and edit-conflict tests. Cover long names, 28-day cycles, missing exercise definitions, narrow screens and failure/retry.

## Batch 5 — history and tracking screens

**Relevant files:** `src/features/history`, `src/features/progress`, `src/features/body`, `src/features/nutrition`; `src/components/TrendChart.tsx`, `TrendPlot.tsx`.

- [ ] Make history easier to scan with clear date groups, workout identity and compact session facts. Keep correction, deletion and export actions clearly attached to the selected record.
- [ ] Improve chart legends, units, date-range context and selected-data details. Keep the accessible data table and the distinction between recorded load, volume, reps and completed sets.
- [ ] Strengthen the body-screen hierarchy: latest measurement, trend, target context and history. Same-day ordering and existing local-date behavior remain authoritative.
- [ ] Refine nutrition into a clearer selected-day summary and meal list. Make portion choice, grams, known totals and incomplete macros easy to distinguish.
- [ ] Apply the shared selection styling to remaining filter and serving chips. Keep descriptive labels and explicit pressed states; use color with text or an icon rather than color alone.
- [ ] Improve empty and error states with one relevant action, such as log a measurement, add food or clear filters. Preserve the user's current filters and inputs on recoverable errors.

**Acceptance:** Filters, exports and visible summaries refer to the same records. Unknown nutrients never appear as known zeroes. Changing visual presentation does not alter calculations, historical snapshots or measurements. Charts remain useful without motion and with no recorded data.

**Verification:** Use the existing history, progress, body and nutrition tests, including same-day entries, bodyweight sets at 0 kg, incomplete macros, empty filters and CSV exports.

## Batch 6 — consistency and device acceptance

**Relevant files:** `src/styles/tokens.css`, `global.css`, `apple.css`, `motion.css`; all shared controls; `tests/e2e`; design documentation.

- [ ] Consolidate overlapping style rules by component after the visible updates settle. Keep one authoritative definition for each control's background, focus, selected state and popup positioning.
- [ ] Review typography, spacing, borders, icon sizes and semantic colors across every route. Continue using shared tokens instead of adding page-specific color systems.
- [ ] Document default, hovered, pressed, focused, selected, disabled, empty, loading and error states for shared controls. Use synthetic examples, not personal records.
- [ ] Review motion as a whole: use the existing 120/180/250ms tokens, short capped staggers and transform/opacity transitions. Keep keyboard flows instant; respect reduced motion, reduced transparency and contrast preferences.
- [ ] Check Safari/WebKit and physical iOS/Android behavior: software keyboard, input zoom, safe areas, installed-PWA chrome, scroll locking, focus, rest alerts and touch feel. Record actual findings separately from desktop emulation.
- [ ] Capture final previews and record verification results, remaining limitations and release scope in a new release note. Publishing is a separate action from completing a local preview.

**Acceptance:** No layout overflow at the supported narrow widths; important actions stay reachable with enlarged text; selection remains identifiable in forced colors; focus is visible; dialogs and menus do not trap scrolling incorrectly; interrupted transitions leave the correct final state.

## Definition of done for each batch

- [ ] Finish a working local slice and review its changed states in light and dark themes.
- [ ] Run checks appropriate to the change. Use existing behavior tests where they cover the change; add regressions for new interaction behavior and confirmed bugs.
- [ ] For shared controls/layouts, run the full browser suite after a successful production build. Relevant commands: `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm exec vitest run --maxWorkers=4`, `pnpm exec playwright test --workers=2`.
- [ ] Keep preview/test records isolated from personal data. Check failure, retry and cancellation wherever saving is involved.
- [ ] Update `docs/ui-redesign.md` with the final design decisions and record which device/browser checks were actually performed.

## Later ideas

Evaluate configurable dashboard cards, a quick-action search, richer gesture interactions and larger chart explorations after these batches. They need a clear use case and their own scope. Calendar scheduling, adherence automation, new training prescriptions, food-catalog expansion and a native-app rewrite are separate product work.

**Next slice:** Batch 4 program/exercise editor organization, then Batch 5 tracking screens. Finish remaining validation review alongside those screens and keep physical-device acceptance open in Batch 6.

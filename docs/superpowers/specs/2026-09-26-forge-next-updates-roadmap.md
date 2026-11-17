# Forge: next major updates

Date: 26 September 2026  
Status: **Core continuation authorized and implemented locally on 27 September 2026. Larger follow-on features remain deferred.**

Earlier 27 September continuation: the user requested implementation of **priority fixes, selective merge, and My foods**. See [the execution record](../plans/2026-09-27-priority-updates.md). This supersedes the earlier plan-only instruction for that scope; production deployment and production settings remain outside this session.

Previous-session feedback incorporated: selective local-to-account data merge, easier personal food creation, and the confirmed same-day weight-log ordering bug (80 → 50 → 100 still displays 80). The user confirmed the merge use case, then explicitly requested **plan updates only; implementation is deferred until a later session after usage resets**. This document does not authorize automatic implementation or deployment when a reset occurs.

Latest continuation: the user requested the more distinctive workout editor and then chose **Complete the core improvements first**. See [core implementation and verification](../plans/2026-09-27-core-improvements.md). The earlier priority release was subsequently published; its production/schema verification is recorded in [the release log](../../releases/2026-09-27.md). Earlier plan-only and no-deployment statements below describe prior scope, not the latest authorization. The new core continuation is a local preview and has not been published.

## Next planned addition: split muscle workload

27 September follow-up: the user requested per-split information about how many sets each muscle receives and should be targeted for. This is **planning only**, following the completed local core slice. Prioritize transparent muscle-by-session summaries, explicit repeat schedules (including four-day rotations), audited direct/indirect roles, user-set target ranges with sources, and current-plan versus completed comparisons. Avoid treating a split name or a generic weekly number as an individualized prescription. Existing template prescriptions and historical snapshots stay unchanged.

See [the expanded product specification](2026-09-27-split-muscle-volume.md) and [the implementation plan](../plans/2026-09-27-split-muscle-volume.md). This feature is planned ahead of supersets, substitutions, effort logging and recipes. Explicit cycle metadata describes a plan; anchored calendar scheduling and adherence automation remain deferred.

### Chest detail and exercise expansion

Follow-up scope: add Upper chest and Mid chest emphasis under the existing Chest total, with explicit mixed/unspecified coverage and no double-counting. Expand the library with 12 chest variants and five supporting exercises from the user's routine. Preserve existing exercise IDs, generic movements and historical snapshots. The [muscle-volume specification](2026-09-27-split-muscle-volume.md) and its implementation plan contain the details and acceptance checks.

The user subsequently said **“skip the food update.”** Asian food catalog expansion is excluded from the active plan. No food records or nutrition code were changed. This follow-up remains planning only.

## 1. Direction

The chosen direction is **a precision training journal: neutral surfaces, a restrained accent, and light and dark modes**.

Forge should feel like a tool you trust between sets, not a fitness landing page. The core loop is simple: choose a session, see what you did last time, record the next set, rest, and continue. Analysis and nutrition should support that loop without crowding it.

This roadmap proposes changes; it does not change the running app, production deployment, database, or authentication settings. The visual direction is selected. The release scope and detailed designs still need approval before implementation.

### Recommended approach

| Approach | Benefit | Limitation | Decision |
|---|---|---|---|
| Cosmetic reskin | Quick visible improvement | Leaves workout interruptions, inconsistent controls, and sync recovery unresolved | Too narrow |
| Staged product redesign using the existing stack | Improves real workflows while preserving working features and data | Requires disciplined small releases | **Recommended** |
| Full rewrite or separate native apps | Maximum freedom | Rebuilds working functionality and increases migration and maintenance risks | Defer |

Keep React, TypeScript, Vite, native CSS, Geist, Lucide, Recharts, and Supabase. A new framework or an entire component-library migration is not a prerequisite for a better interface.

## 2. What exists, and what needs attention

Forge already has multiple programs, ordered guided workouts, rest timers, history, exercise/day charts, weighted muscle-set summaries, body measurements, nutrition logging, account integration, and an offline mutation queue. These are foundations to improve, not features to announce as new.

This proposal is grounded in repository inspection and a rendered **desktop Today screen on localhost**. It is not a complete accessibility audit, a mobile usability study, or a new end-to-end verification of production sync.

| Observation | Product consequence | Proposed response |
|---|---|---|
| Today has a roughly 420px-tall start panel and a large headline | The useful training information falls below an oversized call to action | Compact session summary and actionable journal layout |
| Cards, navigation, and controls repeatedly use rounded shapes and shadows | Weak hierarchy despite abundant decoration | Clear typography, thin separators, restrained surface elevation |
| Only a light theme is defined; some chart colors are hardcoded | Dark mode cannot be implemented reliably as a single background change | Semantic theme and chart tokens |
| Native selects and a custom select coexist across workflows | Selection feels inconsistent, especially on mobile | A task-specific control system |
| Rest mode replaces the exercise context | The user loses sight of the current and next set | Rest as a persistent part of the workout screen |
| Set changes save on each keystroke | Many mutations; harder conflict handling | Draft input with explicit, reliable persistence boundaries |
| The sync queue can stop on a conflict without a resolution flow | Retry alone cannot necessarily recover progress | A conflict-resolution workflow with tested queue transitions |
| Progress and muscle summaries apply different warm-up handling | Numbers can appear inconsistent | Shared metric definitions and explicit filters |
| The service worker immediately activates updates | An update could interact badly with an active session | Session-aware update handling and multi-tab tests |

Relevant areas include `src/styles`, `src/features/today`, `src/features/workout`, `src/components/SelectControl.tsx`, `src/data/cloudSync.ts`, and `vite.config.ts`.

## 3. Visual system

### Character

- Quiet, compact, readable, and precise.
- Neutral backgrounds with one muted accent used for the primary action, selected states, and the principal chart series.
- Red, amber, and green reserved for meaningful status, not general decoration.
- No promotional hero, gratuitous gradients, motivational filler, confetti, or a dashboard of interchangeable metric cards.
- Keep Geist; improve hierarchy and spacing before changing typography.

### Provisional tokens

These values are starting points for a prototype, not contrast-certified final tokens.

| Token | Light | Dark |
|---|---|---|
| Page | `#F6F7F6` | `#111513` |
| Surface | `#FFFFFF` | `#191E1B` |
| Primary text | `#17201B` | `#EDF2EE` |
| Secondary text | `#57645C` | `#ACB7AF` |
| Divider | `#DEE4DF` | `#303B34` |
| Accent | `#236A55` | `#88CFAC` |

Use separate tokens for text-on-accent, focus rings, disabled states, destructive actions, and chart series. Do not assume a subtle divider also has sufficient contrast to identify an input boundary.

Typography: 16px for ordinary mobile form content, 14–16px for desktop content, 12–13px only for secondary metadata, 24–32px page titles, and tabular numerals for weights, times, and totals. Avoid oversized headings inside working screens.

Spacing: a consistent 4/8px scale, with 16–24px between related sections. Controls should usually be 44–48px tall where touched. Use approximately 8–10px control radii and 12–16px panel radii; reserve pills for compact tags and segmented controls.

Motion: short 120–180ms transitions for state changes, reduced-motion support, no count-up animation on training metrics. Completion should be clear without moving the next target away from the finger.

Theme choices: System, Light, Dark. Persist the choice, apply it before first paint where practical, and cover charts, dialogs, browser color scheme, focus, and loading states—not just the main page.

## 4. Screen and interaction redesign

### Today: a useful starting point

Replace the oversized start panel with:

1. Date and a small account/sync indicator.
2. A compact next-session panel showing program, selected workout, exercise count, and Start. An in-progress session takes priority with **Resume workout**.
3. A short preview of the first exercises, with a visible Change workout action.
4. Weekly training summary using meaningful counts rather than duplicated labels.
5. Latest session and optional body/nutrition summaries.

Do not infer a schedule from program order unless scheduling has actually been configured. “Selected workout” is more honest than “Today’s prescribed workout.” Never invent a duration estimate without a basis.

Desktop can use a main journal column and a narrow supporting column. Mobile should put Resume/Start and the selected workout above secondary metrics. Empty sections should explain the next useful action, not display zero-filled charts.

### Workout: the most important redesign

The exercise, current set, and rest state must remain visible together.

```text
Push · Exercise 2 of 5                         Saved
Incline dumbbell press                 Change exercise
Last time: 22 kg × 10, 10, 8            Per dumbbell

Set      Previous        Weight       Reps       Done
1        22 × 10          22            10        ✓
2        22 × 10         [22]          [10]       [ ]
3        22 × 8           —             —

Rest 01:12 remaining             +30s       Skip
Next: set 2 · target 8–12 reps

[ Complete set ]
```

The example values illustrate layout only; real previous performance must come from the same exercise and compatible logging convention.

Requirements:

- Numeric keyboard, clear units, predictable focus, large completion target.
- Show previous performance beside the relevant set without forcing a trip to History.
- Persist drafts locally so blur, refresh, offline operation, or an interrupted app does not silently discard input. Separate local durability from cloud upload frequency.
- Keep rest controls visible without replacing the exercise table. Derive time remaining from timestamps, including after returning to the app.
- Support undoing an accidental completion; finishing and discarding have different, explicit consequences.
- Expose exercise order and upcoming work without a permanently expanded queue.
- Retain the active session if the program template changes.
- Announce completion/rest status accessibly without reading every timer second.
- Only offer sound/vibration when actually implemented and supported. Explain that a web app cannot guarantee an alarm while the phone is locked or the browser is suspended.

After this foundation: supersets, optional RIR/RPE, exercise substitutions, and deliberate load progression. Do not ship them all in the same workout rewrite.

### Selection controls: professional through behavior, not decoration

| Situation | Preferred control |
|---|---|
| Two or three short mutually exclusive choices | Radio group or segmented control |
| Short list of simple values | Accessible select/listbox with a clear label and selected value |
| Exercise or food catalog | Searchable combobox with grouped results and metadata |
| Program/workout choice | Named rows with exercise count or other useful context |
| Long selection on a small phone | Accessible sheet/dialog containing search and a visible selected state |
| Date, weight, reps | Suitable native date/numeric inputs where they work well |

All controls need keyboard access, visible focus, Escape behavior, proper accessible names, and a way to return focus after closing. Search must handle no matches and loading/error states. Do not replace every native control simply to remove its default appearance.

Prototype React Aria Components for one difficult searchable control and compare it with improving the existing control. Adopt only if accessibility, mobile behavior, maintenance cost, and bundle impact justify the dependency. Avoid a full app migration by default.

### Programs

- Clear program switcher and a visible session-level choice; no ambiguity between editing a program and choosing it for the current workout.
- Compact exercise rows showing set targets, rep range, and rest.
- Reorder with both drag-and-drop and Move up/Move down controls.
- Duplicate program/workout, archive instead of destructive deletion where appropriate.
- Explain whether an edit changes a template, the current session, or neither.
- Show muscle contributions in an inspectable detail panel, not as dense text in every exercise row.

### Progress and History

- Start with a question: “Is my incline press improving?” rather than a wall of graphs.
- One primary metric at a time: load, reps, volume, or later estimated 1RM. Avoid dual-axis weight/volume as the default.
- Explicit exercise, date range, unit, warm-up filter, and metric definition.
- Use real dates on the time axis; do not visually suggest equal intervals when sessions are weeks apart.
- Show individual observations and accessible text/table alternatives; avoid smoothing that suggests measurements that never occurred.
- Add history search/filter and a deliberate correction flow with recalculated summaries.
- Personal records must define the comparison: load record, rep record at a load, or session volume. Tie handling and exercise compatibility need tests.

For muscle summaries, distinguish **completed working sets** from **weighted muscle contributions**. Four chest-press sets with chest 1.0, triceps 0.5, and front delts 0.5 produce 4, 2, and 2 contributions—not eight performed sets. These coefficients are bookkeeping estimates, not exact measures of physiological stimulus. Allow inspection and user customization without rewriting old session snapshots.

### Body and Nutrition

- Body: last measurement, dated weight history, clearly labeled trend, and optional measurements. Missing days remain missing, not zero.
- Correct the distinction between a moving average over seven entries and a calendar seven-day trend. Label whichever is implemented accurately.
- Nutrition: a compact daily macro summary, meal sections, recent/favorite foods, and one obvious Add food action.
- Make the existing custom-food capability discoverable as **My foods**, with **Create my food** directly in the food picker. Support user-entered food names, explicit portions, calories, and macros; this addresses the user feedback about personalized pizza or other meals, not automatic tagging.
- Add edit entry, copy meal/day with confirmation, and recipes after basic logging is fast and dependable.
- Preserve food name, nutrients, portion, preparation state, and source as a diary snapshot. Catalog edits must not change past meals.
- Recipes should track ingredient totals and finished batch weight where supplied. Never silently convert raw meat weights into cooked weights.
- Keep calorie estimates optional, explain assumptions, retain manual targets, and review persistent eligibility/safety handling. Do not market estimates as prescriptions or add automatic aggressive target adjustments.

### Navigation and account status

In the first release, retain familiar destination names while improving their presentation. Keep one active navigation treatment rather than combining a pill, shadow, icon block, and marker.

After testing, consider mobile **Today / Workout / Nutrition / Progress / More**, with Programs accessible from Workout and More. This is a proposed second-stage change, not yet approved; frequent program editing may justify retaining Programs in the bar.

Account and sync should be easy to find on both devices. Distinguish Saved on this device, Waiting to sync, Synced, Offline, and Needs attention. “Saved” must never imply the data is already available on the other device when it is only local.

### Selective local-to-account merge — confirmed feature direction

**Purpose:** bring selected records from this browser's local copy into the currently signed-in account without replacing all account data. This is not account-to-account sharing, automatic background sync conflict resolution, or combining two foods into one recipe.

The existing `CloudDataManagement` flow previews counts and calls `CloudSync.replaceExact`; it explicitly replaces the cloud document. Keep that destructive restore option separate and clearly labeled. The new default migration action should be **Merge selected data**.

#### Review flow

1. Open Settings → Data → Merge local data. Show the destination account and explain that only data saved in this browser/origin is available. A deployed website cannot directly read localhost or another phone's browser storage. For those copies, use an exported Forge JSON backup; validate it through the existing import parser before offering selections. Do not interpret a pending-mutations diagnostic export as a full backup.
2. Load a source snapshot and fresh account snapshot. Display source, record counts, and destination. If no local source exists, explain this and offer the JSON backup path rather than an empty wizard.
3. Select categories and individual records. Start with **nothing selected**. Include search, dates where relevant, per-category Select all, selected counts, and a clear distinction between selecting all results and all records.
4. Review duplicates, conflicts, and required linked records. Show names, timestamps, and relevant differing fields, not opaque JSON. No source data is uploaded during selection or preview.
5. Show final totals: new records, replacements explicitly chosen, separate copies, duplicates skipped, and linked records included. Offer downloads of the source and pre-merge account backup. Keep both snapshots durably and account-scoped for recovery before submission; if that persistence fails, do not commit.
6. Confirm with **Merge N records into [account]**. Write the validated result against the reviewed account revision. Only show success after cloud acknowledgement; then update the local account cache and show a receipt of what happened.

#### Selection granularity

| Category | Selectable unit | Rule |
|---|---|---|
| Programs | One complete program, including its templates | Do not partially import a program in the first version |
| Workout history | One completed session, including sets and snapshots | Exclude unfinished sessions from the first version; leave them untouched and explain why |
| Body measurements | One dated measurement | Same date alone does not prove a duplicate |
| Food diary | One food entry, grouped by date and meal for convenience | Preserve recorded nutrients and portion snapshots |
| My foods | One custom food definition | Same name alone does not prove equivalence |
| Custom exercises | One custom exercise definition | Also expose required definitions for selected programs/sessions |

Keep body profile, nutrition targets, app preferences, and active session selection unchanged in this first release. Explain those exclusions in the review. They are singleton/date-effective settings with different conflict semantics and can be added in a later explicit extension.

#### Duplicate and conflict policy

- Same record ID and equivalent validated content: skip as already present. Comparison must be deterministic and not depend on JSON object property order.
- Same ID but different content: show a conflict. Default to **Keep account version / skip local record**. Offer **Use local version** with a replacement warning, or **Keep both** where record semantics allow it.
- Different IDs with similar names/dates/content: mark as possible duplicates for review; do not automatically discard legitimate repeated meals or measurements. User may add or skip.
- Do not implement field-by-field set/session merging in the first release. A conflict decision applies to the entire record; this avoids constructing a session the user never performed.
- Generate and persist ID mappings for separate copies before submitting. Remap all nested and cross-record references consistently, including program/template/exercise IDs. Preserve historical session and diary snapshots.
- Required linked definitions must appear in the preview. They may be reused only when compatible; otherwise require an explicit mapping or separate copy. Never silently import unrelated programs or custom foods just because a history entry mentions them.
- Session links to unselected programs/templates and diary links to unselected custom foods must use existing compatible targets or the model's supported nullable historical links. Validate exercise references and include explicitly reviewed definitions where required. Block malformed references with a useful explanation rather than inventing placeholder data.
- A conflicting definition used by unselected account records must not be replaced in a way that silently changes those records' behavior. Show impact and use a separate copy for imported references when needed.
- A second identical merge must not duplicate records. Persist a source-record-to-destination mapping and receipt for copied records, not just a one-off request ID. A later changed source record must be reviewed as a change, not skipped based solely on its original ID.

#### Safety and concurrency

- Require a signed-in account and online access to commit. Offline review may explain availability, but there is no queued blind whole-document merge.
- Require this device's account queue to be empty and conflicts resolved. Exporting pending changes is a backup action, **not** a substitute for resolving the queue.
- Guard local mutations during the short commit, including other tabs. Other devices remain protected by revision checks; never assume they stopped editing.
- If account revision, selected source content, or signed-in identity changes after review, invalidate confirmation and rebuild the preview. Preserve selections where still valid, but require renewed confirmation for changed results.
- Commit additions and explicit replacements atomically. Never partially merge category by category.
- Persist operation identity and copy mappings for safe retry after a lost response. If acknowledgement or local cache refresh is uncertain, reconcile with the server before offering retry; do not report a definite failure that encourages duplication.
- Keep the original local source untouched. No automatic cleanup, logout, profile replacement, or clearing of browser storage.
- Recovery must not blindly restore an old whole-account snapshot over newer edits. Offer backups and a separately reviewed restore; a one-click Undo is out of scope until later-change handling is designed.
- Keep backups, receipts, and mappings account-scoped. Do not expose another account's cached data as an import source. Explicitly chosen user backup files are distinct from private account caches.

#### Required tests before release

- Empty selection makes no mutation; selecting one record leaves all unselected account and source data unchanged.
- Exact duplicates are skipped; same-ID conflicts follow each explicit decision; same-name foods and same-day entries are not silently collapsed.
- Program/exercise references remain valid after copy/remapping, and history snapshots remain unchanged.
- Unfinished sessions and excluded singleton settings remain untouched.
- Repeating a merge, double-clicking confirm, losing a response, and restarting the browser do not create duplicate copies.
- A newer cloud revision, changed source, account switch, pending queue, or failed recovery-snapshot persistence prevents stale confirmation.
- The preview totals match the saved result and receipt, including dependent records.
- Invalid/unsupported backups fail before writing; cancel and preview do not upload local content.
- Keyboard and mobile users can inspect, select, resolve, and confirm without hidden choices or focus traps.
- After cloud acknowledgement, another signed-in device receives the selected data without losing its unrelated records.

## 5. Release roadmap

Effort labels are relative scope, not delivery promises. Each release should be split into small tested changes. Later feature releases depend on the foundation but need not be one enormous sequential rewrite.

### Release 0 — Trust and recovery

**Priority: P0 · Size: medium/large · Depends on: baseline tests and data-flow review**

Scope:

- Fix the confirmed same-day weight-log ordering bug as the first small reliability slice; see the issue specification below.
- Map mutation lifecycle, local durability, cloud confirmation, and conflict states.
- Add a recoverable conflict flow: compare local/cloud data; use cloud, keep the chosen local change against the current revision, or save a separate copy when semantically valid.
- Resolve dependent queued mutations atomically. Never silently drop later edits or apply blanket last-write-wins.
- Test separate-device edits to the same active session and unrelated records. Do not bypass queue ordering until dependency handling is proven.
- Treat ordinary signed-out state separately from a real authentication failure.
- Make app updates safe around an active workout and persisted pending changes; test multiple open tabs.
- Verify export/restore, account isolation, and sign-out behavior with pending data.
- Reconcile setup documentation with the deployed architecture. Review known security-advisor findings separately rather than assuming their current impact.

Acceptance:

- Offline edit → app restart → reconnect retains the edit exactly once.
- A conflict can be resolved through the UI without clearing browser storage.
- A signed-out user does not see a misleading missing-session error.
- Signing into a different account does not reveal the previous account's cached workout/body/food data.
- A new app version does not interrupt an active set or silently discard pending changes.

Primary areas: `src/data/cloudSync.ts`, `src/data/offlineStore.ts`, `src/data/cloudRepository.ts`, `src/hooks/useCloudAppData.ts`, auth/settings screens, and `vite.config.ts`.

#### BUG-BODY-001 — Latest weight remains the first entry of the day

**Status: fixed locally on 27 September 2026 with form/domain regressions and persisted ordering metadata; not deployed. Priority: high, early Release 0.** No production account records were inspected or modified during diagnosis.

Reproduction: create three separate measurements on the same recorded date, in order **80 kg → 50 kg → 100 kg**. The existing logic returns Latest weight = **80 kg**, change = **+30 kg**, while the daily chart point is **100 kg**. All three input records remain present in this reproduction; it demonstrates inconsistent ordering, not proven data loss.

Root cause:

- `MeasurementForm.tsx` converts every chosen date to local **12:00**, producing identical `recordedAt` timestamps for same-day entries.
- `getLatestMeasurement` and `getWeightChange` sort descending by that timestamp without a tie-breaker. Stable sorting preserves insertion order, so the first entry wins.
- `getWeightTrend` iterates the tied entries and overwrites the same day's map value, so the last entry wins. The history table independently repeats the timestamp-only sort.
- Today and Body both consume the latest-weight helper; Body's nutrition estimate also uses that selected weight.

Required behavior and fix boundaries:

- Use one explicit ordering policy for latest weight, previous-entry change, history, and daily chart selection: recorded date/time first, then a deterministic same-time tie-breaker representing entry order. Within the same date/time, the newest logged entry wins.
- Preserve all records. Do not fix this by deleting earlier same-day entries or silently turning Add into Edit.
- Backdated entries must not replace a genuinely more recent measurement. Editing an old record without changing its recorded date must not automatically make it the latest.
- Distinguish measurement date from creation/order metadata if needed. Before implementation, choose a compatible persisted tie-break strategy; do not rely only on incidental array order for new cross-device/imported data, or on random ID lexicographic order as evidence of chronology.
- Handle existing tied timestamps with a documented stable fallback using preserved existing array order (later position wins). Original creation time cannot be recovered reliably; do not invent historical timestamps. Preserve this legacy relative ordering through migration and merge.
- Audit local-date handling alongside the fix: the form currently initializes its date with a UTC ISO slice. Default to the user's local calendar day and avoid shifting saved dates when editing around midnight.
- Keep existing nutrition targets unchanged; corrected latest-weight selection may affect the displayed estimate, but must not silently save a new target.

Regression acceptance tests:

1. Add 80 → 50 → 100 on one date: Latest = **100 kg**, previous-entry change = **+50 kg**, history newest-first = **100, 50, 80**, and that day's chart point = **100 kg**.
2. Repeat after reload and cloud round-trip; selection remains consistent across devices.
3. Existing records with identical timestamps use the documented fallback, without deleting or altering their weight values.
4. Add an older dated measurement after a newer one; the newer date remains latest. Edit an older measurement without promoting it merely because it was edited now.
5. Delete the latest entry and verify the next entry becomes latest consistently in Body, Today, history, and chart.
6. Check local date defaults and edit round-trips near midnight in positive and negative UTC offsets.
7. Verify the displayed nutrition estimate receives the corrected latest weight while already-saved nutrition targets remain unchanged.
8. Add a form/page-level regression covering actual saves, not only hand-built entries. The current domain tests cover different timestamps but miss this same-timestamp case.

Primary areas: `src/features/body/MeasurementForm.tsx`, `src/domain/bodyMeasurements.ts`, `src/features/body/BodyPage.tsx`, `src/features/today/TodayPage.tsx`, `tests/domain/body-measurements.test.ts`, and body form/page tests. If persisted ordering metadata is introduced, include model validation, migration, offline/cloud serialization, and merge compatibility tests. Keep this fix separate from the larger body/nutrition redesign.

### Release 0B — Selective data merge

**Priority: P1 · Size: medium/large · Depends on: stable queue/conflict behavior and the review flow above**

Implement as a focused feature, not as part of the visual rewrite. First build and test a pure merge-preview/result builder; then add revision-safe, retry-safe persistence; finally connect the selection/review UI. Preserve the existing explicit full-restore path.

Primary areas: `src/features/settings/CloudDataManagement.tsx`, `src/hooks/useCloudAppData.ts`, `src/data/cloudSync.ts`, `src/data/cloudRepository.ts`, `src/data/offlineStore.ts`, models, parser/validation, and dedicated merge tests. Add a separate merge domain module instead of embedding reconciliation inside the settings component. Determine durable receipt/mapping storage and schema compatibility before coding; the existing short recent-mutation list alone is not a permanent import ledger.

Acceptance is the merge test checklist above. Prototype review should include a clean import, exact duplicate, conflicting workout, and copied program with linked custom exercises.

### Release 1 — Precision journal foundation

**Priority: P1 · Size: medium · Depends on: approved screen prototypes**

Scope:

- Semantic tokens and complete System/Light/Dark themes.
- Consistent buttons, fields, dialogs, status labels, empty states, and selection patterns.
- Compact Today layout and a quieter responsive application shell.
- Convert repeated hardcoded styling to shared primitives; do not accumulate a second layer of CSS overrides.
- Apply the new selection patterns first to program/workout selection, exercise search, and body profile choices.
- Add theme-aware chart colors and account/sync presentation.

Acceptance:

- Today, Workout, and one form reviewed in both themes before expanding to all screens.
- No unintended horizontal page scroll at 320, 375, 390, 768, and 1440px viewport widths.
- Primary actions remain reachable with the mobile keyboard open and safe-area insets applied.
- Keyboard-only flow through navigation, selectors, dialogs, and forms works without a trap.
- Text contrast, non-text control contrast, visible focus, zoom, and reduced motion are checked—not inferred from an automated score.

Primary areas: `src/styles/tokens.css`, `src/styles/global.css`, `src/components`, `src/app`, and `src/features/today`.

### Release 2 — Train with Forge

**Priority: P1 · Size: large; split into 2A and 2B · Depends on: Releases 0–1**

2A: persistent exercise/rest context, previous results, durable draft entry, better validation, undo completion, and safe finish/resume. This is the next major functional improvement.

2B: supersets, substitutions, optional effort logging, and clearer equipment/load conventions. Warm-up assistance can follow, with editable suggestions rather than mandatory prescriptions.

Acceptance:

- A prefilled ordinary set can be completed in one tap; routine weight/reps editing takes no unnecessary navigation.
- Returning from another app restores correct timer state and current exercise.
- An interrupted workout resumes at the correct set.
- Template edits do not change historical exercise/muscle snapshots.
- Zero external load is allowed where meaningful; invalid or incomplete reps cannot create a misleading completed working set.
- Superset rest and exercise transitions are tested as their own state machine before release.

Primary areas: workout components, `useRestTimer`, guided-workout domain logic, session mutations, and workout tests.

### Release 3 — Progress you can explain

**Priority: P1/P2 · Size: medium/large · Depends on: agreed metric conventions**

Scope:

- Shared definitions for completed sets, working/warm-up filters, and volume.
- Exercise charts, accurate date axes, date ranges, accessible data summaries, and clear PR types.
- Weekly muscle summary with direct and weighted contributions explained.
- History filtering and corrections.
- Document dumbbell per-hand/combined loads, assisted exercise conventions, and bodyweight handling. Preserve legacy values as legacy/unspecified rather than doubling or transforming them silently.

Acceptance:

- The same filtered sessions produce consistent values across charts, history, and summaries.
- Empty and single-observation charts are useful and honest.
- Four chest-press sets produce the documented 4/2/2 contribution example.
- Units and metric definitions remain visible in mobile layouts and exported data.

Primary areas: progress/history/muscle features, `TrendChart`, `src/domain/progress`, `src/domain/muscleSets`, and model validation.

### Release 4 — Body and nutrition without friction

**Priority: P2 · Size: medium/large · Depends on: selection system and compatible data migration if needed**

4A: **My foods first**, then accurate trend labels, recent/favorite foods, editing entries, meal copy with preview, and clearer preparation/portion units. The focused My foods improvement may ship after the selection foundation without waiting for all progress-chart work.

My foods requirements from user feedback:

- Create from inside Add food; enter a name, portion basis, calories, and optional protein/carbohydrate/fat values. Save to a private reusable library and optionally log a quantity immediately.
- Offer per-100g input and clearly labeled named portions. Do not require a guessed gram weight for a user who only knows nutrition per slice or portion. This needs a deliberate extension of the current per-100g/grams model, not invented conversion values.
- Missing macros mean unknown, not zero. The current model requires numeric macros, so partial values need a compatible schema/migration and diary-total behavior: show known totals with an incomplete-data indicator, and do not invent remaining macro allowances.
- Validate finite non-negative values and a positive serving quantity. Preserve user-entered calories rather than silently recalculating them from macros; any consistency warning is informational.
- Search My foods alongside the shared catalog with clear provenance; support editing, favorites, and reuse. Tags such as Homemade or Restaurant are optional later, not a prerequisite.
- Sync the library through the signed-in account and include custom foods in selective merge. Editing or removing a definition must not rewrite prior diary snapshots.

4B: recipes with serving calculations, optional measurement reminders, and improved target explanations. Reminders must be permission-based and platform-aware.

Acceptance:

- A recent food can be logged with a short, predictable flow and an explicit portion.
- Editing a catalog food does not rewrite historical diary totals.
- Recipe totals reconcile with ingredient totals and serving fractions.
- Copying a meal cannot silently duplicate an entire day.
- Weight trends do not treat missing measurements as zero.
- Manual nutrition targets remain available; eligibility/estimate assumptions survive reload and sync.

Primary areas: body/nutrition features, food diary models, measurement/energy-estimate logic, catalog provenance, and tests.

### Release 5 — Optional advanced training

**Priority: P3 · Size: separate future projects**

Consider double-progression suggestions, planned deloads, program blocks, plate calculations, broader exports, and better install/update guidance. Every recommendation should explain its inputs and allow dismissal. Do not infer recovery or injury risk from a few logged numbers.

Defer social feeds, AI coaching/chat, photo-based macro estimates, wearables, and native apps until actual use identifies a need. Barcode search also needs a deliberate data-provider, licensing, privacy, and error-handling decision.

## 6. Data and architecture safeguards

Keep the current per-user Supabase document model for the first releases. Do not combine a visual redesign with an unproven database normalization project.

The current data version and SQL validation are coupled to version 2. If new fields require version 3:

1. Define forward migration, legacy defaults, and import/export compatibility.
2. Test fixtures from real structural variants without exposing personal data.
3. Prepare the server to accept the intended compatible versions before clients write new documents.
4. Test old/new client coexistence, queued offline mutations, and an older open tab.
5. Back up before rollout and specify recovery. A client rollback alone is not necessarily a data rollback.

Evaluate finer-grained set mutations after conflict behavior is understood. Editing a number should not repeatedly replace an entire session in the cloud, but reducing network traffic must not reduce local durability.

Add URL-backed navigation/deep links as a bounded improvement when navigation is stabilized. Avoid coupling routing changes, data migrations, new workout state, and the whole theme switch into one pull request.

Diagnostics should use redacted technical metadata. Do not send raw workouts, body measurements, foods, tokens, or account identifiers into analytics or error reporting by default.

## 7. Quality gates and release procedure

Each implementation slice needs:

- Domain tests for calculations/state transitions and migration fixtures where applicable.
- Component tests for inputs, selection behavior, and error states.
- Browser tests for the affected journey, not only snapshot screenshots.
- Type checking, lint, tests, and production build.
- Desktop Chromium plus real iPhone Safari/Android Chrome checks where available; emulation alone is not a substitute for device validation.
- Two-device sync scenarios using dedicated test accounts and data.
- Preview review before any separately authorized production promotion.

For accessibility, aim for WCAG 2.2 AA. Use 44–48px touch targets as Forge's ergonomic goal, which is stronger than the standard's 24px minimum target rule with its exceptions. Provide keyboard alternatives to dragging and table/text alternatives to charts. Test visible focus, focus return, contrast, screen-reader names, and 200% zoom.

Measure usability before and after: steps to start/resume a workout, complete an ordinary set, find the previous result, add a recent food, and identify sync state. Do not claim percentage improvements without a baseline.

Assess performance with a repeatable production-build setup and comparable device/network conditions. Avoid arbitrary library replacement based on a development-mode score.

The first design checkpoint should show three screens—Today, active Workout with rest visible, and exercise selection—in light/dark and mobile/desktop layouts. Approve that direction before implementing every page.

## 8. Resources and how they influenced this proposal

Existing installed skills were used; no additional skill package was downloaded or installed during this review.

- **Brainstorming:** separated architectural work into releases and kept implementation behind design approval.
- **UI/UX Pro Max:** informed control consistency, touch behavior, focus, chart alternatives, and design-system exploration. Its automated fitness/marketing recommendations were not adopted wholesale because they conflicted with a compact journal.
- **Accessibility:** informed keyboard, focus, contrast, target-size, and testing acceptance criteria.
- **Design Taste:** inspected, but its stated scope excludes dense product screens. Its landing-page rules were not imposed on Forge.

External references, reviewed for this proposal:

| Resource | Use |
|---|---|
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Design workflow and interaction research |
| [Addy Osmani's agent skills](https://github.com/addyosmani/agent-skills) | Small, specified, testable delivery slices; not a reason to install every skill |
| [Taste skill](https://github.com/Leonxlnx/taste-skill) | Scope check; avoid applying marketing-page design to a workout tool |
| [React Aria ComboBox](https://react-aria.adobe.com/ComboBox) | Candidate for a bounded accessible-search-control prototype |
| [WAI-ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) | Keyboard and focus behavior for searchable selection |
| [WCAG target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Distinguish conformance minimums from ergonomic product targets |
| [Recharts](https://github.com/recharts/recharts) | Improve the existing chart system rather than replace it |
| [Hevy features](https://www.hevyapp.com/features/) | Benchmark relevant workout workflows such as previous results and supersets, not visual copying |
| [PWA updates](https://web.dev/learn/pwa/update) | Plan deliberate service-worker update handling |
| [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API) | Respect browser visibility and wake-lock limits |
| [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide/) | Maintain clear food data provenance |

## 9. Recommended next action

**27 September status:** the user subsequently authorized priority fixes, selective merge, and My foods. Those slices are implemented locally; the execution record lists validation and rollout requirements. The broader redesign, later feature releases, and production deployment remain separate work. The plan-only instruction below is historical context from 26 September.

When the user returns, re-read this roadmap and the current repository before coding. Recommended order: BUG-BODY-001 weight-log fix, remaining Release 0 reliability prerequisites, Release 0B selective merge, Release 1 design foundation, and the focused My foods improvement before recipes. Keep the three-screen design checkpoint before app-wide UI work. Turn each approved slice into an execution-ready implementation plan and deliver small previewable changes; do not treat the entire roadmap as a single authorized rewrite.

Suggested continuation prompt:

> Read `docs/superpowers/specs/2026-09-26-forge-next-updates-roadmap.md`. Start with BUG-BODY-001, the same-day weight-log ordering bug, then address selective local-to-account merge and its necessary reliability prerequisites in separate slices. Inspect current code, confirm the detailed design, and implement with regression tests. Preserve unrelated changes and existing data. Do not deploy or change production settings without asking. Keep the UI redesign and My foods changes as separate follow-up slices.

Success is not “more features.” Success is being able to open Forge at the gym, recognize the next action immediately, log without friction, and trust that the same record will appear on the other device.


Implementation update, 27 September 2026: the authorized priority fixes, selective merge, My foods, and subsequent selection-control redesign are implemented locally. See `../plans/2026-09-27-priority-updates.md` for verification evidence and remaining live rollout checks.

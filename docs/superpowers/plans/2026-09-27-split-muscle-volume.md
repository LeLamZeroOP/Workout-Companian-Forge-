# Split Muscle Volume Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Originally plan-only; the user requested implementation on 30 September 2026. No production deployment was requested.

**Goal:** Explain each split's per-muscle workload, its distribution and repeat schedule, with optional transparent targets and completed-work comparisons.

**Architecture:** A pure accounting module computes planned rows from a program and resolved exercise definitions. Explicit schedules determine calendar normalization; audited direct/indirect roles remain separate from existing weighted coefficients. Reuse one accessible summary component across the library, editor and progress views, preserving saved-session snapshots.

**Tech Stack:** Existing React, TypeScript, native CSS, Vitest, Playwright and Supabase document storage; no new dependency.

**Spec:** [Split muscle volume and target guidance](../specs/2026-09-27-split-muscle-volume.md).

Scope update: retain the requested upper-/mid-chest detail and exercise expansion. The user explicitly canceled the food update; nutrition catalog work is excluded.

## Global constraints

- Local implementation only; do not deploy or change a user's prescription automatically.
- Unknown schedule: show “Per pass through listed workouts.”
- Do not parse schedule notes or infer muscle roles from coefficients.
- No automatic set additions, personal optimum claims, or historic snapshot rewriting.
- Warm-ups stay excluded from the planned/completed comparison.
- Keep direct, indirect, weighted and performed-set totals distinct.
- Use the same counting basis and period on both sides of a numerical comparison.
- Store unrounded totals; format to one decimal only at display boundaries.
- Existing library adaptations remain attributed as Forge adaptations, not official creator programs.

## Shared interfaces and file map

Add the following types in `src/domain/models.ts` when implementation is authorized:

```ts
export interface MuscleRoles {
  direct: MuscleGroup[];
  indirect: MuscleGroup[];
  reviewedAt: string; // YYYY-MM-DD
  source: 'forge-reviewed' | 'user';
}
export interface TrainingCycle {
  slots: Array<Id | null>; // one workout ID or rest per day; 1–28 days
}
export interface MuscleSetTarget {
  muscle: MuscleGroup;
  lower: number;
  upper: number;
  basis: 'direct' | 'weighted';
  period: 'cycle' | 'sevenDayAverage';
  priority: 'focus' | 'maintain';
}
export interface VolumePlan {
  goal: 'hypertrophy' | 'strength' | 'maintenance' | 'custom';
  cycle?: TrainingCycle;
  targets: MuscleSetTarget[];
}
export type ChestEmphasis = 'upper' | 'mid' | 'mixed';
// ExerciseDefinition and WorkoutExercise: muscleRoles?: MuscleRoles
// ExerciseDefinition and WorkoutExercise: chestEmphasis?: ChestEmphasis
// ExerciseDefinition only: aliases?: string[]; setupNotes?: string; unilateral?: boolean
// Program: volumePlan?: VolumePlan
```

Absence of a target means “No target”; zero is a deliberate value, never the absence sentinel. Targets use finite numbers 0–1000 with lower <= upper and one record per muscle. Coefficient changes do not rewrite target numbers; remind the user that a weighted target's basis has changed. Roles have unique known muscle names, no overlap, and at least one direct or indirect muscle. Missing roles remain unknown.

Create `src/domain/programMuscleVolume.ts`:

```ts
export interface MuscleVolumeRow {
  muscle: MuscleGroup;
  directSets: number | null;
  indirectSets: number | null;
  weightedSets: number;
  directSessions: number | null;
}
export interface VolumeSummary {
  periodDays: number | null;
  performedSets: number;
  rows: MuscleVolumeRow[];
  workouts: Array<{ slot: number; workoutId: string; rows: MuscleVolumeRow[] }>;
  unknownExerciseIds: string[];
  missingDefinitionIds: string[];
}
export function summarizeProgramVolume(
  program: Program, exercises: ExerciseDefinition[]
): VolumeSummary;
export function normalizeVolume(summary: VolumeSummary): VolumeSummary | null;
export function compareMuscleTarget(
  value: number | null, target: MuscleSetTarget | undefined
): 'no-target' | 'unknown' | 'below' | 'within' | 'above';
```

`periodDays` is null for an unordered pass. `normalizeVolume` returns null for that case; otherwise produces a new summary at periodDays 7 with totals, row counts and session frequencies multiplied by 7 / original periodDays. Per-slot detail remains the original cycle detail and is labeled accordingly; never pretend fractional workout occurrences are a schedule. Preserve unknown nulls. If a cycle target is displayed alongside a normalized seven-day total, multiply both target bounds by the same 7 / cycleDays factor and label the converted range; retain the original saved target and its basis. Conversely, convert a seven-day range to a cycle reference with cycleDays / 7. Unknown periods block conversion. If any included exercise lacks roles, all aggregate direct/indirect/frequency totals are null (show known subtotals only in drilldown), avoiding misleading undercounts. Missing definitions also mark weighted totals as partial, with the explicit missingDefinitionIds list blocking target comparison.

Files and responsibilities:

- Models/migrations/validation/defaults: persist and validate cycle, roles and targets without inventing missing legacy metadata.
- `programMuscleVolume.ts`: pure planned math and target comparison.
- `exerciseCatalog.ts`, `trainingTemplates.ts`: audited role metadata and explicit built-in cycles.
- `ProgramMuscleSummary.tsx`: shared table, period/basis selectors, exercise drilldown and accessible unknown states.
- `ProgramVolumeSettings.tsx`: cycle and target editing inside a program draft.
- `TrainingLibrary.tsx`, `ProgramForm.tsx`: summary placement and comparison workflow.
- `muscleSets.ts`, `MuscleSummaryPage.tsx`, `App.tsx`: completed snapshot accounting and scoped plan/completed view.

## Task 1 — Establish durable metadata and snapshot rules

**Files:** modify `src/domain/models.ts`, `src/data/migrations.ts`, `src/data/validateAppData.ts`, `src/data/defaults.ts`, `src/domain/workout.ts`, `src/domain/selectiveMerge.ts`; create `tests/data/migrations-v4.test.ts`; extend `tests/domain/selective-merge.test.ts`, `tests/domain/workout.test.ts`.

- [ ] Add the shared interfaces and schema 4 reader/writer. Preserve the existing source-level AppDataV2 alias as an alias of AppDataV4 while callers migrate. Update parser/validator acceptance of versions 1–4 and normalize old supported documents to 4 without changing record IDs, coefficients, nutrients, sessions, receipts or mappings. Unknown future versions still fail.
- [ ] Add round-trip and legacy tests before the implementation. Use the real defaults and parser, not an invented fixture factory:

```ts
const legacy = { ...structuredClone(createDefaultData()), version: 3 };
const next = parseAppData(legacy);
expect(next.version).toBe(4);
expect(next.sessions).toEqual(legacy.sessions);
expect(next.programs[0]?.volumePlan).toBeUndefined();
expect(parseAppData(JSON.parse(JSON.stringify(next)))).toEqual(next);
```

- [ ] Validate cycle length, at least one workout, membership of every non-null ID, role overlap, known muscle names, target duplicates, finite bounds, and seven-day targets requiring an explicit cycle. Add individual failing tests for invalid references, all-rest cycles, 29 slots, NaN, negative bounds, lower > upper, and malformed role dates.
- [ ] Snapshot roles in `createSession` only when present. Exact addition in the exercise snapshot:

```ts
...(definition.muscleRoles
  ? { muscleRoles: structuredClone(definition.muscleRoles) }
  : {}),
```

Test that modifying the definition after creation leaves the session unchanged and that a legacy exercise produces no inferred roles.
- [ ] Update selective-merge program copying to remap every cycle workout ID through the existing workout ID mapping; preserve null rest slots, repeat occurrences, goals and target values. Session role snapshots are copied unchanged. Tests must cover copied PPL references twice and a four-day cycle with rest.
- [ ] Run `pnpm test:run tests/data/migrations-v4.test.ts tests/domain/selective-merge.test.ts tests/domain/workout.test.ts --maxWorkers=2`, then review only this task's diff before a scoped commit. No broad staging of the preexisting worktree changes.

Schema 4 is intentional: an old writer must not silently erase the new planning metadata. Prepare, but do not apply, `docs/cloud-schema-v4.sql` preserving the 10 MB bound and RLS, allowing supported versions 2/3/4. Record the eventual production rollout dependency in `docs/cloud-setup.md`; deployment is a separate future action after local verification. Update schema-number fixtures and release-gate tests explicitly, rather than weakening version validation.

## Task 2 — Pure counting and schedule normalization

**Files:** create `src/domain/programMuscleVolume.ts`, `tests/domain/program-muscle-volume.test.ts`; consume the shared types from Task 1.

- [ ] Write the accounting tests with a deliberately small synthetic program based on real defaults:

```ts
const data = createDefaultData();
const program = structuredClone(data.programs[0]!);
const workout = program.workouts[0]!;
program.workouts = [workout];
workout.exercises = [workout.exercises[0]!];
workout.exercises[0]!.targetSets = 3;
const exercise = structuredClone(data.exercises.find(
  item => item.id === workout.exercises[0]!.exerciseId
)!);
exercise.muscleContribution = { chest: 1, triceps: 0.5 };
exercise.muscleRoles = {
  direct: ['chest'], indirect: ['triceps'],
  reviewedAt: '2026-09-27', source: 'forge-reviewed'
};
program.volumePlan = {
  goal: 'hypertrophy', targets: [],
  cycle: { slots: [workout.id, null, workout.id, null] }
};
const summary = summarizeProgramVolume(program, [exercise]);
expect(summary.performedSets).toBe(6);
expect(summary.rows.find(row => row.muscle === 'triceps')).toMatchObject({
  directSets: 0, indirectSets: 6, weightedSets: 3, directSessions: 0
});
expect(normalizeVolume(summary)?.performedSets).toBe(10.5);
```

- [ ] Implement each cycle slot independently. For every exercise, add targetSets once to performedSets, add it to the explicit direct/indirect roles, and multiply it by each existing coefficient for weightedSets. Accumulate a Set of directly trained muscles per slot before counting frequency. Return all 13 muscle rows in the established `muscleGroups` order.
- [ ] Cover no cycle, repeated PPL, all four library cycles, missing definitions, missing roles, zero-contribution muscles, unilateral conventions, and 0 kg actual-set compatibility separately. For unknown schedule, assert normalizeVolume returns null. For the user's fixture, assert performedSets 52, periodDays 4, weighted chest 7 and normalized weighted chest 12.25 after supplying the explicit four-slot cycle in the test only; never modify the import file.
- [ ] Implement target comparison exactly as inclusive boundaries: no target => no-target; unknown/partial basis => unknown; value < lower => below; value > upper => above; otherwise within. Test values at each endpoint, zero bounds, and rounding just below a boundary so display rounding never controls the verdict.
- [ ] Run `pnpm test:run tests/domain/program-muscle-volume.test.ts --maxWorkers=2`; review arithmetic and unknown handling before a scoped commit.

## Task 3 — Audit mappings and encode every built-in schedule

**Files:** modify `src/domain/exerciseCatalog.ts`, `src/data/trainingTemplates.ts`, `src/features/programs/ProgramsPage.tsx`; create `docs/muscle-role-mapping.md`; extend `tests/domain/training-library.test.ts`.

- [ ] Review all 40 built-in exercises and record direct/indirect roles, variant assumptions and the basis for each classification in the mapping document. Preserve existing coefficients. Multiple primary muscles are allowed; no coefficient-to-role conversion loop is permitted. If uncertain, leave roles absent and explain the uncertainty. User-saved overrides still win over built-ins; never backfill a modified exercise silently.
- [ ] Add explicit template slot arrays: full-body `[A,null,B,null,C,null,null]`; upper/lower `[upperA,lowerA,null,upperB,lowerB,null,null]`; PPL `[push,pull,legs,push,pull,legs,null]`; hybrid `[upperA,lowerB,null,push,pull,legs,null]`. IDs use the actual template workout IDs, not names parsed from schedule text.
- [ ] In `createTemplateProgram`, build the workout-ID mapping first, then copy cycle slots using it. Program duplication must regenerate/remap nested IDs and cycle references. Do not add a cycle to old programs based on their names or notes.
- [ ] Test training-day counts 3/4/6/5, rest-day counts 4/3/1/2, PPL's twice-repeated workload, fresh IDs with valid references, and unknown schedules on old programs. Run `pnpm test:run tests/domain/training-library.test.ts --maxWorkers=2`; review mapping documentation and commit this slice.

## Task 3A — Chest regions and additional exercises

**Files:** modify `src/domain/models.ts`, `src/data/validateAppData.ts`, `src/domain/workout.ts`, `src/domain/exerciseCatalog.ts`, `src/domain/programMuscleVolume.ts`, `docs/muscle-role-mapping.md`, `src/features/programs/ProgramForm.tsx`, `src/components/SelectControl.tsx`; extend the associated domain/migration/catalog tests.

- [ ] Add the optional ChestEmphasis and exercise-discovery metadata defined above to the planned schema-4 work. Validate emphasis against exactly upper/mid/mixed, aliases as at most 20 nonempty unique strings of at most 100 characters, setupNotes as at most 2000 characters, and unilateral as boolean. Absence of emphasis is valid and means unspecified; migration must not derive it from names, coefficients or a newly edited catalog.
- [ ] Extend `createSession` with `...(definition.chestEmphasis ? { chestEmphasis: definition.chestEmphasis } : {})`. Copy setupNotes into the new session's exercise notes only at creation, keeping template notes too; don't change historical exercise notes or load conventions. Snapshot emphasis stays independent of later catalog edits.
- [ ] Extend VolumeSummary with `chestDistribution: { upper: number; mid: number; mixed: number; unspecified: number; complete: boolean }`. Count only explicit direct chest sets into one category. Direct roles missing => complete false; retain known categorized counts and explain they are partial. Normalize these counts by the same cycle factor used for other rows.
- [ ] Test direct chest sets 3 upper + 3 mid => parent 6, regional sum 6, never 12. Add tests for unspecified old data, mixed dips, indirect-only JM press, snapshot changes, legacy imports, and normalized 4-day cycles. Parent weighted chest values must remain identical before and after adding emphasis tags.
- [ ] Add the 12 chest variants and five supporting movements listed in the spec with independent stable IDs. Review each role/emphasis mapping in the mapping document. Keep the generic incline entry unchanged and don't overwrite imported custom IDs. Add aliases and setup notes; never change template prescriptions as a side effect of adding definitions.
- [ ] Add chest-emphasis and equipment filters to the searchable exercise catalog used by the program editor. Use shared controls; combine filters with the text query and expose an empty-result reset action. For exercises without emphasis, allow an explicit Unspecified filter.
- [ ] Run `pnpm test:run tests/domain/program-muscle-volume.test.ts tests/domain/training-library.test.ts tests/domain/workout.test.ts tests/data/validate-app-data.test.ts --maxWorkers=2`. Review the mapping choices before a scoped commit.

## Task 4 — Library summary, live editor and target controls

**Files:** create `src/features/programs/ProgramMuscleSummary.tsx`, `src/features/programs/ProgramVolumeSettings.tsx`, `tests/features/program-muscle-volume.test.tsx`; modify `TrainingLibrary.tsx`, `ProgramForm.tsx`, `src/styles/global.css`, `docs/training-library.md`.

**Interfaces:** `ProgramMuscleSummary({ program, exercises })` consumes the Task 2 functions. `ProgramVolumeSettings({ program, onChange })` accepts and returns a complete Program draft; it never writes storage directly.

- [ ] Add an expandable Chest row with Upper chest, Mid chest and Mixed/unspecified direct-emphasis details. Show the counting explanation and the parent target once. Never render a separate generic target for each region.
- [ ] Add a semantic table with caption “Muscle sets,” row/column headers, period and counting-basis controls, and expandable contributing exercises. Preserve a horizontally scrollable desktop matrix; mobile defaults to summary rows with the same accessible details. Do not rely on color. Connect selectors through existing ChoiceGroup/SelectControl components.
- [ ] Implement cycle slots using one labeled workout/rest control per day, with Add day/Remove day buttons and visible cycle length. Cancel is the parent editor's Cancel. Prevent saving a removed workout reference until the user explicitly assigns its day to another workout or rest.
- [ ] Add goal, priority and range controls with a visible direct/weighted and cycle/seven-day basis. Leave targets empty by default. Show the short evidence note and source links from the spec; comparison badges use compareMuscleTarget only after checking complete data and matching basis.
- [ ] Recompute from the current draft on every relevant edit. Add before/after tests: increase a mapped prescription from 2 to 3 sets and expect its contribution to rise by one; Cancel must leave onSave uncalled. Use role-based assertions such as `getByRole('table', { name: 'Muscle sets' })`, `getByText('Per pass through listed workouts')`, and `queryByText('Below your range')` for an unknown basis.
- [ ] Add comparison selection for at most two library cards, with a single shared basis/period and the full source split names. Reject a third selection with inline text “Compare two splits at a time.” Clearing a selection restores the ordinary library view. If schedules differ, compare normalized averages or per-cycle values with explicitly different period labels; never call different cycles equal weeks.
- [ ] Run `pnpm test:run tests/features/program-muscle-volume.test.tsx tests/features/training-library.test.tsx --maxWorkers=2`; inspect 320/375/768/1440 widths, dark/light, keyboard focus and screen-reader table labels before committing the UI slice.

## Task 5 — Current plan versus completed snapshots

**Files:** modify `src/domain/muscleSets.ts`, `src/features/muscles/MuscleSummaryPage.tsx`, `src/features/progress/ProgressPage.tsx`, `src/app/App.tsx`; extend `tests/domain/muscle-sets.test.ts` and create `tests/features/muscle-plan-comparison.test.tsx`.

- [ ] Add `summarizeCompletedMuscleVolume(sessions: WorkoutSession[]): VolumeSummary` using countedSet and each WorkoutExercise snapshot. Set periodDays null because a date range is supplied by the view, not derived from the first and last sessions. Its rows report actual totals without normalization. Missing historical roles leave direct/indirect totals unknown, preserving weighted totals.
- [ ] Pass programs and exercise definitions from App through Progress to the muscle view. Filter completed sessions by local date range and selected program ID; unrelated/null program IDs are excluded unless “Include other programs” is selected. Show this selection beside the totals.
- [ ] Display the actual seven-day range alongside the current plan's seven-day average, or a labeled current-plan cycle reference. Historical ranges explicitly say “Compared with current plan.” No adherence percentage, missed-session prediction or retroactive schedule inference.
- [ ] Test unchanged historical totals after exercise/template edits, actual totals not multiplied by a rotation factor, warm-up exclusion, same-name/different-ID exclusion, mixed legacy/new snapshot roles, and plan changes retaining old session roles.
- [ ] Run the domain and feature tests for this task and review the plan/actual distinction before a scoped commit.

## Task 6 — End-to-end and release documentation

**Files:** create `tests/e2e/program-muscle-volume.spec.ts`; update `docs/training-library.md`, this plan's verification record and `docs/cloud-setup.md`.

- [ ] Browser scenario: preview PPL's weekly summary, customize it, edit one set count, save/reload, and verify repeat slots and summaries. Duplicate the program and verify copied cycle references. Export/import and compare targets/roles/cycle without numerical drift.
- [ ] Browser scenario: load the user's unchanged fixture into isolated test storage, choose the four-day cycle, verify 52 sets/cycle and 91 performed sets/seven-day average, then confirm weighted chest 7/cycle and 12.3 displayed average. No target judgement appears before choosing a range. Cancel a subsequent cycle edit and verify persisted values stay unchanged.
- [ ] Browser scenario: open a legacy session and confirm unknown direct counts, preserved weighted counts and visible basis labels. New-session roles survive reload, cloud mock round-trip, selective copy and catalog edits. Include failed-save and stale-conflict recovery behavior from the existing test patterns.
- [ ] Run `pnpm typecheck`, `pnpm lint`, `pnpm test:run --maxWorkers=2`, `pnpm build`, and `pnpm test:e2e`. Inspect rendered screenshots rather than claiming visual quality from no-overflow assertions alone. Keep the current service-worker waiting policy.
- [ ] Record actual results, fixture calculations, compatibility limits and prepared schema-4 rollout prerequisites. Do not apply production SQL or publish as part of this plan update. Later release work must verify the database constraint and old-client rejection before publishing a schema-4 writer.

## Additional browser acceptance for chest scope

- [ ] Open Chest details in a library summary, select the 15-degree press through the upper/mid/unspecified filter as its reviewed metadata permits, and save a program without changing total parent chest accounting.
- [ ] Reopen an old workout: its original Chest total is unchanged and missing emphasis is explicit. New sessions preserve reviewed emphasis after catalog edits and selective-copy operations.
- [ ] At 320 and 375 px, verify expanded chest rows and combined search filters do not overflow; check keyboard access, light/dark contrast and visible filter reset.

## Self-review

Coverage: library summaries/comparison (Tasks 2–4), editable schedules/targets (Tasks 1/4), audited roles and provenance (Task 3), immutable actuals (Tasks 1/5), import/remap/compatibility (Tasks 1/3/6), and responsive accessible verification (Tasks 4/6). No automatic recommendations or scheduling engine are hidden in the scope. Research references and the user's worked example live in the linked spec. The user subsequently requested implementation on 30 September 2026.

## Local implementation update — 30 September 2026

The local continuation includes schema-4 planning metadata and migration, explicit library cycles, reviewed roles for 40 existing built-ins, 17 additional exercise variants, chest emphasis, planned and completed accounting, optional user targets, split comparison, and program editor controls. Existing user definitions and historical session snapshots are not backfilled. The food catalog remains unchanged. The PPL browser scenario confirms 60 performed sets in its seven-day repeat cycle and persistence after customization. The user's unchanged imported four-day fixture is covered by a domain test: 52 sets/cycle, 91 per seven-day average, and chest weighted contributions of 7/cycle and 12.25 per seven-day average. Its dedicated browser acceptance scenario remains to be added.

Verification: 179 Vitest tests passed across 47 files before the final imported-fixture assertion, which passed separately; TypeScript, ESLint, and production build passed; 15 Chromium scenarios passed. Desktop and 375 px mobile screenshots were inspected in `artifacts/muscle-volume-desktop.png` and `artifacts/muscle-volume-mobile.png`. The build retains its existing >500 kB chunk warning. Physical phone and live multi-account sync checks have not run.

This is local work only. `docs/cloud-schema-v4.sql` is prepared but has not been applied. The schema-4 client must not be published before the target database is checked and migrated. Older schema-3 clients cannot safely write over schema-4 planning data.

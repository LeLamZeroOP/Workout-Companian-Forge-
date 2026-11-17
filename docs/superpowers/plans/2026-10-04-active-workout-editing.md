# Active Workout Editing Implementation Plan

> **For agentic workers:** Use the executing-plans skill to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace or remove exercises and edit workout information while a session is in progress, without mislabeling completed results or losing draft changes.

**Architecture:** Keep changes within the existing `WorkoutSession` snapshot and `useWorkoutDraft` persistence flow. Put immutable exercise mutations in a focused domain module; expose them through an exercise actions control and an editor in `GuidedWorkout`. Pass the exercise catalog from `App` through `WorkoutPage`.

**Tech Stack:** Existing React 19, TypeScript, Vite, Vitest, Testing Library, Playwright, and local/cloud session persistence.

**Spec:** The behavior specification below is the specification for this plan.

## Global Constraints

- Changes apply to this session; program templates and catalog definitions stay unchanged.
- Use existing dependencies, components, styling conventions, and storage scope.
- Keep completed results associated with the exercise actually performed.
- Preserve session identity, start time, and unaffected set identities.
- Disable mutations during a draft conflict; resolve through the existing conflict controls.
- Preserve compatibility with existing v4 data; no persisted fields or migration are required.

## Behavior specification

### Exercise actions

Show an “Exercise options” button beside the current exercise and actions for each workout-order entry. Queue actions must be separate buttons, never nested inside the queue selection button. Offer Edit details, Replace exercise, and Remove exercise. Both current and upcoming exercises can be edited during rest.

### Replace exercise

Use the existing searchable `SelectControl` to select a catalog exercise, including custom exercises. Search includes the existing name/alias descriptions. Disable replacement with the same definition and show an empty-catalog message when necessary.

- No completed sets: replace the existing entry in place, retain its session exercise ID and slot, and keep set count, set type, rep targets, and rest duration. Reset unfinished weight/reps and use fresh set IDs. Load the replacement's name, contribution, muscle roles, chest emphasis, and setup notes; do not carry the old setup notes to the replacement.
- Some completed sets: retain the original entry with completed sets only. Insert the replacement directly after it with a fresh exercise ID, fresh blank sets matching the unfinished set count/types, original targets/rest, and replacement metadata/setup notes. Explain: “Completed sets stay with [original]. Remaining sets move to [replacement].” Reset unfinished entered values explicitly in the preview.
- All sets completed: disable replacement with “All sets are completed.” Adding an unrelated exercise is outside this feature.
- Replacing an entry associated with the current selection or rest cancels that rest and selects the first new unfinished set. Replacing another entry preserves a valid current selection and timer.
- Copy optional metadata from the replacement definition, removing old optional fields when absent. Previous-performance lookup automatically follows the new `exerciseId`.
- Confirm with “Replace exercise” after a preview of the result; Cancel performs no mutation.

### Remove exercise

Use `ConfirmDialog` before removing the entry. Include its exercise name, completed-set count, and notice that its logged results will be removed from this session. Cancel preserves the entire session.

- Remove the whole entry and its sets only after confirmation.
- If the removed entry owns the selected set or rest timer, cancel its rest and select the next unfinished set in workout order, wrapping to earlier entries if needed.
- Preserve selection and rest for unaffected entries. If no incomplete sets remain, clear selection/timer and show Finish workout.
- Allow removing the last exercise. Show “No exercises remain” with Discard workout; offer Finish workout only when another retained exercise has completed sets. Do not save an empty completed workout.
- No global undo is included in this version; the preview and confirmation prevent accidental loss.

### Editable information

An Edit details panel contains rep minimum, rep maximum, rest seconds, and exercise notes. A separate Edit workout details panel contains workout name and session notes. Existing set controls remain available for actual weight/reps, working/warm-up type, and adding/removing unfinished sets.

- Use explicit Save and Cancel. Keep panel input local until Save; opening/closing does not overwrite the session draft.
- Rep values are integers 1–100, minimum no larger than maximum. Existing sessions without targets may leave both fields blank; a single blank target is invalid.
- Rest is an integer 0–600 seconds. Workout name is trimmed, 1–60 characters. Notes have a maximum of 2,000 characters.
- Completed set values/status are unchanged by details edits. Editing rest changes future timers; an already running timer keeps its original end time.
- Save commits the latest workout draft immediately through the existing persistence mechanism. A pending weight/reps edit must survive another edit or exercise action.
- Invalid input stays visible with field-specific errors; Save is blocked. Cancel discards only panel changes.
- Editing completed actual set values retains the existing Undo set workflow; direct correction without undo is outside this version.

### Mobile and accessibility

Use a dialog/panel that fits narrow screens, with labeled inputs, keyboard focus containment/restoration, Escape and Cancel, and clear destructive-action styling. Announce replacements/removals through the existing status region. Keep workout-order collapse behavior and visible action tap targets usable at 375px width.

## File map

| File | Responsibility |
| --- | --- |
| `src/domain/sessionEditing.ts` (new) | Pure replacement, removal, validated details edits, and guide reconciliation |
| `src/features/workout/ExerciseActions.tsx` (new) | Exercise actions and replacement preview/confirmation |
| `src/features/workout/WorkoutDetailsEditor.tsx` (new) | Exercise/session forms, local input, validation, Save/Cancel |
| `src/features/workout/GuidedWorkout.tsx` | Integrate controls, draft mutations, queue actions, empty-session behavior |
| `src/features/workout/WorkoutPage.tsx` | Pass catalog to active workout |
| `src/app/App.tsx` | Supply `data.exercises` |
| `src/hooks/useWorkoutDraft.ts` | Add an atomic latest-draft commit interface |
| `src/styles/global.css` | Responsive actions/editor styles |
| `tests/domain/session-editing.test.ts` (new) | Domain behavior and invariants |
| `tests/features/workout-page.test.tsx` | User flows and confirmations |
| `tests/features/workout-draft.test.tsx` | Persistence and concurrent input regressions |
| `tests/e2e/workout-editing.spec.ts` (new) | Mobile replacement/edit/removal/reload flow |

## Task 1: Session mutations and guide reconciliation

**Interfaces:** Export the following from `src/domain/sessionEditing.ts`:

```ts
import type { ExerciseDefinition, WorkoutSession } from './models';
export type ExerciseDetails = {
  targetRepMin?: number; targetRepMax?: number;
  restSeconds: number; notes: string;
};
export type SessionDetails = { workoutName: string; notes: string };
// Immutable operations; reject invalid details with field-keyed errors.
export function replaceSessionExercise(session: WorkoutSession, exerciseId: string,
  replacement: ExerciseDefinition): WorkoutSession;
export function removeSessionExercise(session: WorkoutSession, exerciseId: string): WorkoutSession;
export function editSessionExercise(session: WorkoutSession, exerciseId: string,
  details: ExerciseDetails): WorkoutSession;
export function editSessionDetails(session: WorkoutSession, details: SessionDetails): WorkoutSession;
export function validateExerciseDetails(details: ExerciseDetails): Record<string, string>;
export function validateSessionDetails(details: SessionDetails): Record<string, string>;
```

- [ ] Add domain tests using `createDefaultData()` and `createSession()` fixtures. Cover unstarted, partially completed, fully completed, same-definition, and missing-entry replacements; old optional metadata removal; blank replacement values; stable unaffected IDs; no input mutation.
- [ ] Include this concrete partial-completion assertion sequence (with fixture `session`, first `original`, and a different catalog `replacement`):

```ts
original.sets[0] = { ...original.sets[0]!, completed: true, weightKg: 30, reps: 10 };
const next = replaceSessionExercise(session, original.id, replacement);
expect(next.exercises[0]!.exerciseId).toBe(original.exerciseId);
expect(next.exercises[0]!.sets).toEqual([original.sets[0]]);
expect(next.exercises[1]!.exerciseId).toBe(replacement.id);
expect(next.exercises[1]!.sets).toHaveLength(original.sets.length - 1);
expect(next.exercises[1]!.sets.every(s => !s.completed && s.weightKg === null && s.reps === null)).toBe(true);
expect(session.exercises[0]!.sets).toHaveLength(original.sets.length);
```

- [ ] Test active/upcoming/last removal, guide wraparound, completed-plan selection clearing, and rest ownership. Test rest edits leave existing timer timestamps unchanged. Test numeric boundaries, paired optional targets, name trimming, and notes limit.
- [ ] Run `pnpm exec vitest run tests/domain/session-editing.test.ts`; expect initial failure for missing exports.
- [ ] Implement cloning and mutations. Use `getNextIncompleteSet` for next-set resolution, starting from the removed entry's former order position. Preserve valid unrelated guide pointers; never leave IDs referring to removed sets. Fully completed/same-definition/missing-entry replacements return the original session. Invalid details must not mutate data.
- [ ] Validate representative outputs with `validateAppData`, including an empty active session and split replacement.
- [ ] Rerun the domain tests and existing `tests/domain/guided-workout.test.ts` and `tests/domain/workout.test.ts`.

## Task 2: Atomic draft commits

**Files:** `src/hooks/useWorkoutDraft.ts`, `tests/features/workout-draft.test.tsx`.

**Interface:** Expose `commitCurrent(update: (latest: WorkoutSession) => WorkoutSession): void`. Implement it by passing `update(current.current)` to the existing `commit` function; use the existing validation, persistence, submission tracking, and conflict behavior.

```ts
function commitCurrent(update: (latest: WorkoutSession) => WorkoutSession) {
  commit(update(current.current));
}
```

- [ ] Write a regression that enters a weight, then commits an exercise details edit before a React render; assert both survive. Add replacement/removal reload tests and a conflict test that blocks saved-session writes.
- [ ] Run `pnpm exec vitest run tests/features/workout-draft.test.tsx` to establish the failing case.
- [ ] Add/export the interface through the hook return value. Structural controls must use `commitCurrent`, not a captured `draft` snapshot. Leave existing typed-value handling intact.
- [ ] Rerun draft tests. Verify storage exceptions continue to show the existing error and preserve the in-memory draft.

## Task 3: Exercise controls and editors

**Interfaces:** `ExerciseActions` consumes `exercise: WorkoutExercise`, `catalog: ExerciseDefinition[]`, `disabled: boolean`, and callbacks `onEdit(): void`, `onReplace(replacement: ExerciseDefinition): void`, `onRemove(): void`. It owns replacement selection/preview, while removal confirmation is driven by the parent. `WorkoutDetailsEditor` accepts a discriminated `mode: 'exercise' | 'session'`, corresponding initial details, `disabled`, `onSave`, and `onCancel`; reuse Task 1 validators.

- [ ] Add feature tests for selecting a catalog replacement, partial-completion preview, Cancel, destructive confirmation, and editing details with valid/invalid input. Verify completed results never acquire the replacement name.
- [ ] Run `pnpm exec vitest run tests/features/workout-page.test.tsx` and verify new cases fail.
- [ ] Add catalog props through `App` → `WorkoutPage` → `ActiveWorkout` → `GuidedWorkout`; use `data.exercises` at the root. Update existing direct render fixtures to supply catalog where replacement is exercised.
- [ ] Implement accessible exercise actions using `SelectControl`, `ConfirmDialog`, and the project's dialog conventions. Put explicit Save/Cancel on editors and preserve typed strings until validation.
- [ ] Wire callbacks using `commitCurrent(latest => replaceSessionExercise(latest, selectedId, replacement))` and equivalent edit/remove operations. Track target IDs rather than array indices. If the target disappears or conflict arrives while a panel is open, block Save and require reopening after resolution.
- [ ] Add Edit workout details within `GuidedWorkout`, using the draft workout name for active heading presentation so local persistence errors/conflicts do not display contradictory names.
- [ ] Restructure queue entries to support separate selection and action buttons. Announce committed actions and restore focus to a surviving action control.
- [ ] Replace the current early empty-session return so errors/conflict controls remain visible; enforce the empty-session finish rule in both UI and finish handling.
- [ ] Add responsive styles in `src/styles/global.css`, with dialog scrolling and reachable action buttons on narrow screens.
- [ ] Rerun feature/domain/draft tests; check existing completion, timer, and previous-performance assertions still pass.

## Task 4: Integration verification and documentation

**Files:** `tests/e2e/workout-editing.spec.ts`, `README.md`.

- [ ] Add one browser flow at 375px: start workout, log/complete a set, replace remaining sets, edit rest/notes, remove an upcoming exercise, reload, and verify the split history and edited data persist. Finish and verify history shows the original completed exercise accurately.
- [ ] Add a browser assertion that Cancel leaves values unchanged and dialogs support Escape/focus restoration.
- [ ] Run `pnpm exec playwright test tests/e2e/workout-editing.spec.ts tests/e2e/mobile-timer.spec.ts` using the existing Playwright configuration.
- [ ] Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Record actual results; repair regressions introduced by this feature.
- [ ] Update README workout instructions with session-only changes, replacement's completed-set preservation, removal's effect on logged results, and rest-edit timing.

## Acceptance criteria

- Replacement, removal, and details editing work on current/upcoming exercises without restarting the workout.
- Partial replacements retain completed results under the original movement and reset only replacement inputs.
- No action leaves broken guide/timer references, loses unrelated typed values, or bypasses draft conflicts.
- Reload restores edits, and history/metrics reflect the exercises actually retained and performed.
- Changes do not alter future program workouts; all existing workout tests continue passing.

## Scope exclusions

Exercise reordering, adding arbitrary exercises, editing catalog muscle definitions, updating the saved template from a session, full undo history, and direct editing of completed actual set values are separate follow-ups.

## Planning verification

Inspected session models, session creation, guided navigation/timers, draft persistence, application catalog ownership, validators, existing workout tests, and shared selection/confirmation components. The current v4 shape supports this design. This is a planning artifact; implementation and runtime verification have not been performed.

## Implementation outcome — 4 October 2026

All four tasks are implemented and verified. Added `WorkoutEditDialog.tsx` to share accessible editor focus handling and `workout-editing.test.tsx` to keep new feature tests focused. Added `pnpm dev:test` for a separate local-only test server at port 4180. Verification: 196 unit/feature tests and 3 mobile browser tests passed; lint and production build passed. See `docs/releases/2026-10-04-workout-editing-test.md` for commands and limits.

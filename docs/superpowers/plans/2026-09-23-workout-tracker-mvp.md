# Workout Tracker MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive web-based gym workout companion for phones and PCs that guides one person through an ordered program workout with per-exercise rest timers, records sets, graphs weight and volume, and summarizes effective training sets by muscle group.

**Architecture:** Use a responsive single-page React application built with Vite and TypeScript and deploy it as a static HTTPS website that opens in mobile and desktop browsers. Model programs, workout templates, exercise muscle contributions, and completed sessions separately; keep all calculations in pure domain functions and browser persistence behind a typed repository interface. Version persisted data from the start so a future backend or cross-device sync layer does not require rewriting the product.

**Tech Stack:** React 19, TypeScript 5.5+, Vite 8, CSS Modules/global design tokens, Lucide React icons, Recharts responsive charts, Vitest, React Testing Library, jest-dom, user-event, Playwright, and Vercel static hosting.

**Spec:** `planning/design.md`

## Global Constraints

- The first release is single-user, local-first, and requires no account or network connection.
- The production build must be deployable to one public HTTPS URL and work in both mobile and desktop browsers; data remains local to each browser and does not automatically sync between phone and PC in the MVP.
- Store workout data in `localStorage` through a repository abstraction; UI components must not access `localStorage` directly.
- Use kilograms for weight and integer repetitions in the MVP.
- Support current Chrome, Edge, Firefox, and Safari releases at widths from 320px upward, including portrait touch layouts and wide desktop layouts.
- Meet the WCAG 2.2 AA baseline: semantic controls, visible focus, keyboard operation, associated labels and errors, 4.5:1 normal-text contrast, and reduced-motion support.
- Follow the dark visual direction in `planning/design.md`: near-black canvas, restrained surfaces, neutral primary actions, and coral used sparingly for brand emphasis.
- Do not add authentication, social features, cloud sync, nutrition tracking, AI coaching, wearable integration, or plate calculation in the MVP.
- Never fabricate user performance data. Seed content may define example programs, workout templates, exercises, and muscle-contribution defaults, but completed workout statistics must come only from saved sessions.
- A completed working set may contribute fractional effective sets to more than one muscle. Effective muscle sets are analytical values and do not need to sum to the physical number of sets.
- Graphs must expose the underlying values in an accessible table and must not rely on color alone.
- Guided workouts must follow the exercise and set order stored in the selected workout template unless the user explicitly skips or selects another item.
- Rest countdowns must derive remaining time from a persisted absolute end timestamp, not from counting browser intervals, so refreshes and background-tab throttling do not reset or extend rest.
- Sound, vibration, wake lock, and system notifications are progressive enhancements; the visible in-app countdown and controls must remain fully functional when browser permission or API support is unavailable.
- Use test-driven development for domain rules and persistence. Each task must pass lint, unit tests, and TypeScript checks before commit.

---

## Product Scope

### Primary user journey

1. Open the same web application from a phone or PC browser and see today's workout state.
2. Choose or create a program, then choose one of its workout templates for the session.
3. Press Start and follow the highlighted exercise and set in the order configured in the workout template.
4. Log weight and reps, complete the set, then follow the exercise-specific rest countdown before the next set or exercise.
5. Add or remove sets, skip rest when needed, move manually when necessary, and see previous-session values when available.
6. Finish the workout and review duration, total sets, and total volume.
7. Open history and analytics to inspect prior workouts, per-exercise weight/volume trends, daily volume, and effective sets by muscle.

### MVP screens

- **Today:** next-workout prompt, active-session summary, weekly consistency, recent workout, and this week's muscle-set summary.
- **Programs:** list, create, edit, duplicate, and delete programs; each program contains one or more named workout templates.
- **Start workout:** choose the program and workout template that will be active for this session.
- **Active workout:** guided current exercise/set, overall workout timer, per-exercise rest countdown, next-up preview, ordered exercises, previous values, notes, add set/exercise, finish, and discard.
- **History:** chronological completed-workout list and workout detail.
- **Progress:** exercise selector, weight and volume graphs, daily total-volume graph, personal bests, and accessible source-data tables.
- **Muscles:** effective-set totals by major muscle for the current session, day, week, and selected date range.
- **Settings:** unit display, rest-alert preferences, keep-screen-awake preference, data export/import, reset sample data, and delete all data.

### Deferred after MVP

- Accounts and cross-device sync.
- Supersets, scheduled/background push reminders outside an active workout, RPE/RIR, body measurements, calendar scheduling, exercise media, comparison overlays, and predictive charts.
- A remote API and database.

---

## Domain Model

```ts
export type Id = string;

export type MuscleGroup =
  | 'chest'
  | 'lats'
  | 'upperBack'
  | 'frontDelts'
  | 'sideDelts'
  | 'rearDelts'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs';

export type MuscleContribution = Partial<Record<MuscleGroup, number>>;

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'band'
  | 'other';

export interface ExerciseDefinition {
  id: Id;
  name: string;
  equipment: Equipment;
  muscleContribution: MuscleContribution;
  isCustom: boolean;
}

export interface TemplateExercise {
  id: Id;
  exerciseId: Id;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  restSeconds: number;
  notes: string;
}

export interface WorkoutTemplate {
  id: Id;
  name: string;
  notes: string;
  exercises: TemplateExercise[];
}

export interface Program {
  id: Id;
  name: string;
  notes: string;
  workouts: WorkoutTemplate[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutSet {
  id: Id;
  weightKg: number | null;
  reps: number | null;
  kind: 'working' | 'warmup';
  completed: boolean;
}

export interface WorkoutExercise {
  id: Id;
  exerciseId: Id;
  exerciseName: string;
  muscleContribution: MuscleContribution;
  restSeconds: number;
  notes: string;
  sets: WorkoutSet[];
}

export interface RestTimerState {
  exerciseId: Id;
  afterSetId: Id;
  startedAt: string;
  endsAt: string;
  durationSeconds: number;
}

export interface GuidedWorkoutState {
  currentExerciseId: Id | null;
  currentSetId: Id | null;
  restTimer: RestTimerState | null;
}

export interface WorkoutSession {
  id: Id;
  programId: Id | null;
  programName: string;
  workoutTemplateId: Id | null;
  workoutName: string;
  startedAt: string;
  completedAt: string | null;
  notes: string;
  exercises: WorkoutExercise[];
  guide: GuidedWorkoutState;
}

export interface AppDataV1 {
  version: 1;
  exercises: ExerciseDefinition[];
  programs: Program[];
  sessions: WorkoutSession[];
  settings: {
    weightUnit: 'kg';
    lastSelectedProgramId: Id | null;
    restAlertSound: boolean;
    restAlertVibration: boolean;
    keepScreenAwake: boolean;
  };
}
```

Required default exercise mapping:

```ts
const dumbbellChestPress: ExerciseDefinition = {
  id: 'dumbbell-chest-press',
  name: 'Dumbbell Chest Press',
  equipment: 'dumbbell',
  muscleContribution: {
    chest: 1,
    triceps: 0.5,
    frontDelts: 0.5,
  },
  isCustom: false,
};
```

Validation rules:

- Program and workout-template names: trimmed, 1–60 characters.
- Exercise name: trimmed, 1–80 characters.
- A program contains 1–14 workout templates; a workout template contains 1–20 exercises.
- Each exercise must target at least one muscle. Contribution values are 0.25, 0.5, 0.75, or 1.0; a missing muscle means zero contribution.
- Target sets: integer 1–10.
- Target repetition range: integers 1–100 with minimum no greater than maximum.
- Rest duration: integer 0–600 seconds.
- Logged weight: 0–1,000 kg in increments no smaller than 0.25 kg.
- Logged repetitions: integer 0–1,000.
- A session can finish only when it has at least one completed set with both weight and repetitions entered.
- Training volume is the sum of `weightKg * reps` for completed, valid sets; graphs separate values by local calendar date.
- Muscle effective sets include completed working sets only. For each exercise, multiply its number of completed working sets by every configured muscle-contribution factor.
- Warm-up sets remain visible in history and volume graphs but contribute zero effective muscle sets.
- Starting a session requires an explicit program and workout-template choice; the session stores their IDs and snapshot names, and each workout exercise snapshots its name and muscle contribution, so later edits do not rewrite history or analytics.
- Starting initializes the guide at the first set of the first exercise. Exercise order is the exact `WorkoutTemplate.exercises` order; set order is the exact `WorkoutExercise.sets` order.
- Completing a non-final set starts the completed exercise's configured `restSeconds`. A zero-second rest advances immediately.
- When rest expires or the user selects Skip Rest, the guide advances to the next incomplete set in the same exercise, then to the first incomplete set in the next exercise.
- Completing the final planned set of the final exercise does not start another rest timer; it presents the Finish Workout action.
- Selecting `+30 sec` updates `endsAt` by exactly 30 seconds. Refreshing or returning from the background recomputes `max(0, endsAt - now)` and advances once when the result reaches zero.
- Manual exercise or set selection changes the current guide position but never marks skipped sets complete or deletes their entered values.
- An unfinished session is unique; attempting to start another offers Resume or Discard, never silent replacement.

---

## Planned File Structure

```text
index.html                         Application HTML shell and metadata
package.json                       Scripts and dependencies
vite.config.ts                     Vite and Vitest configuration
playwright.config.ts               Browser-test projects and web server
tsconfig.json                      Shared TypeScript configuration
tsconfig.app.json                  Browser application configuration
tsconfig.node.json                 Tooling configuration
eslint.config.js                   TypeScript and React lint rules
src/
  app/App.tsx                      Top-level shell and route selection
  app/navigation.ts                Route type and navigation metadata
  components/
    AppShell.tsx                   Responsive sidebar/bottom navigation
    EmptyState.tsx                 Consistent empty-state treatment
    ConfirmDialog.tsx              Accessible confirmation dialog
    Icon.tsx                       Centralized Lucide icon wrapper
    TrendChart.tsx                 Responsive line/bar chart plus table view
  domain/
    models.ts                      Domain types
    validation.ts                  Input validation functions
    workout.ts                     Session creation and workout calculations
    guidedWorkout.ts               Ordered progression and rest-timer transitions
    progress.ts                    Personal-best and trend calculations
    muscleSets.ts                  Weighted muscle-set calculations
  data/
    defaults.ts                    Exercise catalog and starter programs
    repository.ts                  Typed persistence contract
    localStorageRepository.ts      Versioned browser implementation
    migrations.ts                  Persisted-schema parsing and migrations
  hooks/
    useAppData.ts                  Repository-backed application state
    useElapsedTime.ts              Active workout elapsed timer
    useRestTimer.ts                Timestamp-based rest countdown
    useWakeLock.ts                 Optional screen wake-lock enhancement
  features/today/TodayPage.tsx     Today dashboard
  features/programs/ProgramsPage.tsx
  features/programs/ProgramForm.tsx
  features/programs/WorkoutTemplateForm.tsx
  features/programs/ExerciseContributionForm.tsx
  features/workout/StartWorkoutDialog.tsx
  features/workout/WorkoutPage.tsx
  features/workout/GuidedWorkout.tsx
  features/workout/RestTimer.tsx
  features/workout/ExerciseLogger.tsx
  features/workout/SetRow.tsx
  features/history/HistoryPage.tsx
  features/history/WorkoutDetail.tsx
  features/progress/ProgressPage.tsx
  features/progress/ExerciseProgress.tsx
  features/progress/DailyVolumeProgress.tsx
  features/muscles/MuscleSummaryPage.tsx
  features/settings/SettingsPage.tsx
  styles/tokens.css                Color, typography, spacing, and focus tokens
  styles/global.css                Reset and application-wide layout
  main.tsx                         React entry point
tests/
  setup.ts                         DOM matchers and localStorage cleanup
  domain/workout.test.ts           Workout rule tests
  domain/guided-workout.test.ts    Exercise order and timer transition tests
  domain/progress.test.ts          Progress calculation tests
  domain/muscle-sets.test.ts       Weighted muscle contribution tests
  data/repository.test.ts          Persistence and migration tests
  features/program-form.test.tsx   Program and workout-template behavior
  features/workout-page.test.tsx   Logging and completion behavior
  features/guided-workout.test.tsx Guided flow and rest controls
  features/progress-page.test.tsx  Graph metric and range behavior
  features/muscle-summary.test.tsx Muscle summary behavior
  features/settings.test.tsx       Import/export and deletion behavior
e2e/
  workout-flow.spec.ts             Primary end-to-end path
  responsive.spec.ts               Narrow and desktop smoke checks
  analytics.spec.ts                Graph and muscle-summary flow
  guided-workout.spec.ts           Ordered workout and rest timer flow
vercel.json                        Static SPA deployment configuration
README.md                          Setup, scripts, decisions, and data policy
```

---

### Task 1: Establish the tested application shell

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `playwright.config.ts`
- Create: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `eslint.config.js`
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/navigation.ts`
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `tests/setup.ts`
- Modify: `.gitignore`, `README.md`

**Interfaces:**
- Produces: `type AppRoute = 'today' | 'programs' | 'workout' | 'history' | 'progress' | 'muscles' | 'settings'`.
- Produces: scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:run`, and `test:e2e`.

- [ ] Initialize Vite React TypeScript dependencies, Recharts, and test tooling, then pin the resolved versions in `package-lock.json`.
- [ ] Configure strict TypeScript, React linting, jsdom tests, coverage output, and Playwright's Chromium project.
- [ ] Write a failing app-shell test that expects one `main` landmark, an `h1` named “Today”, and keyboard-operable navigation.
- [ ] Implement the minimal app shell and in-memory route selection so the test passes.
- [ ] Add global tokens from `planning/design.md`, including a 3px visible focus ring and reduced-motion rules.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test:run`, and `npm run build`; all must exit 0.
- [ ] Commit as `chore: initialize workout tracker application`.

**Acceptance criteria:** `npm install && npm run dev -- --host 0.0.0.0` opens a styled Today shell from a PC and a phone on the same network; all seven destinations are reachable by mouse, keyboard, and touch; the production build succeeds without TypeScript errors.

### Task 2: Implement domain rules and versioned local persistence

**Files:**
- Create: `src/domain/models.ts`, `src/domain/validation.ts`, `src/domain/workout.ts`
- Create: `src/data/defaults.ts`, `src/data/repository.ts`, `src/data/localStorageRepository.ts`, `src/data/migrations.ts`
- Create: `src/hooks/useAppData.ts`
- Test: `tests/domain/workout.test.ts`, `tests/data/repository.test.ts`

**Interfaces:**
- Produces: `createSession(program: Program, workout: WorkoutTemplate, exercises: ExerciseDefinition[], now: string): WorkoutSession`.
- Produces: `calculateSessionVolume(session: WorkoutSession): number`.
- Produces: `validateProgram(input: Program): Record<string, string>`.
- Produces: `WorkoutRepository` with `load(): AppDataV1`, `save(data: AppDataV1): void`, `exportJson(): string`, `importJson(json: string): AppDataV1`, and `clear(): void`.

- [ ] Write failing tests for every program, workout-template, exercise-contribution, set, and volume rule listed in the Domain Model section.
- [ ] Write failing repository tests for first-run defaults, a save/load round trip, malformed JSON, unknown schema versions, and data migration.
- [ ] Implement pure validation, session creation, and calculation functions until domain tests pass.
- [ ] Implement the repository with storage key `workout-tracker:data`, defensive JSON parsing, and schema version 1.
- [ ] Implement `useAppData` with explicit actions for programs, workout templates, exercise definitions, active sessions, completed sessions, imports, and deletion.
- [ ] Run domain and repository tests, then the full verification suite.
- [ ] Commit as `feat: add workout domain and local persistence`.

**Acceptance criteria:** Reloading preserves valid data; corrupt or unsupported data produces a recoverable error and does not overwrite the stored value; no component accesses browser storage directly.

### Task 3: Build responsive navigation and the Today experience

**Files:**
- Create: `src/components/AppShell.tsx`, `src/components/EmptyState.tsx`, `src/components/Icon.tsx`
- Create: `src/features/today/TodayPage.tsx`
- Modify: `src/app/App.tsx`
- Test: `tests/features/today-page.test.tsx`

**Interfaces:**
- Consumes: `AppRoute`, `AppDataV1`, and active-session actions from `useAppData`.
- Produces: `TodayPageProps` with saved programs, latest completed session, active session, and navigation callbacks.

- [ ] Write tests for first-use, active-workout, and returning-user states using honest fixture data.
- [ ] Implement desktop sidebar navigation that becomes bottom navigation below the content-driven breakpoint.
- [ ] Implement Today with a single primary action: Start workout, Resume workout, or Create first program depending on state.
- [ ] Calculate weekly consistency from completed session dates and show it as text plus a visual indicator.
- [ ] Verify tab order, 320px reflow, 200% zoom behavior, and reduced-motion styling.
- [ ] Run the full verification suite and commit as `feat: add today dashboard and navigation`.

**Acceptance criteria:** A new user sees a clear first action; an active workout is never hidden; no horizontal page scroll occurs at 320px.

### Task 4: Build program, workout-template, and muscle-contribution management

**Files:**
- Create: `src/features/programs/ProgramsPage.tsx`, `src/features/programs/ProgramForm.tsx`
- Create: `src/features/programs/WorkoutTemplateForm.tsx`, `src/features/programs/ExerciseContributionForm.tsx`
- Create: `src/components/ConfirmDialog.tsx`
- Modify: `src/app/App.tsx`, `src/hooks/useAppData.ts`
- Test: `tests/features/program-form.test.tsx`

**Interfaces:**
- Consumes: domain validation and program, workout-template, and exercise-definition CRUD actions.
- Produces: `ProgramFormProps` with `initialValue`, `exerciseCatalog`, `onSave`, and `onCancel`.
- Produces: `ExerciseContributionFormProps` with `exercise`, `muscleGroups`, `onSave`, and `onCancel`.

- [ ] Write failing tests for required program and workout names, rep-range and rest-time validation, adding/removing/reordering workouts and exercises, cancellation, duplication, and successful save.
- [ ] Write failing tests for the Dumbbell Chest Press contribution `{ chest: 1, triceps: 0.5, frontDelts: 0.5 }`, invalid contribution increments, and a custom exercise with no selected muscle.
- [ ] Implement the programs list with empty, populated, and filtered-empty states.
- [ ] Implement accessible labeled controls for program metadata, workout templates, target sets/reps, and per-exercise rest seconds.
- [ ] Provide Move Up and Move Down buttons for exercise order so ordering never depends on drag gestures alone.
- [ ] Implement muscle-contribution editing with the fixed major-muscle list and contribution choices 0, 0.25, 0.5, 0.75, and 1.0.
- [ ] Implement create, edit, duplicate, and confirmed delete actions; return focus after dialog close.
- [ ] Ensure deleting or editing a program or exercise does not delete or recalculate completed sessions that contain snapshots.
- [ ] Run the full verification suite and commit as `feat: add program management`.

**Acceptance criteria:** A keyboard-only user can create a program with multiple workout templates, define exercise muscle contributions, and edit or duplicate it; invalid values are identified in text and focus moves to the first invalid field; deletion requires confirmation.

### Task 5: Implement the active workout logger

**Files:**
- Create: `src/features/workout/StartWorkoutDialog.tsx`
- Create: `src/features/workout/WorkoutPage.tsx`, `src/features/workout/ExerciseLogger.tsx`, `src/features/workout/SetRow.tsx`
- Create: `src/hooks/useElapsedTime.ts`
- Modify: `src/app/App.tsx`, `src/hooks/useAppData.ts`
- Test: `tests/features/workout-page.test.tsx`

**Interfaces:**
- Consumes: `createSession(program, workout, exercises, now)`, repository state actions, and prior completed sessions.
- Produces: active-session edits that persist immediately after each meaningful change.

- [ ] Write failing tests for required program/workout selection, remembering the last selected program, starting, resuming, logging values, switching set kind, completing a set, adding/removing a set, finishing, and discarding.
- [ ] Implement a Start Workout dialog that requires the user to select one saved program and one workout template from that program before Start becomes enabled.
- [ ] Implement elapsed time derived from `startedAt`; do not persist timer ticks.
- [ ] Show the previous completed value for the same exercise and set index when one exists.
- [ ] Implement large touch-friendly number inputs, Working/Warm-up selection, and completion controls with visible units.
- [ ] Persist edits, prevent a second simultaneous session, and preserve data through reloads.
- [ ] Implement Finish validation and a completion summary; implement Discard through a confirmation dialog.
- [ ] Verify the complete workflow with keyboard only and at 320px, 768px, and 1440px widths.
- [ ] Run the full verification suite and commit as `feat: add active workout logging`.

**Acceptance criteria:** The session visibly names its selected program and workout; no entered set disappears on reload; completed-set status is conveyed by text/icon as well as color; the session snapshots exercise order, muscle contributions, and rest durations; finishing creates exactly one completed history record and clears the active session.

### Task 6: Add guided workout progression and per-exercise rest timers

**Files:**
- Create: `src/domain/guidedWorkout.ts`
- Create: `src/hooks/useRestTimer.ts`, `src/hooks/useWakeLock.ts`
- Create: `src/features/workout/GuidedWorkout.tsx`, `src/features/workout/RestTimer.tsx`
- Modify: `src/features/workout/WorkoutPage.tsx`, `src/features/workout/ExerciseLogger.tsx`, `src/hooks/useAppData.ts`
- Test: `tests/domain/guided-workout.test.ts`, `tests/features/guided-workout.test.tsx`

**Interfaces:**
- Produces: `getNextIncompleteSet(session: WorkoutSession, fromExerciseId?: Id, fromSetId?: Id): { exerciseId: Id; setId: Id } | null`.
- Produces: `completeGuidedSet(session: WorkoutSession, exerciseId: Id, setId: Id, now: string): WorkoutSession`.
- Produces: `skipRest(session: WorkoutSession): WorkoutSession`.
- Produces: `extendRest(session: WorkoutSession, seconds: 30): WorkoutSession`.
- Produces: `getRemainingRestSeconds(rest: RestTimerState, now: string): number`.

- [ ] Write failing domain tests for first exercise/set selection, same-exercise progression, next-exercise progression, zero-second rest, final-set behavior, manual selection, and preserving incomplete skipped sets.
- [ ] Write failing timer tests proving a 90-second timer stores exact `startedAt`/`endsAt` timestamps, reloads with the correct remainder, clamps at zero, advances exactly once on expiry, and extends by exactly 30 seconds.
- [ ] Implement pure guided-workout transitions without `setTimeout` or browser APIs in the domain layer.
- [ ] Implement `useRestTimer` so rendering ticks update the display, while all authoritative remaining-time calculations use persisted `endsAt`.
- [ ] Implement the guided workout layout with current exercise, current set, next-up preview, progress such as “Exercise 2 of 6,” and the full ordered exercise list.
- [ ] Completing a set must immediately persist the set and guide state, then show the rest screen using that workout exercise's snapshotted `restSeconds`.
- [ ] Implement Rest Timer controls for `+30 sec`, `Skip rest`, and sound on/off; keep all controls operable by touch and keyboard.
- [ ] Add optional vibration, audible completion cue, wake lock, and system notification behind feature detection and user permission; show no error when unsupported or denied.
- [ ] On visibility change, refresh, or resume, recompute time from `endsAt`; if elapsed, advance once and announce the next set through a polite live region.
- [ ] Verify 320px portrait use with one hand, 200% zoom, reduced motion, the screen locked longer than the timer, and an unsupported Wake Lock/Notification API environment.
- [ ] Run the full verification suite and commit as `feat: add guided workouts and rest timers`.

**Acceptance criteria:** Pressing Start focuses the first planned set; each completed non-final set starts that exercise's configured rest countdown; timer expiry or Skip Rest advances in template order; refresh/backgrounding cannot reset or lengthen rest; the last planned set presents Finish Workout instead of an unnecessary timer.

### Task 7: Add workout history and responsive weight/volume graphs

**Files:**
- Create: `src/domain/progress.ts`
- Create: `src/components/TrendChart.tsx`
- Create: `src/features/history/HistoryPage.tsx`, `src/features/history/WorkoutDetail.tsx`
- Create: `src/features/progress/ProgressPage.tsx`, `src/features/progress/ExerciseProgress.tsx`
- Create: `src/features/progress/DailyVolumeProgress.tsx`
- Modify: `src/app/App.tsx`
- Test: `tests/domain/progress.test.ts`, `tests/features/history-page.test.tsx`, `tests/features/progress-page.test.tsx`

**Interfaces:**
- Produces: `getExercisePersonalBest(sessions, exerciseId): WorkoutSet | null`.
- Produces: `getExerciseTrend(sessions, exerciseId): Array<{ date: string; maxWeightKg: number; volumeKg: number }>`.
- Produces: `getDailyVolumeTrend(sessions): Array<{ date: string; volumeKg: number }>`.
- Produces: `getSessionSummary(session): { completedSets: number; volumeKg: number; durationSeconds: number }`.

- [ ] Write failing tests for empty history, tie-breaking personal bests, incomplete sets, zero-weight sets, exercise/date grouping, local-day boundaries, volume totals, and chronological ordering.
- [ ] Implement pure progress calculations until tests pass.
- [ ] Implement History list and detail views with semantic dates, duration, set count, and volume units.
- [ ] Implement Exercise Progress with exercise selection, Weight/Volume metric selection, 4-week/12-week/All-time ranges, personal bests, and recent best sets.
- [ ] Implement Daily Volume as a date-based bar graph using total completed-set volume across all exercises for each local calendar day.
- [ ] Implement `TrendChart` with responsive Recharts sizing, explicit axis units, keyboard-accessible metric/range controls, a no-data state, and a toggleable data table containing every plotted value.
- [ ] Verify long exercise names, single-point graphs, large data ranges, empty states, 320px width, and pointer-free operation.
- [ ] Run the full verification suite and commit as `feat: add workout history and progress`.

**Acceptance criteria:** A user can graph either maximum weight or total volume for any exercise and total volume by day; all displayed statistics derive from completed valid sets; every charted value is available in a table; history survives program or exercise edits and deletions.

### Task 8: Add weighted muscle-set summaries

**Files:**
- Create: `src/domain/muscleSets.ts`
- Create: `src/features/muscles/MuscleSummaryPage.tsx`
- Modify: `src/features/today/TodayPage.tsx`, `src/features/history/WorkoutDetail.tsx`, `src/app/App.tsx`
- Test: `tests/domain/muscle-sets.test.ts`, `tests/features/muscle-summary.test.tsx`

**Interfaces:**
- Produces: `getSessionMuscleSets(session: WorkoutSession): Record<MuscleGroup, number>`.
- Produces: `getMuscleSetsByDate(sessions: WorkoutSession[], startDate: string, endDate: string): Array<{ date: string; muscles: Record<MuscleGroup, number> }>`.
- Produces: `getMuscleSetTotals(sessions: WorkoutSession[], startDate: string, endDate: string): Record<MuscleGroup, number>`.

- [ ] Write failing tests proving one completed Dumbbell Chest Press working set produces chest `1.0`, triceps `0.5`, and front delts `0.5`.
- [ ] Write failing tests proving three such sets produce chest `3.0`, triceps `1.5`, and front delts `1.5`.
- [ ] Write failing tests for warm-up exclusion, incomplete-set exclusion, multiple exercises, multiple sessions on one day, date-range boundaries, and zero-data muscles.
- [ ] Implement weighted effective-set calculations from the muscle-contribution snapshots stored inside each completed session.
- [ ] Implement the Muscles page with Session/Day/Week/Custom range controls, one row per major muscle, decimal values, and explanatory copy defining “effective sets.”
- [ ] Add the same session-level summary to Workout Detail and a compact current-week summary to Today.
- [ ] Sort nonzero muscles by effective sets while keeping zero values available through an “All muscles” toggle.
- [ ] Verify the summary at 320px, at 200% zoom, with fractional values, and with long localized muscle labels.
- [ ] Run the full verification suite and commit as `feat: add weighted muscle set analytics`.

**Acceptance criteria:** Muscle summaries use completed working sets only, apply every exercise's stored fractional mapping exactly, never change when the exercise catalog is edited later, and clearly distinguish effective sets from physical sets.

### Task 9: Add safe data management settings

**Files:**
- Create: `src/features/settings/SettingsPage.tsx`
- Modify: `src/app/App.tsx`, `src/hooks/useAppData.ts`, `src/data/localStorageRepository.ts`
- Test: `tests/features/settings.test.tsx`, `tests/data/repository.test.ts`

**Interfaces:**
- Consumes: repository `exportJson`, `importJson`, and `clear` operations.
- Produces: downloadable `workout-tracker-backup-YYYY-MM-DD.json` files and validated import results.

- [ ] Write failing tests for export content, valid import, malformed import, unsupported version, reset sample data, and confirmed deletion.
- [ ] Write failing tests for persisting rest sound, vibration, and keep-screen-awake preferences without assuming browser API support.
- [ ] Implement download-based export without uploading data anywhere.
- [ ] Implement file import with size limit, schema validation, a summary preview, and explicit replacement confirmation.
- [ ] Implement reset and delete-all flows with distinct wording; require typing `DELETE` for delete-all.
- [ ] Announce import/export success and errors through a polite live-status region.
- [ ] Run the full verification suite and commit as `feat: add workout data controls`.

**Acceptance criteria:** Exports and imports preserve programs, workout templates, exercise contribution mappings, guided session state, rest-alert preferences, sessions, and settings; invalid imports never mutate current data; delete-all is difficult to trigger accidentally; the UI states clearly that data remains on the current browser and is not synchronized across devices.

### Task 10: Cross-device web release, end-to-end verification, and documentation

**Files:**
- Create: `e2e/workout-flow.spec.ts`, `e2e/guided-workout.spec.ts`, `e2e/responsive.spec.ts`, `e2e/analytics.spec.ts`, `vercel.json`
- Modify: `README.md` and any source files required by verified defects

**Interfaces:**
- Consumes: the complete application.
- Produces: reproducible setup and verification instructions.

- [ ] Write an end-to-end test that creates a Push/Pull/Legs program with Push and Pull workouts, selects Push for the session, logs Dumbbell Chest Press `60 kg × 8`, completes the working set, finishes, and verifies the program/workout names in History.
- [ ] Write a guided-workout end-to-end test with two exercises and fake clock control: Start selects exercise 1/set 1, completion starts its configured rest, `+30 sec` extends it, expiry advances through the remaining sets, then moves to exercise 2 in stored order.
- [ ] Write an analytics end-to-end test that verifies the session produces a `60 kg` exercise-weight point, `480 kg` exercise/day volume, chest `1.0` effective set, triceps `0.5`, and front delts `0.5`.
- [ ] Write responsive smoke tests at 320×800, 390×844, 768×1024, and 1440×900 that check navigation visibility, graph resizing, touch-target sizing, and absence of document-level horizontal overflow.
- [ ] Run Playwright with keyboard interactions for the primary flow and correct any focus-order or accessible-name failures.
- [ ] Run the production build and inspect the rendered app in Chromium at all representative widths, complete and verify one guided two-exercise session with live rest timers on a real mobile browser, then independently verify the guided controls and desktop layout in a desktop browser on the local network.
- [ ] Test a reload during an active session, a malformed stored payload, reduced motion, 200% browser zoom, and a long custom exercise name.
- [ ] Run `npm run lint && npm run typecheck && npm run test:run && npm run build && npm run test:e2e`; every command must exit 0.
- [ ] Configure Vercel to serve `dist`, rewrite SPA routes to `index.html`, use HTTPS, and add safe static-asset cache headers.
- [ ] Deploy a production preview, verify direct-link reloads and offline-safe local data behavior, and record the final public HTTPS URL in `README.md`.
- [ ] Document prerequisites, install/run/test/deploy commands, mobile and desktop access, per-browser local data behavior, backup/restore, program structure, muscle-set methodology, graph definitions, project structure, MVP scope, and deferred cross-device sync.
- [ ] Commit as `docs: complete workout tracker mvp verification`.

**Acceptance criteria:** The main user journey and analytics checks pass in a clean browser profile; the HTTPS deployment opens and remains usable on a real phone and PC; graphs and muscle summaries reflow correctly; all automated checks pass; README instructions reproduce the result from a fresh clone.

---

## Definition of Done

- A user can open the deployed web app on phone or PC, create multiple programs with multiple workout templates, choose the program/workout for a session, log and complete sets, finish it, and see the result in History and Progress.
- An unfinished workout survives refresh and can be resumed.
- Pressing Start enters guided mode at the first exercise and set, then advances through the stored exercise order.
- Completing a non-final set starts that exercise's configured rest timer; refresh, backgrounding, and interval throttling cannot reset or lengthen it.
- Rest completion is always visible in the app, with optional sound, vibration, wake lock, and system notifications when supported and allowed.
- Exercise analytics graph maximum working weight and total volume over time; daily analytics graph total completed volume by local date.
- Muscle analytics apply fractional contribution mappings to completed working sets, including the required Dumbbell Chest Press mapping of chest `1.0`, triceps `0.5`, and front delts `0.5` per set.
- Every graph has readable units, a no-data state, and a table exposing the plotted values.
- Invalid data cannot silently corrupt or replace valid stored data.
- All primary actions work with keyboard, touch, and pointer input.
- Empty, validation-error, confirmation, success, and corrupt-storage recovery states are implemented.
- No document-level horizontal overflow occurs at 320px or at 200% zoom.
- Unit, component, and end-to-end tests pass alongside lint, typecheck, and production build.
- README accurately describes local-only storage and the limits of the MVP.
- The public HTTPS deployment is verified in at least one real mobile browser and one desktop browser.

## Delivery Sequence

Tasks 1–2 establish the foundation. Tasks 3–5 deliver the multi-program logging loop. Task 6 turns it into a guided workout companion with persistent rest timing. Tasks 7–8 add graphs and muscle analytics. Task 9 adds ownership of local data. Task 10 is the cross-device web release gate. The first meaningful product checkpoint is after Task 6; do not begin cloud sync or post-MVP features before the guided workout has been tested during a real training session.

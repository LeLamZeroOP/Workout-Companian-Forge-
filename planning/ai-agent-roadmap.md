# Forge AI and agent feature roadmap

Date: 16 October 2026  
Status: Proposal for review. Planning only; no app implementation, external AI calls, deployment, or scheduled jobs are authorized by this document.

## Recommended direction

Add a personal training coach that can read the user's actual journal, explain its findings, and prepare useful actions. Start with one coach and a small set of specialist workflows: workout questions, program drafting, assisted logging, and weekly review. Introduce independently scheduled work when the interactive workflows are reliable.

The first release should contain the **Workout Coach** and **AI Program Builder**. They make immediate use of the existing training data and exercise library without requiring camera analysis, wearable integrations, or a new logging system.

## What the app already supports

Repository inspection found:

- Previous-performance matching by exercise occurrence, set kind, and actual session dates: `src/domain/previousPerformance.ts`.
- Recorded sets, session snapshots, program templates, editable muscle roles, and repeat-cycle metadata: `src/domain/models.ts`.
- A 200-exercise catalog and selected technique videos: `src/domain/exerciseCatalog.ts`, `src/data/exerciseVideos.ts`.
- Planned muscle-volume summaries and explicit treatment of unknown classifications: `src/domain/programMuscleVolume.ts`.
- Exercise trends, personal bests, and completed-session summaries: `src/domain/progress.ts`, `src/domain/trainingOverview.ts`.
- Program validation, mutation scopes, save rejection, local drafts, and sync conflict handling: `src/domain/workout.ts`, `src/domain/appMutations.ts`, `src/hooks/useWorkoutDraft.ts`.

No AI provider SDK, chat feature, agent orchestration, or speech workflow was found in the inspected application source and package manifest. The current hosting configuration routes the app as a SPA; an authenticated AI endpoint needs a deliberate server routing design.

Important limits: the journal currently records kilograms and repetitions, not structured effort/RIR, readiness, timed exercise sets, or anchored calendar appointments. The coach must not invent those inputs or treat the existing next-workout suggestion as a dated schedule.

## Prioritized features

| Priority | Feature | Example request | Visible result | Relative effort |
| --- | --- | --- | --- | --- |
| 1 | Workout Coach | “How did my last three bench sessions compare?” | A short explanation with dates, recorded sets, and links to the underlying sessions. | Medium |
| 2 | AI Program Builder | “Build a four-day plan using dumbbells and cables, about 45 minutes per session.” | An editable program draft using real catalog IDs, with assumptions, estimated duration, and a muscle-volume preview. | Medium–large |
| 3 | Logging Agent | “Log 30 kg for 10 reps on this set.” | A parsed action preview; confirmation saves through the existing workout workflow. | Medium |
| 4 | Weekly Review Agent | “Review this week's training and suggest what to focus on next.” | A dated report covering recorded activity, trends, and a small number of explained proposals. | Medium interactively; larger with scheduling |
| 5 | Workout Adaptation Agent | “I have 25 minutes and the cable station is occupied.” | A proposed shorter workout and equipment-appropriate substitutions, each with its rationale and demonstration. | Large |

Effort is a relative planning estimate, not a delivery commitment. All five features can ship separately.

### 1. Workout Coach

Add an **Ask Coach** entry on Workout and Progress, with a compact panel that preserves typed set values and the main logging controls. Suggested prompts should match the current exercise and available history.

Initial capabilities:

- Compare recent recorded performances using the existing previous-performance rules.
- Explain load, repetitions, completed sets, and recorded volume without confusing them.
- Explain planned muscle contributions and user-defined targets, labeling estimates and incomplete mappings.
- Find exercises by equipment or muscle and open the app's selected technique demonstration.
- Explain what information is missing before suggesting a next-session adjustment. Present an adjustment as an optional proposal, with its assumptions and supporting records.

The first coach is read-only. It must state when there is too little history rather than fabricate a trend, fatigue score, or reason for a plateau. A video link is a demonstration reference; it does not mean the coach has assessed the user's technique.

**Acceptance:** opening and using the coach does not mutate programs, sets, or rest timers. Numerical claims match application calculations. Answers identify the records and period used. Unknown values remain unknown. Offline or provider failure leaves ordinary logging usable.

### 2. AI Program Builder

Add **Build with AI** beside the existing program-creation action. Collect goal, training experience, available equipment, training days, approximate session-time budget, and exercise preferences. Ask only for missing constraints that change the draft.

The builder selects from `availableExercises(saved)` so custom definitions and saved overrides remain available. The app validates the generated draft with `validateProgram` and calculates its volume summary using existing domain functions.

Show the complete draft in the existing editor, with exercise order, sets, rep ranges, rest, demonstrations, and clearly labeled duration assumptions. Time is an estimate because current records do not provide exact duration for every exercise/set. The user can revise the draft and explicitly save it as a new program. Editing an existing program requires a visible change preview.

**Acceptance:** every exercise ID resolves; drafts satisfy equipment constraints and program validation; unknown target classifications are explicit. Generation failure does not save a partial program. Saving never rewrites historical sessions or an active workout's snapshot.

### 3. Logging Agent

Start with typed natural language; add push-to-talk after the action workflow is reliable. Support logging one set, preparing the previous compatible load/reps, and adding an exercise by a confirmed catalog match.

For “same as last time,” use the existing occurrence/set-kind/set-position logic. Ask when exercise identity, units, per-hand load, assistance, or target set is ambiguous. The current kilogram-only interface remains authoritative; any future unit conversion must be visible and confirmed.

Display the parsed exercise, target set, kilograms, repetitions, and completion intent before applying. The confirmation uses the same validation, save result, rest timing, and conflict handling as manual logging. Repeated delivery of the same confirmed action must not duplicate a set or restart rest. Saving is acknowledged only after the existing persistence callback accepts the change.

**Acceptance:** cancel changes nothing; rejected saves preserve the proposed values; confirmation cannot target a stale or different workout. Ambiguous commands do not create records. Voice activation is user initiated and has a typed fallback.

### 4. Weekly Review Agent

First provide an on-demand **Review my week** action on Today/Progress. Use a visible date range and the user's local-date rules. Summarize actual completed sessions and valid working sets, compare compatible exercise results, and distinguish planned volume from performed volume.

Limit recommendations to a few actionable proposals, each with supporting records and uncertainty. A lack of logged sessions does not prove the user skipped training. Do not report missed scheduled days without a dated schedule. Do not infer sleep, injury, fatigue, nutrition compliance, or recovery from absent data.

Later add opt-in background delivery. This needs a real server scheduler, persisted user timezone and preferences, account-scoped access, cancellation, and a unique report key per reporting period. A repeated job updates/reuses the report rather than sending duplicates. The app must not promise delivery while closed until that infrastructure exists.

**Acceptance:** reporting windows and warm-up handling are reproducible; reports preserve data citations; generating a report does not change the program. Scheduling is independently tested for timezone boundaries, retries, opt-out, and duplicate prevention.

### 5. Workout Adaptation Agent

Collect remaining time, available equipment, and the user's priorities. Propose changes to unfinished work; completed sets remain attached to their original movements.

Before offering automatic substitution ranking, add reviewed movement-pattern/substitution metadata. Sharing a muscle contribution alone is insufficient to treat exercises as equivalent. Filter candidates deterministically before the AI explains the tradeoffs. Preserve the current replacement behavior for cleared unfinished values, setup notes, and save conflicts.

**Acceptance:** the preview explains removed or replaced work, estimated timing, and equipment requirements. Completed history remains unchanged. Confirmation is required before applying the adaptation. Unsupported constraints produce a clear limitation rather than an invented exercise.

## Agent architecture

Use one user-facing coach with typed tools and separate specialist instructions/workflows. Keep numerical calculations, catalog resolution, validation, and persistence in the application's existing deterministic code.

This is an architectural recommendation informed by [Anthropic's guidance on simple agent/workflow designs](https://www.anthropic.com/engineering/building-effective-agents) and its [application-executed tool-use model](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview). These are implementation references, not a selection of Anthropic as the app's provider. The model can request an operation; the application remains responsible for executing and checking it.

Suggested read tools: current-workout context, compatible previous sets, exercise search, selected demonstration lookup, program-volume summary, and dated progress summary. Return compact results with record IDs, dates, units, missing-data flags, and a context revision.

AI output can include a structured proposal. A separate application action layer validates its schema, allowed operation, current target, and revision before offering confirmation. The model never receives arbitrary database-write access. User approvals authorize specific proposed actions; they do not create unrestricted continuing write permission.

Additional foundations:

- A server-side AI gateway with authentication, bounded requests, rate limits, timeouts, cancellation, and server-held provider credentials. Provider secrets never go into `VITE_` client variables.
- An explicit first-use explanation of what selected context is sent to the AI service. Default to relevant training context; body and nutrition context are separate opt-ins. Do not upload complete backups or unrelated personal records by default.
- Editable coaching preferences for goals, equipment, and response style, stored separately from recorded workout facts. Provide a way to reset coaching memory.
- Treat exercise names, imported notes, video descriptions, and model-generated text as untrusted content, not instructions authorizing tools or data access.
- Reuse existing save/conflict handling. Long-running responses must not apply against a workout that changed while the model was responding. Confirmation IDs prevent duplicate application; undo must not overwrite newer edits.
- Keep ordinary logging, the exercise library, and history available when AI is disabled or unavailable.

## Context map for later implementation

These are proposed touch points, not files changed in this planning task.

| Area | Existing references | Proposed addition/change |
| --- | --- | --- |
| Coach UI | `src/app/App.tsx`, `src/features/workout/GuidedWorkout.tsx`, `src/features/progress/ProgressPage.tsx` | New `src/features/coach/` panel and context-aware entry points. |
| Verified context | `src/domain/previousPerformance.ts`, `trainingMetrics.ts`, `progress.ts`, `programMuscleVolume.ts`, `trainingOverview.ts` | New `src/domain/coachContext.ts` adapters that return computed facts and source references. |
| Provider access | `vercel.json`, current auth/session integration | New server endpoint such as `api/coach.ts`, plus an explicit API routing/authentication design before implementation. |
| Proposal actions | `src/domain/appMutations.ts`, `canonical.ts`, `sessionEditing.ts`, `src/hooks/useWorkoutDraft.ts` | New `src/domain/coachActions.ts` allowlist, revision checks, confirmations, and duplicate prevention. |
| Program drafting | `src/features/programs/ProgramsPage.tsx`, `ProgramForm.tsx`, `src/domain/workout.ts`, `exerciseCatalog.ts` | AI intake and preview feeding the existing editor and validator. |
| Coaching preferences/reports | `src/domain/models.ts`, `src/data/validateAppData.ts`, existing import/export and account storage | Define a separate versioned persistence design; add migrations only if new fields enter saved application documents. |
| Substitutions | `src/domain/models.ts`, built-in catalog files, `src/features/workout/ExerciseActions.tsx` | Reviewed movement metadata and filtered proposal previews. |

Dependencies: active/saved snapshots, local/cloud account scope, optional AI-service availability, and existing conflict semantics. Server routing/configuration changes are required for real AI calls. Saved-schema and database changes depend on the chosen memory/report storage design and require explicit compatibility planning; none are needed for this planning document.

Reference tests include `tests/domain/previous-performance.test.ts`, `program-muscle-volume.test.ts`, `training-overview.test.ts`, `tests/features/program-form.test.tsx`, `workout-draft.test.tsx`, `save-failure-retention.test.tsx`, and the existing exercise-technique/browser checks.

## Delivery plan

1. **Foundation and read-only coach:** define tool/output contracts and data-sharing controls, build deterministic context adapters, introduce the server gateway, and ship the coach panel with cited history answers.
2. **Program drafting:** add constrained intake, structured drafts, validation, editable previews, and explicit save through the existing program workflow. This completes the recommended first release.
3. **Confirmed logging:** introduce the action preview/confirmation/revision contract for typed commands; add voice only after the typed path passes failure and ambiguity checks.
4. **Weekly review:** ship on-demand reports first; add optional persistent reports and real background scheduling as a separately reviewable increment.
5. **Adaptive workouts:** add reviewed substitution metadata, time/equipment filtering, and confirmation of changes to unfinished work.

Each increment should include deterministic tests, provider-response fixtures, a small live evaluation, and responsive review before release. Keep model/provider choice open until representative prompts have been evaluated for factual accuracy, useful answers, latency, and request cost. Do not choose a model based only on its advertised capability.

## Verification and release gates

- Evaluate first-use/no-history, repeated exercise blocks, warm-up versus working sets, incomplete records, same-day sessions, custom exercises, saved overrides, and conflicting updates.
- Require exact agreement with application calculations for numerical claims and valid catalog IDs for all generated exercises.
- Test ambiguous logging, rejected saves, double confirmation, cancellation, stale responses, offline operation, and provider failures.
- Include adversarial imported notes that try to instruct the agent to reveal data or execute unrelated actions.
- For program drafts, evaluate equipment fit, transparency of assumptions, and usability of the editable result; do not judge only grammatical quality.
- Record live model/version, representative prompt set, latency, and measured request cost during implementation. Model-driven answers are evaluated separately from deterministic persistence tests.
- Check the coach on small phones without obscuring Complete set, and preserve accessible focus and reduced-motion behavior.

## Defer from the first release

Camera-based form scoring, injury diagnosis, automatic calorie or program changes, external messaging, autonomous record deletion, wearable integrations, and a large network of independently chatting agents. Meal assistance can be considered later if requested; this proposal does not reopen the earlier food-catalog expansion.

## Review decision

Recommended first scope: **read-only Workout Coach plus AI Program Builder with editable previews**. The remaining features are an ordered follow-up roadmap. Approval of this proposal should identify the next slice to implement; this planning task does not start that implementation.

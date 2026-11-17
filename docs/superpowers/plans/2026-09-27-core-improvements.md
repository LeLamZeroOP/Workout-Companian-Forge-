# Core improvements — 27 September 2026

The user requested a more distinctive workout editor, continuation of the roadmap, and explicitly selected “Complete the core improvements first.” This slice follows the already published reliability, selective merge, My foods, selection, and training library work. The changes below are local; production is still the earlier release.

## Delivered

- Program editor: numbered forest-green session headers, exercise/set totals, workout jump links, compact prescriptions, expandable notes and muscle coefficients, duplicate and reorder workouts. Template edits explain that saved sessions retain their own snapshots.
- Foundation: persisted System/Light/Dark preference, prepaint theme, semantic chart/dialog/control colors, simpler active navigation, visible mobile save status, compact Today with actual selected workout and exercise preview. No schedule is inferred.
- Workout: previous results matched by exercise ID and set kind, explicit reuse of recorded loads, locally durable account/session-scoped drafts, blur/action upload boundaries, acknowledgement reconciliation, explicit external-change recovery, snapshotted rep targets for new sessions, inline timestamp-based rest with the next set, completion undo, skipped-set wraparound, invalid completion prevention, and collapsible mobile exercise order. Draft comparisons use canonical content, not JSON property order. Pending acknowledgement fingerprints are pruned as saves arrive.
- Analytics: shared valid completed working-set definition across volume and muscle summaries; optional training warm-ups; load or volume shown individually; actual time spacing with linear lines and no chart animation; date filters; accessible tables. Load records compare load, then reps, then earliest session (session ID breaks exact timestamp ties). Original load conventions are retained, never inferred or converted.
- History: workout/program/exercise search, date filters, explicit set correction with recalculated preview and stale-session guard. Templates are unaffected.
- Nutrition: recent-food filter; edit amount/date/meal using the saved diary nutrients; preserve unknown macros and deleted/catalog-changed food snapshots; meal/day copy preview, destination and duplicate warning, explicit confirmation, stable new IDs and one atomic queued batch. Local and cloud entry edits both upsert by ID.
- Body: retain accurate seven-entry average label; persist estimate eligibility confirmation and require old profiles to confirm it before generating a new estimate. Explain estimate inputs and macro proportions. Existing targets stay unchanged until explicitly replaced.

## Verification

- Full unit/integration suite: 159 tests across 42 files passed. After the final rep-target and shared-volume adjustments, the affected 30 tests across six files passed again.
- Chromium: all 13 scenarios passed, including durable typing/reload, inline rest/undo, finish/history correction/previous-set reuse, immutable food edits/copy reload, 320–1440 px checks, theme persistence, reduced motion, offline shell, and two-tab waiting service worker.
- TypeScript production build, ESLint, and diff whitespace checks passed. Vite retains the existing >500 kB chunk warning.
- Inspected screenshots: `artifacts/editor-light.png`, `editor-dark.png`, `editor-mobile.png`, `workout-light.png`, `workout-dark.png`, `workout-mobile.png`, `progress-dark.png`, `today-dark.png`, and `nutrition-mobile.png`.
- Local tests use isolated fixture data; they do not modify real account data. No live account or physical phone acceptance is claimed for this new slice.
- Preview is served on http://127.0.0.1:4180/ to avoid the older preview origin's cached worker. It is a separate browser storage origin; import a backup when testing existing local records.

## Boundaries

Supersets, substitutions, RIR/RPE logging, recipes, automated progression, scheduling, program archiving, drag-and-drop ordering, and a replacement navigation structure are deferred. Existing Move up/down controls remain available. No schema version increment or production database migration is needed for this slice; optional profile eligibility and exercise rep targets are validated within schema 3. Older session targets are not inferred from current templates.

Legacy loads do not record per-dumbbell versus combined weight. Previous values are labeled as originally recorded, and reuse is deliberate. A browser cannot guarantee a rest alarm while suspended. The bundle still emits its existing size warning; no performance or physical-device acceptance claim is made.

The earlier in-app-browser stale production cache report remains separate from this locally verified release. No data clearing or forced service-worker takeover was introduced.


## Next planned slice: muscle workload for each split

User follow-up, 27 September 2026: expand the plan with per-muscle sets and target guidance for each split. The [new specification](../specs/2026-09-27-split-muscle-volume.md) and [implementation plan](2026-09-27-split-muscle-volume.md) cover explicit cycles, direct/indirect versus weighted counts, library/editor summaries, user targets, split comparison and completed-session accounting. This is a planning update only; these features are not included in the core delivery or its verification counts above.


Planning follow-up: the muscle-volume plan now includes Upper chest / Mid chest emphasis details and additional exercises. The requested food expansion was subsequently canceled by the user and is excluded. No application changes were made for this follow-up.

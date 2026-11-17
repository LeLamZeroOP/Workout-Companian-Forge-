# Split export and add-exercise choices — 17 November 2026

Local change; not deployed.

## Export a workout split

Programs → the download button on a program card saves `forge-split-<name>-<date>.forge.json`. It is a normal version-4 Forge document containing only that program and the exercise definitions it references (built-in and custom). Sessions, body, nutrition, merge history and settings are excluded. The document is validated before download; a program that references a missing exercise is not exported and the user is told to edit it first. Import uses the existing Settings → Merge selected data flow.

## Add exercise during a workout

The add dialog and the create-custom-exercise dialog now ask for sets (1–10), repetition range (1–100), rest (0–600 s) and position (end, first, or after any exercise). Defaults remain 3 × 8–12 with 90 s rest at the end. The current set, entered values and running rest timer are unchanged by an insertion. If the chosen neighbour is removed meanwhile, the exercise goes to the end.

Optional **Also add to <workout> in <program> for next time** saves the same prescription to the source program workout. It is offered only when the session came from a program workout that still exists and has fewer than 20 exercises. The session save happens first; the program save is separate. A failed program save keeps the exercise in the workout and shows an error toast. A failed workout save does not touch the program.

No schema or database migration.

## Verification

- TypeScript strict check (`tsc -p tsconfig.app.json`) passed.
- New tests: `tests/domain/add-exercise-options.test.ts` (7), `tests/domain/program-export.test.ts` (5), `tests/features/workout-add-exercise.test.tsx` (7), `tests/features/program-export.test.tsx` (1). All pass.
- Existing tests re-run and passing: all `tests/domain` (111), all `tests/data`, and feature tests for workout editing, custom exercises, workout page, workout draft, program form, edit conflicts, unsaved navigation and save-failure retention.
- These runs used a stand-in Node test runner because the OneDrive copy of `node_modules` returned I/O errors for Vite, Vitest and ESLint. Before publishing, run on the PC: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test:run`, `pnpm build`, `pnpm test:e2e`.
- Not visually reviewed in a browser or on a phone.

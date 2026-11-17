# Split export and add-exercise choices — 17 November 2026

Published to https://workout-companian-forge.vercel.app on 17 November 2026.

- Deployment URL: https://workout-companian-forge-4bmvja8p2-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_7H5YXKUAtoLwhuC6ibmh2iKzehSm`.
- The build was staged with `vercel deploy --prod --skip-domain --yes`. It was Ready, and its bundle contained both features. It was then promoted with `vercel promote --yes`. `vercel inspect workout-companian-forge.vercel.app` shows this deployment as the Ready production deployment, and the public URL serves its bundle (`index-ClqsYW2b.js`).
- The upload was the local working copy, including the uncommitted verification fixes below. There was no Git commit or push and no database migration.
- To get the update, existing clients should finish any edits, close all Forge tabs and app windows, then reopen the main URL. Keep browser storage intact.

## Export a workout split

Programs → the download button on a program card saves `forge-split-<name>-<date>.forge.json`. It is a normal version-4 Forge document containing only that program and the exercise definitions it references (built-in and custom). Sessions, body, nutrition, merge history and settings are excluded. The document is validated before download; a program that references a missing exercise is not exported and the user is told to edit it first. Import uses the existing Settings → Merge selected data flow.

## Add exercise during a workout

The add dialog and the create-custom-exercise dialog now ask for sets (1–10), repetition range (1–100), rest (0–600 s) and position (end, first, or after any exercise). Defaults remain 3 × 8–12 with 90 s rest at the end. The current set, entered values and running rest timer are unchanged by an insertion. If the chosen neighbour is removed meanwhile, the exercise goes to the end.

Optional **Also add to <workout> in <program> for next time** saves the same prescription to the source program workout. It is offered only when the session came from a program workout that still exists and has fewer than 20 exercises. The session save happens first; the program save is separate. A failed program save keeps the exercise in the workout and shows an error toast. A failed workout save does not touch the program.

No schema or database migration.

## Verification (17 November 2026, real toolchain)

`node_modules` was deleted and reinstalled with `pnpm install` (pnpm 11.25.0, lockfile unchanged, 323 packages). Playwright's Chromium build was installed for @playwright/test 1.63.0.

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed, 0 errors, 0 warnings |
| `pnpm test:run` | 80 files, 376 tests passed |
| `pnpm build` | Passed. Only the existing warning that the main chunk is over 500 kB |
| `pnpm test:e2e` | 72 passed, 1 skipped (the opt-in live YouTube playback test) |

Changes made during verification:

- Lint first reported two `react-refresh/only-export-components` warnings in `AddExerciseSettings.tsx`. The draft type, defaults and parser moved to `src/features/workout/addExerciseDraft.ts`. There is no change in behaviour.
- `tests/features/training-library.test.tsx` › "previews and customizes a sourced split before saving it" takes 5–6 s in jsdom, even on its own and with `master`'s `ProgramsPage`. It now has a 20 s timeout. This was not caused by this branch.

Flakiness seen and not changed:

- Earlier full `pnpm test:run` runs had 16–17 tests time out at 5 s while the PC was busy, including OneDrive syncing the new `node_modules`. The failing tests changed between runs, and all of them passed in isolation and in the final full run.
- One earlier e2e run failed 8 tests at the first `page.goto` (`net::ERR_ABORTED` after 30 s) with no assertion failures. All 8 passed with `--last-failed`, and the final full run passed.

Browser check (local `dev:test` server, cloud sync off, 1280 × 900 and 390 × 844):

- Programs export button: 44 × 44 px with a tooltip. It saves `forge-split-starter-strength-2026-11-17.forge.json` (version 4, one program, its 3 exercise definitions, no sessions) and shows the "Starter Strength exported" toast.
- Add exercise dialog at 1280 px: the four number fields fit on one row. Defaults are 3 × 8–12 with 90 s rest at the end. The position menu lists "At the end", "After 1. Dumbbell Chest Press (Current exercise · do it next)" and "First in the workout". The "Also add to Push in Starter Strength for next time" checkbox appears.
- At 390 px: the number fields wrap to a 2 × 2 grid with no horizontal page scroll, and the dialog content fits its width. Lat Pulldown was added as 4 × 6–10 with 120 s rest, placed first, with "Also add" ticked. It went first in the session and first in the Push template with the same prescription, and a success toast appeared. With "Also add" unticked, only the session changed.
- Keyboard entry works through the number fields and position menu.
- Not checked on a physical phone.

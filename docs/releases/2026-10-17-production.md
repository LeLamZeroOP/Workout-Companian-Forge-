# Production release — 17 October 2026

Published the current local update to the existing Forge production project, including the expanded 200-exercise library, technique tutorials, and development-preview cache recovery.

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-629bcnndn-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_Gi8t42EYZgopZ9ccPTp5wiBZ6YAC`.
- Vercel confirmed the staged deployment was Ready, then confirmed successful promotion to the production app. After promotion, `vercel inspect workout-companian-forge.vercel.app` resolved to this deployment with production target and Ready status.
- Staged with `vercel deploy --prod --skip-domain --yes --no-wait`, then published with `vercel promote <deployment-url> --yes`, using the existing team and project.
- The Vercel production build used the existing production environment; both public Supabase configuration variables remain configured. Local environment files and generated output were excluded by `.vercelignore`.
- No application-source changes, Git commit/push, database migration, or account-record edits were performed during publication. The existing schema-4 compatibility remains applicable.

## Validation

- `pnpm build` passed, including TypeScript checking. The existing non-blocking JavaScript chunk-size warning remains.
- `pnpm lint` passed.
- `pnpm exec vitest run --maxWorkers=1 --testTimeout=30000` passed all 331 tests across 71 files. An initial run with the default five-second timeout was interrupted after interface tests exceeded their limits; application and test assertions were unchanged.
- The full Chromium suite passed 61 scenarios, timed out in two, and skipped the optional live YouTube playback check. The Bangkok measurement scenario passed on an isolated rerun. The offline-shell scenario timed out again, then passed unchanged in an isolated traced run. Across these runs, all 63 enabled scenarios passed.
- A separate local diagnostic confirmed the service worker registered and activated, took control, and created the expected shell cache. No application changes were required.
- Browser checks covered the expanded library, video controls, responsive layouts, workout edits, persistence, offline behavior, and waiting updates across two tabs. Live account writes, physical phones, and fresh playback of all remote videos were not exercised during this publication. Earlier source-selection playback evidence is recorded in [the library expansion review](../exercise-library-expansion.md).

Existing clients can retain the previous service worker while a Forge tab remains open. Finish current edits, close all Forge tabs or app windows, and reopen the main URL to activate the update. Keep browser storage intact.

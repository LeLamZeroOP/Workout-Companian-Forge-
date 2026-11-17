# Production release — 29 October 2026

Published the unsaved-edit navigation prompt and numeric input fixes to the existing Forge production project.

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-re0vqajyr-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_3JiuZuvvAdJWsdVhBZ3ymvkafKod`.
- Vercel completed the production build with Ready status. Promotion succeeded, and inspecting the main URL resolved to this deployment with production target and Ready status.
- Uploaded local source with `vercel deploy --prod --skip-domain --yes --no-wait --scope lelamctin2005-3819`, then published using `vercel promote` after the build completed.
- The build used the existing production environment. Environment files and local generated output were excluded by `.vercelignore`.
- No database migration, account-record edit, Git commit, or push was performed.

## Changes and validation

Switching app tabs with unsaved editor data offers Save and leave, Discard changes, or Keep editing. Validation errors and save failures retain the draft. Numeric inputs preserve editable text so users can clear reps and kg without a forced leading zero.

- All 348 unit tests passed across 74 files using `pnpm test:run --testTimeout=20000`. The first full run exceeded the default five-second timeout in two interface tests; the final run passed unchanged assertions with the longer timeout.
- Both targeted Chromium scenarios passed at 390px and 1280px, covering clearing and replacing reps, keeping edits, saving before leaving, and discarding changes.
- Lint, TypeScript, and the local production build passed. Vercel's production build also completed successfully.
- Production verification used deployment status and the main URL's deployment mapping. Live authenticated writes and physical phones were not exercised.

Existing clients may retain the previous service worker while Forge is open. Finish current edits, close all Forge tabs or app windows, and reopen the main URL to activate the update. Keep browser storage intact.

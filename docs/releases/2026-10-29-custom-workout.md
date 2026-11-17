# Custom workouts — 29 October 2026

Published to https://workout-companian-forge.vercel.app on 29 October 2026.

- Deployment URL: https://workout-companian-forge-j4ig3bqxd-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_3FAjDVR9PwQ5rovm5xBtii7Mx4ps`.
- Vercel's production build completed with Ready status. Promotion succeeded, and inspecting the main URL confirmed it points to this production deployment.
- Uploaded source using the existing production environment and the current `.vercelignore` exclusions. No database migration, account-record edit, Git commit, or push was performed.
- Existing clients should finish current edits, close all Forge tabs or app windows, and reopen the main URL to activate the update. Keep browser storage intact.

Workout → Custom workout opens a standalone session builder, including when the account has no programs. Users can name the session, select library or saved custom exercises, reorder or remove movements, and choose sets, repetition ranges, rest times, and workout notes. The builder participates in the existing unsaved-edit navigation prompt.

Starting a custom workout stores a normal session with null program and template IDs and the label Custom workout. It does not create a program or change the last selected program. Existing guided logging, exercise changes, local drafts, history, and analytics apply. Both local and cloud paths use the current version-4 document format; no database migration is needed. The start mutation prevents a second active session.

## Validation

- Lint, TypeScript, and the production build passed.
- Full unit run: 355 passed; one food-entry save-failure test exceeded the 20-second timeout. The affected file and the custom-workout feature file passed all seven tests on an isolated rerun with a 30-second timeout. Across these runs, all 356 unit tests passed without changing their assertions.
- Chromium scenarios passed at 390px and 1280px, covering creation with no programs, clearing and replacing numeric input, reload/resume, finishing into history, and verifying null program/template IDs in persisted data. Existing unsaved-edit navigation browser checks also passed at both widths.
- Cloud gateway tests verified offline queuing, restoration, and sync without adding programs. Live authenticated writes and physical devices were not exercised.
- Builder screenshots: `output/playwright/custom-workout-390.png` and `output/playwright/custom-workout-1280.png`.

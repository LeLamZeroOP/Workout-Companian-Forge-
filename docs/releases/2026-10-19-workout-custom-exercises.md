# Custom exercise creation during workouts — 19 October 2026

Both Add exercise and Replace exercise now offer Create custom exercise. The quick form asks for a name, equipment, primary muscle, and optional setup notes. Create and add appends three working sets; Create and replace moves unfinished sets to the new movement while keeping completed results under the original exercise. Neither operation changes the program template. Created movements remain in the exercise library for reuse.

The selected muscle receives a contribution of one and a user-selected direct role. Additional muscle mapping can be edited later in Programs.

The library definitions and session change are saved in one local document write or one existing account queue mutation. The updateSession mutation accepts optional new exercise definitions without changing the exported data schema. Replays are idempotent; an existing library ID with different contents is rejected. Workout drafts retain unacknowledged definitions across reopening and subsequent edits until the source acknowledges the session. Immediate save failures retain form entries and the generated ID for retry. Cancel and validation failures do not save anything.

Validation covers form validation/cancellation/retry, draft recovery and acknowledgement, atomic mutation replay, offline queue flush, supported active-session conflict choices, rest preservation while adding, completed-set preservation while replacing, library reuse, reload and offline startup, and existing workout editing controls. Browser checks passed at 320px and 1024px; visual review used output/playwright/workout-custom-exercise-320.png. Live authenticated writes and physical phones were not exercised.

Final verification: 51 unit/integration tests across six files and seven browser scenarios passed. TypeScript checking, targeted lint, and the production-mode local build passed. The existing non-blocking chunk-size warning remains. Production uses the existing configured account environment; local browser tests disable cloud mode.

Published to the existing production project with its existing configured production environment:

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-5pa4eyn96-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_3dFxFDfVUDYoeQmj7wGEwapUH5vZ`.
- Vercel reported Ready before promotion and confirmed successful promotion.
- Staged with `vercel deploy --prod --skip-domain --yes --no-wait`, then published with `vercel promote <deployment-url> --yes`.
- No database migration, account-record change, Git commit, or push was performed.

Save current edits, close all Forge tabs and installed app windows, and reopen to activate the release. Saved active workouts remain available after reopening; browser data should stay intact.

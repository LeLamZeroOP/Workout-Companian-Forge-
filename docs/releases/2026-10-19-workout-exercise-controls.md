# Workout exercise controls — 19 October 2026

Added direct Add exercise and Replace exercise buttons below the current set entry or rest timer. Adding previously required scrolling past the set log to the workout-order area; replacement required opening the three-dot menu. Replacement now opens its searchable picker immediately. The existing options menu remains available for all exercises in workout order.

Both actions use the full bundled library and saved custom exercises. They apply only to the active session. Adding appends three working sets without losing entered values. Replacement keeps completed sets under the original movement and assigns unfinished sets to the replacement with blank weight/reps, preserving the existing replacement behavior. Adding remains available after the planned sets are complete. The existing conflict checks, failed-save retention, empty-workout recovery, and exercise limit remain in force.

Validation:

- Thirty unit tests passed across session editing, workout editing, and workout drafts.
- Twenty-one browser scenarios passed across focused runs: direct controls at 320/1024px, mobile rest timer, responsive workout design, menu/keyboard/focus behavior, empty-workout additions, replacement history, reload persistence, and a short desktop replacement dialog.
- TypeScript checking, targeted lint, and production-mode local build passed. The existing chunk-size warning remains.
- Visual review used `output/playwright/workout-exercise-controls-320.png`. Live account writes and physical phones were not exercised.

Published to the existing production project with its existing production environment:

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-o47zyznv0-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_GUzYgDSiUdpqxdFMn25qAqprZ6zx`.
- Vercel reported Ready before promotion and confirmed successful promotion.
- Staged with `vercel deploy --prod --skip-domain --yes --no-wait`, then published with `vercel promote <deployment-url> --yes`.
- No database migration, account-record change, Git commit, or push was performed.

Save any current edits, close every Forge browser tab and installed app window, and reopen the main URL to activate the new version. Saved active workouts remain available after reopening. The explicit update button remains blocked while an active workout is in progress.

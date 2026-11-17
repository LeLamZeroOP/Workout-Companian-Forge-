# Mobile update recovery — 19 October 2026

The mobile and desktop layouts share feature components, including the expanded 200-exercise library and technique tutorials. The previous production worker served cached HTML and waited for all Forge windows to close before activating an update. Reloading an open mobile installation could therefore keep showing an older release.

Added an App updates control in Settings and an update-ready panel. Updates remain automatic after every Forge window closes; users can also save their edits, go to Today, and choose Update and reload. The explicit action is disabled during active workouts, pending sync/conflicts, and save/loading errors. The waiting worker accepts it only when the requester is the sole open window on the origin. Other windows receive no forced reload. No browser records, workout drafts, or account data are cleared.

Existing clients without the new controls still need to close all Forge tabs and installed app windows and reopen once. This release cannot remotely reload a physical phone.

Validation:

- Production build and TypeScript checking passed.
- Targeted lint passed for the application shell, update component, entry point, Vite config, and new browser test.
- Eight application-shell and route unit tests passed.
- Nine browser scenarios passed covering update/reload, multi-window waiting, offline startup, split customization, technique dialogs at 320/768/1024/1440px, and expanded-library access for existing data.
- Two focused browser scenarios passed again with stronger assertions: an actual saved body measurement survived update/reload and offline reopening; active workouts disable explicit updating; the new panel fits at 320px.
- Physical phones and live authenticated writes were not tested. Vercel builds with the existing production environment; local test builds disable cloud mode.

Published to the existing production project using the current production environment:

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-i7cdqfi18-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_GH4u1tqrGVFk8Yg11XQmyDoUfZ8M`.
- Vercel confirmed Ready before promotion and successful promotion to the existing app.
- Staged with `vercel deploy --prod --skip-domain --yes --no-wait`, then promoted with `vercel promote <deployment-url> --yes`.
- No database migration, account-record change, Git commit, or push was performed.

The final focused browser check also passed while capturing `output/playwright/mobile-update-ready.png` for visual review at 320px.

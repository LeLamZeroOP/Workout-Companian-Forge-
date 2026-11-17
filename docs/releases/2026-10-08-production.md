# Production release — 8 October 2026

Published the current workout workspace design, daily overview, and accumulated journal improvements to the existing Forge production project.

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-k2ykh0ec2-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_J1dBTshQ8HERadYFbbJvhDGaWMDu`.
- Vercel status: production, READY. The main URL resolves to this deployment according to `vercel inspect workout-companian-forge.vercel.app`.
- Built on Vercel with the project's existing production environment, including its Supabase URL and publishable key. The local-only preview build was not uploaded.
- Staged using `vercel deploy --prod --skip-domain --yes`, then published using `vercel promote <deployment-url> --yes`.
- Upload exclusions include environment files, imports, screenshots, test results, local dependency caches, and documentation.

## Validation

The exact application source passed 298 unit tests across 66 files, 38 Chromium browser checks, type checking, lint, and the local production build before deployment. Vercel's production build also succeeded. See [workout design verification](2026-10-08-workout-design.md) and [journal improvements](2026-10-08-local-improvements.md) for coverage.

The deployed release rendered the expected Google account gate, confirming the production cloud configuration. The main URL loaded the existing signed-in app and displayed its update-ready notice. After closing and reopening only the verification tab, the main app rendered the new Today interface, including active-set progress and the Monday–Sunday activity strip. Its existing active workout remained present and the sync indicator read Synced. A verification screenshot is saved at `output/playwright/production-2026-10-08.jpg`. The browser verification did not edit workout records or initiate an account sign-in.

No database migration was needed; the existing production schema-4 compatibility remains applicable. No account documents were intentionally changed during deployment.

Existing clients can retain the previous service worker while a Forge tab stays open. Finish current edits, close all Forge tabs, and reopen the app to activate the update. Do not clear browser storage. Live authenticated write/sync operations and physical phones were not exercised during this deployment.

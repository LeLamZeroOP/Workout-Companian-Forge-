# Production release — 12 October 2026

Published the current local app to the existing Forge production project.

- Main URL: https://workout-companian-forge.vercel.app
- Deployment URL: https://workout-companian-forge-9eoet5fac-lelamctin2005-3819.vercel.app
- Deployment ID: `dpl_2VwmyjRMLe2mEhXTKzFinap7xzJc`.
- Vercel status: production, READY. After promotion, `vercel inspect workout-companian-forge.vercel.app` resolved to this deployment.
- Staged with `vercel deploy --prod --skip-domain --yes --no-wait`, then published with `vercel promote <deployment-url> --yes`.
- Vercel built the uploaded source using the existing production environment. Both public Supabase configuration variables are configured for production.
- Environment files, imports, local output, and documentation were excluded from upload by `.vercelignore`.
- No Git commit or push was performed. No database migration or account-record edit was performed. The app retains schema version 4.

## Validation

- TypeScript checking and local production build passed (`pnpm build`).
- Lint passed (`pnpm lint`).
- All 55 Chromium browser scenarios passed (`pnpm test:e2e`).
- Initial unit run: 315 passed, four exceeded the default five-second timeout, across 70 files and 319 tests.
- Rerunning the four affected files with one worker: 13 passed, with only the training-library preview test still exceeding five seconds.
- Rerunning the training-library file with one worker and a 15-second timeout: both tests passed. No application or test source changes were needed.
- Vercel's production build succeeded. It reported a non-blocking JavaScript chunk-size warning.

Verification covered local browser scenarios and Vercel deployment status. Live account sign-in/write/sync operations and physical phones were not exercised during this release.

Existing clients may retain the old service worker while a Forge tab remains open. Finish current edits, close all Forge tabs, and reopen the main URL to activate the update. Do not clear browser storage.

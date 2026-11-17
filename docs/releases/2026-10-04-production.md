# Production release — 4 October 2026

Published the current verified app to the existing Vercel project, including active workout exercise addition, replacement, removal, details editing, and the clipped replacement dropdown fix.

- Deployment: `dpl_7kGxnvFYfjVGYkqYU5JtM6saD3eg`, production, READY.
- Deployment URL: https://workout-companian-forge-keaxu1350-lelamctin2005-3819.vercel.app
- Main URL: https://workout-companian-forge.vercel.app
- Built using the existing Vercel production environment; the local-only `dev:test` helper is not used in production.
- Staged with `--prod --skip-domain`, then promoted after database compatibility verification.
- Validation: 198 tests across 49 files passed with two workers; 5 Chromium workout/timer/layout checks passed; lint and production build passed.

## Database compatibility

Inspected `public.user_documents` in the existing Workout Tracker Supabase project. Its `user_documents_data_check` originally accepted versions 2 and 3. Updated that constraint transactionally using the expression in `docs/cloud-schema-v4.sql`, preserving the object requirement and 10 MB bound. Row-level security remained enabled and the three existing authenticated owner-only SELECT/INSERT/UPDATE policies were inspected.

Verified the actual live constraint using a temporary table: versions 2/3/4 accepted; version 5, arrays, and oversized documents rejected. Rolled back all temporary test data. No account documents were modified by this migration or verification.

Existing clients may need to accept the app's update notice or close/reopen their app tabs to load the new service worker. Do not clear browser storage. Rollback clients must support reading version 4. Live-account end-to-end workout synchronization and physical-phone checks remain unverified.

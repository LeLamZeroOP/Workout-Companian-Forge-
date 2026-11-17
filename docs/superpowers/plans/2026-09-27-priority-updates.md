# Priority updates — execution and verification

Historical execution record; later publication is documented in [the release log](../../releases/2026-09-27.md), and the next authorized core slice is documented in [core improvements](2026-09-27-core-improvements.md).

Authorized 27 September 2026: priority reliability fixes, selective local-to-account merge, and My foods. The user additionally requested a redesign of selection controls. The broader app-wide redesign and later recipes/training features are excluded. Production deployment and production settings are not part of this execution.

1. Fix BUG-BODY-001 with persisted logical entry order, legacy array-order fallback, shared selectors, local date handling, and save-form regression coverage.
2. Extend the versioned document for named food portions, unknown macros, and a durable account merge ledger. Migrate old backups without changing their nutrient values or workout snapshots.
3. Serialize account operations across tabs. Add explicit review of cloud conflicts, including dependent queued edits; preserve recovery backups. Keep service-worker updates waiting until all app tabs close.
4. Build a pure selective merge planner. Select nothing initially; review conflicts and linked definitions, retain immutable diary/session snapshots, and preserve excluded singleton settings. Store recovery snapshots before committing against the reviewed cloud revision. Persist operation receipts and copy mappings in the account document for retry/repeat safety.
5. Connect settings selection, search, conflict review, backups, confirmation, and receipt UI. Reject pending queues and stale sources/revisions/identity.
6. Add My foods creation inside Add food, named portions/per-100g input, optional macros, editing/favorites/reuse, and incomplete diary totals.
7. Run domain, persistence, feature, type, lint, build, and browser checks; document exact evidence and any live-service limitations.

Implementation choices: no invented gram conversion; older clients reject schema 3 rather than reading new meanings as old data. Legacy measurement order is an ordinal, not a reconstructed creation timestamp. Conflicting definitions are copied for imported references instead of silently changing existing account records. Account operations use Web Locks where supported and fail closed for merge when cross-tab serialization is unavailable.

## Implementation record — 27 September 2026

- BUG-BODY-001: shared ordering for latest/change/history/chart, persisted logical order for new entries, legacy later-array-position fallback, stable chosen dates and edits, and validated date input. Nutrition targets remain explicit.
- Recovery: account operation serialization, stale displayed-record baselines, atomic resolution of dependent queued mutations, reviewed cloud/local/copy choices, durable before/source snapshots, and signed-out state handling. Prepared operations survive uncertain responses and reconcile using cloud receipts. Sign-out blocks unresolved work.
- Merge: record-level selection/search, no initial selections, explicit conflicts, definition copies and reference remapping, immutable history/diary snapshots, singleton/unfinished-session exclusions, fresh-revision confirmation, permanent copy mappings, and downloadable recovery backups/receipts. Source copies remain untouched.
- My foods: create inside Add food, per-100g/known-gram/named-portion bases, unknown macros, known-total completeness labels, editing, favorites, archive, search, and reuse. No invented gram weights or rewritten past meals.
- Schema 3: validated migration of v1/v2 backups. Fresh schema and existing-database constraint migration prepared. No database changes applied.
- PWA: updates wait until all tabs close; mobile viewport subscription handles resize during mounting.

Local validation results are recorded below after the final checks. Live Supabase/RLS/advisor, real-account OAuth and physical phone acceptance are not claimed by mock-gateway/browser tests. Apply the schema-3 database constraint migration and run live checks as a separately authorized rollout. Existing schema-2 clients cannot read schema-3 data; any rollback client must retain the new reader.

## Selection redesign and final validation

Selection controls now use contextual option rows, searchable exercise lists, visible workout and nutrition-basis radio cards, food-library filters, and explicit account/local/copy decision cards. Selected states use a restrained green accent and check marks. Keyboard focus, Escape dismissal, filtering, empty states, responsive layout, and reduced-motion behavior are covered by tests. Desktop and 375px mobile screenshots were inspected locally.

- 141 tests across 37 files passed (`pnpm test:run --maxWorkers=2`).
- 8 Chromium browser scenarios passed (`pnpm test:e2e`), including offline shell, two-tab service-worker update deferral, local date/order in Bangkok and Los Angeles, immutable food snapshots, and responsive selection controls.
- TypeScript/build, ESLint, and diff whitespace checks passed. Build retains the existing warning about a JavaScript chunk over 500 kB.
- No production deployment or database changes were performed. The prepared schema migration and live-account checks remain rollout requirements.

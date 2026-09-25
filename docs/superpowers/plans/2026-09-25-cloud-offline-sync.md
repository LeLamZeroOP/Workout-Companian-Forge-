# Forge Cloud and Offline Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Host Forge at one HTTPS URL so the owner can sign in with Google on a phone at the gym and a computer at home, with the same data and durable offline workout logging.

**Architecture:** Vercel serves the built React/Vite app. Supabase Auth handles Google sign-in; one RLS-protected Postgres document row per account holds `AppDataV2` with a revision. Each browser keeps an acknowledged snapshot and idempotent pending mutations in IndexedDB, then rebases and uploads them when online; same-record conflicts require review.

**Tech Stack:** Existing React 19, TypeScript, Vite 8, Vitest, Playwright, pnpm 11; Supabase Auth/Postgres; IndexedDB; Vercel static hosting. Pin new dependencies in `pnpm-lock.yaml`.

**Spec:** `docs/superpowers/specs/2026-09-25-cloud-offline-sync.md`

## Global Constraints

- The computer may be off and the phone may use cellular data. One account, one hosted URL, and one canonical cloud document are required.
- Google sign-in requests only `openid`, email, and profile; its client secret stays in Supabase configuration, never `VITE_*` or source control.
- Every exposed table has RLS and owner-scoped SELECT/INSERT/UPDATE policies. The browser contains only the Supabase publishable key.
- Offline logging is available only after an initial online visit/sign-in. A queued set is labeled pending until the cloud acknowledges it. No reliance on browser-closed background sync.
- Preserve `AppDataV2` JSON export/import, the existing `workout-tracker:data` localStorage data, and all current workout/body/nutrition behavior.
- Maximum document size is 10 MiB. Database revision checks and stable mutation IDs prevent silent lost updates or duplicate replay.
- Do not create cloud projects, change billing, upload personal data, or deploy publicly until the user connects/approves the external accounts and the app passes local security and data-migration tests.
- Do not discard unrelated in-progress manual-target tests or user-owned untracked files. First establish a green baseline.

## File map and contracts

| File | Responsibility |
| --- | --- |
| CLI-created SQL file in `supabase/migrations/` | One document row per account, revision, bounded recent mutation IDs, RLS, grants. |
| `src/data/validateAppData.ts` | Strict nested data validation for cloud reads and imports. |
| `src/domain/appMutations.ts` | Typed, idempotent application mutations and same-record conflict scope. |
| `src/data/cloudClient.ts` | Supabase client creation from URL and publishable key. |
| `src/data/cloudRepository.ts` | Fetch row, conditional revision update, initialize row, detect conflicts. |
| `src/data/offlineStore.ts` | IndexedDB acknowledged snapshot and ordered pending mutations per account. |
| `src/hooks/useCloudAppData.ts` | Sync state machine, durable queue, replay/rebase, focus/online refresh. |
| `src/features/auth/SignInPage.tsx` | Google sign-in, callback/error handling, sign-out guard. |
| `src/features/settings/DataManagement.tsx` | Cloud export/import/reset and legacy-local migration. |
| `src/app/App.tsx`, `src/styles/global.css` | Auth gate, pending/synced/conflict status, mobile sync review. |
| `vercel.json`, `.env.example`, `README.md`, `docs/cloud-setup.md` | Hosting, redirect setup, environment and backup instructions. |

`CloudSnapshot = { userId: string; revision: number; data: AppDataV2; recentMutationIds: string[] }`. `PendingMutation = { id: string; userId: string; createdAt: string; baseRevision: number; mutation: AppMutation; status: 'pending' | 'conflict' }`. `syncPending(snapshot, queue)` applies only to the signed-in account. A conditional update changes `revision` from `n` to `n+1` only where `user_id = auth.uid()` and `revision = n`; zero updated rows means fetch and rebase or show a conflict.

`AppMutation` covers `saveProgram`, `deleteProgram`, `saveExercise`, `startWorkout`, `setWorkoutSet`, `updateSession`, `finishWorkout`, `discardWorkout`, `saveBodyProfile`, `saveBodyMeasurement`, `deleteBodyMeasurement`, `saveNutritionTarget`, `saveCustomFood`, `addFoodEntry`, and `deleteFoodEntry`. `setWorkoutSet` carries `sessionId`, `exerciseId`, `setId`, the changed set values, and the previously acknowledged set as its conflict precondition. Reset and full replacement are separate exact-revision operations, not offline-queued mutations.

---

### Task 1: Baseline and strict V2 validation

**Files:** Create `src/data/validateAppData.ts`, `tests/data/validate-app-data.test.ts`; modify `src/data/migrations.ts`, `tests/data/migrations-v2.test.ts`.

**Interfaces:** `validateAppData(value: unknown): AppDataV2`; preserve `parseAppData(value: unknown): AppDataV2` for V1-to-V2 migration.

- [ ] **Step 1: Record `git status --short`; run `pnpm test:run`, `pnpm typecheck`, and `pnpm lint`.** The existing manual-target test work is unfinished; finish it without deleting or overwriting it, then rerun until green.
- [ ] **Step 2: Write a failing nested-validation test.** For example:

```ts
const bad = structuredClone(createDefaultData());
bad.sessions.push({ id: 'broken' } as never);
expect(() => validateAppData(bad)).toThrow(/session/i);
```

- [ ] **Step 3: Run `pnpm exec vitest run tests/data/validate-app-data.test.ts`; confirm RED.**
- [ ] **Step 4: Validate every nested persisted type, dates, finite numeric ranges, IDs, unique collection IDs, and a 10 MiB serialized limit; migrate V1 before V2 validation.** Use the validator for cloud reads and import, not just a TypeScript cast.
- [ ] **Step 5: Run targeted/full tests and typecheck; commit `feat: validate cloud-bound app data`.**

### Task 2: Cloud schema and account isolation

**Files:** Create a CLI-named SQL file under `supabase/migrations/` and `tests/data/rls.test.ts`; modify `.env.example`, `package.json`, `pnpm-lock.yaml`.

**Interfaces:** `public.user_documents(user_id uuid primary key references auth.users(id), revision bigint not null, data jsonb not null, recent_mutation_ids text[] not null, updated_at timestamptz not null)`.

- [ ] **Step 1: Discover Supabase CLI commands with `--help`, initialize local configuration, and use the CLI to create the migration filename.** Check the current changelog and docs again before executing schema work.
- [ ] **Step 2: Write a failing RLS test using two Auth users:** user A can read/update A, user B cannot read/update A, anon cannot read A, and a forged `user_id` insert is rejected.
- [ ] **Step 3: Add the table and policies.** The migration must include the equivalent of:

```sql
create table public.user_documents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  data jsonb not null,
  recent_mutation_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.user_documents enable row level security;
create policy user_documents_select on public.user_documents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy user_documents_insert on public.user_documents
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_documents_update on public.user_documents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update on public.user_documents to authenticated;
```

- [ ] **Step 4: Run the RLS tests and Supabase security advisor.** Ensure Data API table exposure/grants and RLS both work; no service-role or secret key is placed in browser code. Commit `feat: add private cloud document`.

### Task 3: Google sign-in and account-scoped cloud repository

**Files:** Create `src/data/cloudClient.ts`, `src/data/cloudRepository.ts`, `src/features/auth/SignInPage.tsx`, `tests/data/cloud-repository.test.ts`, `tests/features/sign-in-page.test.tsx`; modify `src/app/App.tsx`.

**Interfaces:** `CloudRepository.load(userId): Promise<CloudSnapshot>`; `.save(expectedRevision, nextData, mutationId): Promise<CloudSnapshot | {kind:'conflict'}>`; `.initialize(userId, initialData)` only when no row exists.

- [ ] **Step 1: Write failing tests:** signed-out app hides data, Google button starts OAuth, same-account reload loads data, different account sees a different row, and a stale revision update returns conflict.
- [ ] **Step 2: Run targeted Vitest and confirm RED.**
- [ ] **Step 3: Implement Google OAuth with `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: ... } })`, observe auth state, and handle failed/cancelled sign-in.** Use the provider's documented web flow; request only basic identity. Never read a user's Google Drive or other Google data.
- [ ] **Step 4: Implement compare-and-swap via `.eq('user_id', userId).eq('revision', expectedRevision).update({ revision: expectedRevision + 1, data: nextData, ... }).select()`.** A zero-row result is a conflict, not a successful save. On first sign-in, insert a default row only if none exists; do not overwrite another device's data.
- [ ] **Step 5: Test auth/repository and commit `feat: sign in with Google and load cloud data`.**

### Task 4: Durable offline mutations and conflict handling

**Files:** Create `src/domain/appMutations.ts`, `src/data/offlineStore.ts`, `src/hooks/useCloudAppData.ts`, `tests/domain/app-mutations.test.ts`, `tests/data/offline-store.test.ts`, `tests/hooks/cloud-sync.test.tsx`; modify `src/hooks/useAppData.ts` and `src/app/App.tsx`.

**Interfaces:** `applyMutation(data, mutation): AppDataV2` is idempotent by stable record IDs; `getConflictScope(mutation)` identifies affected records; `OfflineStore` persists one acknowledged snapshot and ordered `PendingMutation[]` per account.

- [ ] **Step 1: Write failing tests for offline set logging, reload persistence, lost-response retry, different-record rebase, same-record conflict, queue survival across expired auth, and sign-out with pending data.** Core expectation:

```ts
await sync.enqueue({ kind: 'completeSet', sessionId, exerciseId, setId, reps: 8, weightKg: 60 });
expect(await offlineStore.pendingCount(userId)).toBe(1);
await sync.reconnect();
expect(await offlineStore.pendingCount(userId)).toBe(0);
```

- [ ] **Step 2: Run targeted Vitest and confirm RED.**
- [ ] **Step 3: Refactor existing `useAppData` actions into typed mutations.** Generate stable IDs before queueing; mutate local working state immediately; persist queue transactionally to IndexedDB before showing a saved-on-device confirmation. Do not replace the entire cloud document blindly.
- [ ] **Step 4: Replay in order when online, on focus, and on an explicit Retry button.** Fetch newest revision first; skip IDs already acknowledged in `recent_mutation_ids`; rebase only if affected records have not changed; use conditional revision update; on same-record conflict keep the queue entry and offer review/export. Label states `Synced`, `Saving`, `Offline — N pending`, and `Sync needs review` accurately.
- [ ] **Step 5: Run targeted/full tests, typecheck, and lint; commit `feat: queue and reconcile offline workouts`.**

### Task 5: Migration, privacy, and backup controls

**Files:** Modify `src/features/settings/DataManagement.tsx`, `src/app/App.tsx`, `README.md`; create `tests/features/cloud-migration.test.tsx`, `tests/data/cloud-backup.test.ts`.

**Interfaces:** Legacy key `workout-tracker:data` remains readable but is not a sync source after migration; JSON exports remain V2. Cloud import/reset require current cloud revision and confirmation.

- [ ] **Step 1: Write failing tests for legacy backup download, canonical-source choice, validated preview, two-browser data not being auto-merged, rejected invalid import, and revision-conflicted reset.**
- [ ] **Step 2: Run tests and confirm RED.**
- [ ] **Step 3: Add a first-sign-in migration flow.** Export backups from computer and phone first; select one canonical data set; show counts and privacy notice; require confirmation before cloud upload. Never silently delete old localStorage data or upload it without the confirmation.
- [ ] **Step 4: Make Settings export the cloud-acknowledged V2 document plus a separate optional pending-change export.** Keep a user-controlled backup because Supabase Free currently lacks automatic backups. Sign-out with pending work must offer Sync now or Export pending, not discard by default.
- [ ] **Step 5: Test round trip and commit `feat: migrate and back up cloud data`.**

### Task 6: HTTPS hosting and real-device acceptance

**Files:** Create `vercel.json`, `.env.example`, `docs/cloud-setup.md`, `tests/e2e/cloud-sync.spec.ts`; modify `README.md`, `playwright.config.ts`, `src/main.tsx`/`vite.config.ts` if shell caching needs adjustment.

**Interfaces:** Production variables are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; never put a Google OAuth secret, Supabase service-role key, or personal data in Vercel client variables.

- [ ] **Step 1: Write failing E2E cases using two browser contexts and a test Supabase project:** same Google account sees shared records; a second account cannot; offline phone logs and later syncs; same-record conflict preserves the local edit. Automate Auth with test fixtures rather than real Google passwords.
- [ ] **Step 2: Add Vercel SPA routing and setup docs.** The guide must cover creating/connecting Vercel and Supabase projects, creating a Google Cloud OAuth Web client, authorized JavaScript origins (hosted URL and localhost), Supabase's exact Google callback URI, Supabase Site URL/redirect allow-list, setting the two public Vite variables, preview-vs-production URLs, and no secret keys in client code.
- [ ] **Step 3: Verify the production build and security gate:** `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, E2E, two-account RLS tests, dependency audit, and manual phone test on cellular data. Check service worker update behavior and that IndexedDB pending changes survive reload.
- [ ] **Step 4: Only after the user connects/approves external accounts, deploy to an HTTPS production URL and test Google sign-in on phone and computer.** Export current local data before migration; confirm phone works with PC powered off. Do not claim completion until the actual hosted URL and cross-device data test are verified.
- [ ] **Step 5: Commit `docs: finish hosted Forge deployment` and record rollback instructions.** Rollback is a previous static build plus the latest validated V2 export; never overwrite newer cloud data with a stale backup without an explicit revision check and confirmation.

## Handoff and known tradeoffs

The user's cloud project and Google OAuth credentials are external account setup, not values to ask them to paste into chat. The user can authenticate through the provider UI when deployment reaches that stage. Supabase's Free tier currently pauses after a week of inactivity and has no automatic backups; use periodic JSON exports or a paid backup tier if dependable long-term storage becomes important. This plan keeps the existing JSON model for speed of delivery; normalization is a later scaling task, not a prerequisite for one owner.

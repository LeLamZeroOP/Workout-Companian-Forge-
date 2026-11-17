# Forge Local Shared Sync Implementation Plan — superseded

Do not execute this home-network plan for the current request. The user needs gym access away from home. Use `docs/superpowers/plans/2026-09-25-cloud-offline-sync.md` instead.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the phone and computer use one computer-hosted Forge app version and one authoritative set of workout, body, and nutrition records on a trusted home Wi-Fi network.

**Architecture:** A Node server serves Vite's built `dist/` and a same-origin JSON API. It serializes validated, idempotent mutations into a revisioned document on the computer; browser clients pair, load that document, save through the API, and refresh on focus/interval. Conflicting changes to the same record stop for review instead of silently overwriting data.

**Tech Stack:** Existing React 19, TypeScript, Vite 8, Vitest, Playwright, pnpm 11; Node 22; a small HTTP/static-serving package selected and pinned at implementation time; runtime schema validation; Node file I/O. No cloud account or external database.

**Spec:** `docs/superpowers/specs/2026-09-25-local-shared-sync.md`

## Global Constraints

- Single owner, same trusted Wi-Fi, computer awake and running the server; no access when the computer is off.
- Keep the `AppDataV2` JSON backup contract and support V1 import through existing migration logic.
- The canonical server data directory is `%LOCALAPPDATA%\Forge\data`, outside the OneDrive repository; no committed personal records or secrets.
- Do not use `vite dev` or `vite preview` as the everyday shared-data server; serve the production build and API from one origin.
- No silent last-write-wins, no auto-merging two old browser databases, and no offline writes in this release.
- Poll every 5 seconds while visible; cap JSON requests at 10 MiB; retain 256 mutation IDs; expire pairing codes after 10 minutes; allow at most five invalid pair attempts per source address per 10 minutes.
- Pairing/authentication, origin checks, strict validation, backups, and explicit HTTP-LAN limitations are release requirements, not polish.
- Preserve the current user-owned untracked files and unrelated in-progress manual-target tests. Establish a green baseline without discarding them.

## File map and contracts

| File | Responsibility |
| --- | --- |
| `src/domain/appMutations.ts` | Typed mutation union, pure reducer, touched-record identity, idempotent record updates. |
| `src/data/validateAppData.ts` | Strict runtime validation of nested V1/V2 data and limits; called by browser import and server. |
| `server/store.ts` | Serialized revisioned file store, startup recovery check, previous-good backup, mutation-ID deduplication. |
| `server/auth.ts` | One-time pairing code, sessions, cookie/origin/host checks, throttling. |
| `server/app.ts` | `/api/*`, production static files, errors, size limits, and no-store headers. |
| `server/index.ts` | LAN bind address/port and data-directory configuration; print URL and pairing code. |
| `src/data/remoteRepository.ts` | Typed API calls, pairing, health, snapshot, mutation, import/reset. |
| `src/hooks/useAppData.ts` | Async load, status, mutation queue, refresh/reconnect, conflict state; no normal localStorage writes. |
| `src/features/settings/DataManagement.tsx` | Shared-server import/export/reset copy and migration preview. |
| `src/features/settings/PairingPage.tsx` | Accessible first-run pairing and local-data migration. |
| `src/app/App.tsx` | Loading/paired/offline/conflict screens and truthful connection status. |
| `vite.config.ts`, `src/main.tsx` | Dev proxy and service-worker API bypass. |
| `scripts/start-local.ps1`, `README.md`, `docs/local-network-setup.md` | Repeatable Windows launch and phone setup, backup/recovery, limits. |

API contract: `GET /api/health` reports version/availability without personal data; `POST /api/pair` accepts a one-time code; `POST /api/logout` clears the session; `GET /api/state` returns `{revision, data}` only to paired clients; `POST /api/mutations` accepts `{mutationId, baseRevision, mutation}` and returns the current `{revision, data}` or a conflict response. `POST /api/replace` and `POST /api/reset` require exact `baseRevision`, confirmation already gathered in the UI, and a server-side safety backup. All personal-data responses use `Cache-Control: no-store`.

Mutation types must cover every existing `useAppData` action: save/delete program, save custom exercise, start/update/finish/discard session, save profile/measurement/target/custom food, add/delete diary entry, import, reset. Each record-edit mutation carries the expected old record or its hash; the server rejects a changed record. Additions carry stable client-generated IDs, and recent `mutationId`s are durably deduplicated. The server alone computes the accepted next document.

---

### Task 1: Preserve a baseline and validate complete data

**Files:** Modify `src/data/migrations.ts`; create `src/data/validateAppData.ts`, `tests/data/validate-app-data.test.ts`; modify `tests/data/migrations-v2.test.ts`.

**Interfaces:** `parseAppData(value: unknown): AppDataV2` remains public; new `validateAppData(value: unknown): AppDataV2` rejects malformed nested records, duplicate IDs, invalid dates/numbers, excessive strings/arrays, and unsupported versions.

- [ ] **Step 1: Establish baseline.** Record `git status --short`, run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, and note the existing unfinished manual-target test failures. Finish or isolate that feature without deleting its changes; repeat until green.
- [ ] **Step 2: Write failing validation tests.** For example:

```ts
const bad = structuredClone(createDefaultData());
bad.sessions.push({ id: 'broken' } as never);
expect(() => validateAppData(bad)).toThrow(/session/i);
expect(() => validateAppData({ ...bad, version: 99 })).toThrow(/version/i);
```

- [ ] **Step 3: Run `pnpm exec vitest run tests/data/validate-app-data.test.ts` and confirm RED.**
- [ ] **Step 4: Define strict schemas for every persisted nested type.** Convert V1 before validating V2; cap input at 10 MiB, reject non-finite and negative quantities where invalid, and keep unknown future versions rejected. Use the same validator for JSON import and API input; do not merely cast `unknown` to `AppDataV2`.
- [ ] **Step 5: Run targeted tests, then full `pnpm test:run` and `pnpm typecheck`; commit `feat: validate shared workout data`.**

### Task 2: Extract explicit, testable mutations

**Files:** Create `src/domain/appMutations.ts`, `tests/domain/app-mutations.test.ts`; later modify `src/hooks/useAppData.ts`.

**Interfaces:** `type AppMutation = ...`; `applyMutation(current: AppDataV2, mutation: AppMutation): AppDataV2`; `conflictScope(mutation: AppMutation): string[]`. The server and browser share the reducer, but only the server confirms a save.

- [ ] **Step 1: Write failing tests for add/update/delete, duplicate mutation delivery, start-workout invariant, and same-record conflict.** A core assertion:

```ts
const first = applyMutation(initial, { kind: 'addFoodEntry', entry });
expect(applyMutation(first, { kind: 'addFoodEntry', entry })).toEqual(first);
```

- [ ] **Step 2: Run `pnpm exec vitest run tests/domain/app-mutations.test.ts` and confirm RED.**
- [ ] **Step 3: Move each existing `useAppData` transformation into the pure reducer.** Preserve program ordering, session snapshots, target effective dates, reset scopes, and all existing domain invariants. For replacement of an existing entity, carry `expected` old entity and reject when the server version differs; additions with the same ID and payload are idempotent, while ID collisions with different payloads are conflicts.
- [ ] **Step 4: Test all mutation kinds, including a phone food addition racing a computer program edit; commit `refactor: centralize app mutations`.**

### Task 3: Build the durable single-writer server

**Files:** Create `server/store.ts`, `server/app.ts`, `server/index.ts`, `tests/server/store.test.ts`, `tests/server/api.test.ts`; modify `package.json`, `tsconfig.node.json` or add a dedicated server tsconfig, `.gitignore`.

**Interfaces:** `loadStore(dataDir): Promise<Store>`; `store.read(): {revision:number; data:AppDataV2}`; `store.mutate({mutationId, baseRevision, mutation})`; `store.replace(...)`; `store.reset(...)`.

- [ ] **Step 1: Write failing store tests using a temporary directory.** Verify round-trip after restart, deduplication after a lost-response retry, stale revision rejection, malformed-state startup refusal, and previous-good recovery copy. Example:

```ts
const before = await store.read();
await store.mutate({ mutationId: 'm1', baseRevision: before.revision, mutation });
const after = await loadStore(tempDir);
expect((await after.read()).revision).toBe(before.revision + 1);
```

- [ ] **Step 2: Run `pnpm exec vitest run tests/server/store.test.ts` and confirm RED.**
- [ ] **Step 3: Implement serialized writes.** Keep state and recent mutation IDs in one envelope; write a same-directory temporary file, flush, preserve the last good envelope, replace the canonical file, and advance in-memory revision only after persistence succeeds. Use an exclusive process lock so a second server cannot write the same directory; refuse corrupt input rather than replacing it with defaults.
- [ ] **Step 4: Add same-origin routes and static `dist/` hosting.** Require JSON, set request-size limit and `no-store` for API, reject paths escaping `dist`, and return clear `409` conflict versus `503` storage failure. The static server must support direct app navigation fallback but never send `index.html` for `/api/*`.
- [ ] **Step 5: Add API integration tests for success, stale revision, invalid document, oversize body, and restart; run tests/build; commit `feat: add local shared data server`.**

### Task 4: Pairing and LAN security gate

**Files:** Create `server/auth.ts`, `tests/server/auth.test.ts`; modify `server/app.ts`, `server/index.ts`, `.gitignore`.

**Interfaces:** Pair code is generated at server start, expires after a short configured lifetime, is single-use, and is displayed only in the computer terminal; session cookie is HttpOnly/SameSite=Strict and scoped to the app origin.

- [ ] **Step 1: Write failing tests:** unauthenticated `GET /api/state` is `401`; wrong/expired/reused code fails; success sets a session; cross-origin write or unexpected Host fails; logout revokes access; rate limit prevents guessing.
- [ ] **Step 2: Run `pnpm exec vitest run tests/server/auth.test.ts` and confirm RED.**
- [ ] **Step 3: Implement auth and request checks.** Bind only the user-selected Wi-Fi IPv4 address; reject non-private addresses unless an explicit development override is supplied. Do not allow credentials in query strings, URLs, logs, or Vite-exposed environment variables. Rotate the pairing code after success and keep server-side session secrets outside the repository.
- [ ] **Step 4: Verify with API tests from both a paired and unpaired client; commit `feat: pair local devices securely`.**

### Task 5: Switch the browser to server-authoritative data

**Files:** Create `src/data/remoteRepository.ts`, `src/features/settings/PairingPage.tsx`, `tests/data/remote-repository.test.ts`, `tests/features/pairing-page.test.tsx`; modify `src/hooks/useAppData.ts`, `src/app/App.tsx`, `vite.config.ts`, `src/main.tsx`, `src/styles/global.css`.

**Interfaces:** `RemoteRepository.load(): Promise<Snapshot>` and `.mutate(mutation, baseRevision, mutationId): Promise<Snapshot>`; hook exposes `{data, status, error, conflict, ...existing actions}` with `status` in `loading | pairing | connected | reconnecting | conflict`.

- [ ] **Step 1: Write failing tests for first load, paired save, remote refresh, server stop/reconnect, duplicate response retry, and conflict.** Verify a failed save does not masquerade as committed data and the old localStorage key is never overwritten.
- [ ] **Step 2: Run `pnpm exec vitest run tests/data/remote-repository.test.ts tests/app-shell.test.tsx` and confirm RED.**
- [ ] **Step 3: Implement the repository and hook.** Load the canonical snapshot before enabling edits. Serialize client mutations; send stable mutation IDs; refresh after a save, every few seconds while visible, and on focus/online events. If the server is unreachable, render the last acknowledged snapshot read-only. On same-record conflict, preserve the attempted action in memory and offer export of the unsaved candidate; require a deliberate reload/retry. For unrelated-record revision changes, rebase the typed mutation once against the latest snapshot, never a blind whole-document overwrite.
- [ ] **Step 4: Build pairing/status UI with labeled inputs, keyboard focus, concise connection copy, and 320px mobile layout.** Change `Saved on this device`/`Stored locally` only when the server mode is actually active.
- [ ] **Step 5: Change the generated service worker fetch handler to return immediately for `url.pathname.startsWith('/api/')`.** Test that API responses never enter Cache Storage. An HTTP LAN IP will not register the service worker, so keep ordinary browser use supported.
- [ ] **Step 6: Run targeted/full tests, typecheck, lint, and build; commit `feat: connect Forge clients to local server`.**

### Task 6: Migrate existing data and preserve backup controls

**Files:** Modify `src/features/settings/DataManagement.tsx`, `src/features/settings/PairingPage.tsx`, `src/app/App.tsx`, `README.md`; create `tests/features/local-migration.test.tsx`, `tests/server/backup.test.ts`.

**Interfaces:** Explicit `Download old device backup` action reads the legacy localStorage key without mutating it; server import accepts a fully validated V1/V2 backup and exact revision; category reset also requires exact revision and server backup.

- [ ] **Step 1: Write failing tests for local-data detection, backup download, import preview/confirmation, rejected invalid import, and server restart after import.** Also test that a second browser's old records are not merged or erased silently.
- [ ] **Step 2: Run the targeted tests and confirm RED.**
- [ ] **Step 3: Implement migration:** tell the user to export every browser's existing data; choose one canonical file; preview record counts; confirm server replacement; retain other files for later manual review. Keep the legacy localStorage key untouched for rollback, but make server the only normal write target after pairing.
- [ ] **Step 4: Make Settings export the canonical server snapshot; make reset/import operate on the server with an automatic pre-change backup and conflict check.** Never clear the whole browser store as a shortcut.
- [ ] **Step 5: Verify the two-device migration path and commit `feat: migrate local records into shared storage`.**

### Task 7: Package, document, and acceptance-test the local deployment

**Files:** Create `scripts/start-local.ps1`, `docs/local-network-setup.md`, `tests/e2e/local-sync.spec.ts`; modify `package.json`, `README.md`, `playwright.config.ts` as needed.

**Interfaces:** `pnpm build` creates the client; `pnpm start:local -- --host <Wi-Fi-IPv4>` starts the production app/API on a fixed port (for example 4173) with a printed private-LAN URL and pairing code. The exact script syntax is verified on Windows before documenting it.

- [ ] **Step 1: Write failing two-context E2E tests.** Pair two isolated browser contexts to one server; log a workout set on A and observe on B; add food on B and observe on A; reload/restart; test a same-record edit conflict and disconnect read-only state.
- [ ] **Step 2: Run `pnpm test:e2e` and confirm the new cases fail for the expected missing behavior.**
- [ ] **Step 3: Add the launch script and guide.** Cover current Node/pnpm, `pnpm install`, `pnpm build`, start command, `ipconfig`, same Wi-Fi, Windows Private-network firewall rule limited to the selected port, phone URL, pairing, sleep settings, DHCP-address changes, update/restart, backup, restore, and how to stop the server. Do not open public firewall profiles, use port forwarding, or claim an HTTP LAN PWA is installable. Confirm the app remains reachable by using the computer's Wi-Fi IP after restart.
- [ ] **Step 4: Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e`; manually test a real phone on the LAN.** Verify the phone cannot read data before pairing, a saved edit appears on the PC, an unsaved edit is clearly marked when the PC sleeps, and a server restart retains data.
- [ ] **Step 5: Run a security review of the new network boundary and dependency audit; fix findings, document residual HTTP-LAN risk, and commit `docs: finish local shared sync setup`.**

## Release gate and rollback

Do not switch the user's primary data to shared mode until the full suite, two-browser test, real-phone check, and backup/restore drill pass. Keep a dated V2 export from the current browser before migration. If the server fails, stop it, preserve `%LOCALAPPDATA%\Forge\data`, restore the last known-good server backup or run the old local-only build against the untouched browser data; never initialize defaults over a corrupt or unreadable canonical file.

## Out of scope after this plan

Cloud hosting, access while the PC is off, secure remote access, offline writes, account sharing, automatic merge of legacy databases, and HTTPS installation on the phone each require separate design/acceptance work.

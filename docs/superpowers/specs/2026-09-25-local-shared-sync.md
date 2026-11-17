# Forge local shared-sync specification — superseded

This home-network design was superseded when the user clarified that they need Forge at a gym away from home. Do not implement this plan for the current request. The current specification is `docs/superpowers/specs/2026-09-25-cloud-offline-sync.md`.

## Outcome and scope

One computer hosts one authoritative Forge data set and one built version of the web app. The owner opens that address on the computer and a phone on the same trusted Wi-Fi. A saved workout, program, body measurement, target, custom food, or diary entry becomes visible on the other device without a manual export/import. The computer must remain awake, connected, and running the Forge server.

This is a single-owner, local-network release, not an internet or multi-account service. Existing records must survive migration. The first release does not promise offline edits, background sync, access while the computer is off, or app installation from a plain-HTTP LAN address. A disconnected client may show its last synced snapshot, clearly marked read-only. It must never imply an unsaved workout set was saved.

## Current state and constraints

- React 19, Vite 8, TypeScript, pnpm 11; `src/hooks/useAppData.ts` writes a complete `AppDataV2` document through `src/data/localStorageRepository.ts` to each browser's `localStorage` key `workout-tracker:data`.
- `src/data/migrations.ts` accepts V1 and V2, but validates only top-level collections. Do not trust it alone at a network boundary.
- Settings already provides JSON export/import and scoped resets. Preserve the V2 backup format and confirmation workflow.
- `vite.config.ts` generates a production service worker that currently intercepts every same-origin GET. It must never cache `/api/*` responses.
- The repository currently has unrelated, unfinished manual-nutrition-target tests and user-owned untracked files. Preserve them and establish a green baseline before sync implementation.

## Architecture

Use a small Node server on the computer. It serves the production `dist/` files and same-origin `/api/*` routes from one LAN port. Its canonical V2 document, integer revision, and recent mutation IDs live outside the OneDrive project tree at `%LOCALAPPDATA%\Forge\data\state.json`. Writes are serialized, validated, flushed to a same-directory temporary file, and atomically replaced; a recoverable previous-good copy and dated export backups are retained. Startup refuses to overwrite malformed state.

The browser loads `{ data, revision }` from the server before showing writable content. Feature actions become typed mutations. The server validates and applies each mutation to its latest document, persists, increments the revision, and returns the new snapshot. Idempotency IDs make network retries safe. Clients check for changes on window focus and at a short interval; a successful mutation refreshes the current client immediately. Same-record concurrent edits must produce an explicit conflict, never last-write-wins. Different-record edits may be safely rebased. Reset and full import require an exact revision and fresh confirmation.

Release defaults: 5-second refresh while a tab is visible; 10 MiB maximum JSON request; 256 recent mutation IDs retained for deduplication; 10-minute pairing-code lifetime; and at most five invalid pairing attempts per 10-minute window per source address. These values are configuration constants, not user-facing estimates.

The server uses a one-time pairing code shown locally on the computer. Paired browsers receive an HttpOnly, SameSite=Strict session cookie. All data endpoints require that cookie; writes also require expected same-origin `Origin`, JSON content type, input-size bounds, and validation. Bind to the selected private Wi-Fi address, not all interfaces; use a Private-profile firewall rule for only the chosen port. Do not port-forward or expose this HTTP version on the internet. HTTP on a LAN is not encrypted; pairing does not prevent a network observer from reading traffic. HTTPS or a trusted private tunnel is a separate follow-up before use on an untrusted network.

## Data migration

Before switching storage, export a JSON backup from every browser that contains wanted data. The owner explicitly selects one backup as canonical. The new server validates and imports that backup once, after previewing counts and confirming replacement. Other device-local stores are not silently merged or deleted. After pairing, each browser displays the server data and offers to download its old local data before retiring local writes. A later merge feature may be planned separately; duplicate or conflicting records must not be guessed into this release.

## User-visible behavior

- Header shows `Connected to your computer`, `Reconnecting — read-only`, or `Change needs review` instead of `Stored locally`.
- Pairing explains where to find the computer code; no data is shown before pairing.
- On a failed save, the UI retains the attempted change in memory, shows a clear error, and allows a JSON download of the unsaved change. It never displays a failed save as confirmed.
- The LAN address may change after Wi-Fi reconnect. Setup docs explain how to re-check it or reserve a DHCP address. Phone and computer use the same server URL; `localhost` on the phone means the phone, not the computer.
- PC sleep/shutdown or server stop makes the phone read-only until the connection returns. On reconnect, refresh from the canonical server before enabling writes.

## Acceptance criteria

1. One computer and one phone, on the same Wi-Fi, open the same built app version and see the same initial server data.
2. Add a food entry on the phone; it appears on the computer without export/import. Edit a program or log a workout set on the computer; it appears on the phone.
3. Refresh and server restart preserve every acknowledged edit. Repeated delivery of one mutation does not create a duplicate.
4. Simultaneous edits to one record cause a visible conflict and no silent overwrite; edits to unrelated records both survive.
5. An unreachable server disables writes, shows an accurate state, and recovers when it returns.
6. A malformed request, unsupported data version, wrong pairing code, unauthenticated read, and cross-origin write are rejected without changing stored data.
7. Export/import and category reset act on the shared server only, require confirmation, and retain a recoverable backup. Existing local data remains available for manual recovery during migration.
8. The service worker never stores API or personal response data; no offline installation is promised on an HTTP LAN IP.

## Explicit follow-ups, not prerequisites

Remote access when the PC is off requires hosted infrastructure. Offline workout edits require a durable client operation queue and reconciliation policy. HTTPS and a trusted certificate/tunnel are required before using untrusted networks or offering phone PWA installation. Multi-user accounts, automatic merging of two legacy browser databases, and cloud sync are outside this release.

# Forge cloud and offline sync specification

## Goal

The same owner can open Forge on a computer at home and a phone at the gym, using one account and one canonical data set. Neither device needs to be on the same network, and the computer may be off. When the phone temporarily has no internet, it can keep logging a workout locally and later synchronize without silently losing a confirmed set.

## Chosen first-release architecture

- Deploy the Vite production build to an HTTPS static host (Vercel Hobby is the initial candidate). Both devices use one public URL and receive the same current app release when online. Offline devices may temporarily display an older cached shell until they reconnect.
- Use Google sign-in through Supabase Auth for one personal account and a Supabase Postgres row per user containing the existing `AppDataV2` JSON document plus an integer revision and bounded recent mutation IDs. This avoids a large relational rewrite while the app is still single-user. The JSON document has a 10 MiB application limit; revisit normalization before it becomes large. Do not request Google scopes beyond basic identity (`openid`, email, profile).
- Enable row-level security (RLS) for every exposed table. The browser uses only the publishable key; no service-role/secret key is included in the build. Select, insert, and update policies check `auth.uid() = user_id`; tests use two accounts to verify isolation.
- Keep an acknowledged snapshot and a durable mutation queue in IndexedDB on each device. Apply typed idempotent mutations locally for responsive forms and workout sets. On reconnect, fetch the cloud revision and replay queued operations in order using compare-and-swap updates. Each mutation has a stable ID. Different-record changes may rebase; concurrent same-record changes stop for user review. A failed or pending save is never represented as cloud-synced.
- Refresh on app focus and periodically while online; do not require realtime subscriptions for first release. Use the current service worker only for the app shell/assets, never cache auth tokens or user data in Cache Storage. HTTPS hosting makes service-worker support possible, but browser storage can still be evicted.

## User experience

- Sign in with the same Google account on phone and computer. Show `Synced`, `Saving`, `Offline — 3 changes on this device`, or `Sync needs review` in the app header and workout screen.
- Logging a set offline immediately records it in the local durable queue. The user can continue the guided session and rest timer. On reconnection, the queue uploads automatically while the app is open. Do not rely solely on background sync, which may not run predictably when the browser is closed.
- If a queued mutation fails validation or conflicts with another edit, keep it on the device, show an actionable review screen, and allow export of pending changes. Never discard it automatically.
- A first-time offline visit cannot load an uncached app. The user must visit and sign in online at least once before relying on cached access. The account session may require reauthentication on reconnect; keep pending mutations until they are acknowledged or explicitly exported/discarded.
- Export/import remains available. Before first cloud migration, download backups from each existing browser. Choose one as the canonical starting set; do not auto-merge two old databases. The migration preview shows counts and requires confirmation. The old localStorage data is not silently deleted.

## Privacy, operations, and limits

- Workout, body, and nutrition records will be stored with the cloud provider, not only on the user's devices. This is a material change from today's local-only privacy model and must be explained before enabling upload.
- Google OAuth setup needs a Google Cloud project, an OAuth Web client, the hosted site's authorized JavaScript origin, Supabase's exact callback URI, and production/localhost redirect allow-list entries in Supabase. Keep the Google client secret only in Supabase's provider configuration. The user must connect or create these external accounts before an actual deployment can be completed.
- Use HTTPS, Auth, RLS, least-privilege keys, strict nested-document validation, a size limit, and tests for cross-user access. Recheck Supabase security advisories before release.
- The suggested free tiers are for development and early personal use, not a reliability guarantee. At the time of planning, Vercel Hobby is for personal, non-commercial use; Supabase Free pauses projects after one week of inactivity and does not include automatic backups. Keep manual JSON exports and document the upgrade/restore path; check current pricing before account creation.
- No computer-hosted server, VPN, router port forwarding, or same-Wi-Fi requirement. Internet is required for cross-device synchronization; a device can still record local queued changes while temporarily offline after initial setup.

## Acceptance tests

1. Sign in with the same Google account on phone and computer over different networks; both load the same data and current online release. Sign in with a different Google account and see no data belonging to the first.
2. Save a workout set, food entry, body weight, and program edit on one device; each appears on the other after refresh/poll without import/export.
3. Disconnect the phone during a workout; log several sets and complete the session. The app shows the pending count, survives reload, and syncs exactly once when online again.
4. Two devices editing different records both succeed. Two devices editing the same record produce an explicit conflict with neither change silently overwritten.
5. A second account cannot select, insert, update, or delete the first account's document, even when calling the data API directly.
6. Wrong credentials, expired session, malformed backup, oversized document, database outage, and lost response preserve local pending data and show accurate status.
7. Export/import round-trip all current V2 data. A server-side cloud revision mismatch blocks destructive import/reset.

## Out of scope

Sharing accounts with multiple people, social features, fully automatic merge of two legacy browser data sets, unlimited offline storage, guaranteed background upload when the app is closed, and a native App Store/Play Store package.

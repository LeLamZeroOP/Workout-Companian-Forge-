# Forge — Workout Companion

Forge is a responsive workout web app for planning programs, running guided gym sessions, reviewing training volume, tracking body measurements, and keeping a simple nutrition diary. It works on desktop and mobile. Without cloud configuration, records remain on one device. Optional Google/Supabase mode supports account sync, offline logging, reviewed conflict recovery, and selective imports.

## What it includes

- Multiple workout programs and ordered guided sessions
- Set logging, reviewed early finishes, rest timers, and saved sound/vibration/screen-awake preferences
- A mobile workout workspace with large set inputs, visible completion progress, and a plan preview before starting
- Weekly activity, an active-session resume summary, and a suggestion for the next workout in program order
- Searchable workout history and exercise charts for load, volume, repetitions, and completed sets
- Replace/remove exercises and edit rep targets, rest, and notes during an active workout
- Effective muscle-set summaries using configurable contribution weights
- Body-weight and measurement history with a seven-entry moving average
- Optional calorie-range and macronutrient estimates
- An offline catalog of common foods plus user-created foods
- Daily meal logging with calorie and macro totals
- Full-data export, selective local/backup-to-account merge, conflict recovery, and explicit full restore
- My foods with named portions, optional macros, favorites, and immutable diary snapshots
- Spreadsheet CSV downloads for filtered workouts, body measurements, and a selected diary day
- Recovery for unreadable browser data, retained drafts after failed saves, and cross-tab edit review
- Section URLs with browser Back/Forward navigation and reload persistence

## Run locally

Requirements: a current Node.js LTS release and pnpm.

```bash
pnpm install
pnpm dev
```

Open the URL printed by Vite. For a production preview with offline support:

```bash
pnpm build
pnpm preview
```

The service worker is registered only in production builds. Visit the production app online once before expecting it to open offline.

## Editing an active workout

Use **Add exercise** or **Replace exercise** directly below the current set entry or rest timer during a workout. Both controls search the full exercise library and saved custom exercises. Replacement preserves completed sets under the original exercise and moves unfinished sets to the replacement with blank weight/reps. The three-dot **Exercise options** button beside the current exercise, or beside an exercise in workout order, also provides replacement, detail editing, and removal. Removal asks for confirmation and removes that exercise's logged results from this session.

Use **Add exercise** to append a library movement to an active workout, including an empty session. New movements start with three working sets, 8–12 rep targets, and 90 seconds rest; adjust them with the existing exercise and set controls. Adding a movement preserves current progress and running rest, and does not modify the program.

Both the add and replacement pickers offer **Create custom exercise**. Enter a name, equipment, primary muscle, and optional setup notes, then choose **Create and add** or **Create and replace**. The new library entry and session change save together, including in the offline account queue. Completed sets retain their original movement. The selected primary muscle counts as one direct set per working set; use the exercise editor in Programs to refine additional muscle contributions later. Failed saves retain the form, and unacknowledged custom definitions remain with the workout draft across reopening until the session save is acknowledged.

Use **Edit details** beside the workout title to change this session's name and notes. Exercise details include rep targets, rest seconds, and notes. Rest edits apply to future timers; a running rest timer retains its end time. Save/Cancel applies to each editor. A rejected save retains the editor and entered changes for retry. These changes save through the existing workout draft flow and do not change the program template.

On **Today**, the weekly strip counts completed sessions from Monday through Sunday in your local timezone. The next-workout suggestion follows the order of workouts in the selected program, based on its most recent completed session. It is a suggestion, independent of a calendar schedule; choose another workout at any time. An active session takes priority and shows your current exercise and completion progress.

After completing at least one valid set, **Finish early** opens a review of the unfinished sets. Confirming saves the completed results and notes, stops rest timing, and preserves unfinished sets in the saved session. History and training summaries count completed working sets by default. Progress can also include warm-ups explicitly; its **Reps** and **Sets** charts are useful for bodyweight movements logged at 0 kg.

In **Settings → Workout preferences**, choose whether rest completion plays a chime, requests vibration, or keeps the screen awake during an active workout. Settings persist across reloads. Device support, playback permissions, and browser suspension affect alerts and wake lock.

For a separate local test version (cloud sync disabled), run `pnpm dev:test` and open the printed URL. It uses port 4180, which keeps its browser data separate from the normal app URL.

## Verification

Upcoming UI and design work is tracked in the [interface update roadmap](planning/ui-interface-roadmap.md). See the [current design and interaction decisions](docs/ui-redesign.md) for the completed redesign, motion and selection updates.

See the [workout design update and verification record](docs/releases/2026-10-08-workout-design.md) for the latest UI changes and responsive preview images, and the [8 October production release](docs/releases/2026-10-08-production.md) for deployment details.

```bash
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
pnpm test:e2e
```

The end-to-end suite uses Chromium. Install its local test binary once if Playwright requests it:

```bash
pnpm exec playwright install chromium
```

## Privacy and storage

The default local mode does not require an account or send workout, body, or nutrition records to a server. It stores a versioned document in the browser's `localStorage` under `workout-tracker:data`.

When the two public Supabase environment variables are configured, Forge requires Google sign-in and stores the account's document in Supabase. A local IndexedDB copy keeps pending mutations until they can sync. The priority update was deployed on 27 September 2026 with its database compatibility migration. Live-account OAuth and physical-phone acceptance checks remain outstanding; see the release record in docs/releases/2026-09-27.md. Follow [the cloud setup and acceptance guide](docs/cloud-setup.md) before relying on it.

Browser storage is device- and browser-profile-specific. Clearing site data, using private browsing, or uninstalling a browser can remove local or unsynced records. Download a backup from **Settings** before changing devices or clearing storage.

## Backup, import, and recovery

Backups are readable JSON documents containing programs, exercises, sessions, settings, body records, nutrition targets, custom foods, and diary entries.

To restore data:

1. Open **Settings**.
2. Under **Import a backup**, choose a Forge JSON file.
3. Review the validated record counts.
4. Select **Replace my data** and confirm.

Forge validates the complete document before replacement. Invalid or unsupported files do not overwrite current data. Files above 10 MB are rejected before reading. Category resets are also available for workouts, body records, nutrition records, or everything. Reset actions are irreversible without a backup. **Reset everything** also removes saved merge metadata and library overrides, clears local workout drafts, and restores default workout preferences.

If saved browser data cannot be read, the recovery screen preserves it and pauses edits. **Download original saved data** saves the original bytes. Try loading again or review a valid backup and confirm its replacement. Storage failures keep editors open for retry. Updates from another tab refresh the saved document and block conflicting drafts until reviewed.

For spreadsheets, use **History → Export history CSV** for sessions matching the current search and date filters, **Body → Export measurements CSV** for all saved measurements, or **Nutrition → Export day CSV** for the selected date. Workout CSV retains the original set positions, IDs, notes, and warm-ups; diary CSV uses the saved nutrient snapshots. Unknown nutrients remain blank, and spreadsheet formula prefixes in text are escaped. CSV files are for analysis; use the JSON backup for a full restore.

## Nutrition estimates and limitations

The optional energy estimate uses the Mifflin–St Jeor resting-energy equation, a selected activity multiplier, and a conservative goal adjustment. Forge presents a range because individual energy needs vary. Default macro percentages are 25% protein, 45% carbohydrate, and 30% fat.

Automatic estimates are intended only for adults who confirm the eligibility statement in the profile form. They are informational estimates—not medical advice, a diagnosis, or a promised rate of weight change. Use manual targets or qualified professional guidance when an automatic estimate is inappropriate.

## Food data

The bundled common-food catalog uses normalized records from USDA FoodData Central and distinguishes preparation states when the source data does. Catalog nutrients are stored per 100 grams and scaled to the logged amount. My foods also supports named portions without an invented gram conversion. Unknown macros remain null; diary summaries show known totals and flag incomplete data. Diary entries retain a nutrient snapshot, so old entries do not change when a catalog item changes.

Custom foods use the label values entered by the user. USDA data and food labels can include rounding and preparation variation; displayed totals should be treated as estimates.

The development-only import script reads `USDA_FDC_API_KEY` from the local environment. The key must never be placed in browser code or committed data.

## Data format

The app uses export schema version `4`. Versions `1`–`3` migrate to `4` without changing historical records. Version 4 adds optional repeat cycles, muscle roles and targets, and exercise-emphasis metadata. Version 3 added named portions, unknown macros, measurement ordering metadata, and an optional durable merge ledger. Newer unsupported versions are rejected rather than guessed or partially imported. Production supports schema 4, and the [8 October production release](docs/releases/2026-10-08-production.md) includes the latest improvements without an additional database migration.

## Priority update: account rollout

The [schema-3 constraint migration](docs/cloud-schema-v3.sql) was applied to production on 27 September 2026 before publishing this client. It preserves records, revisions, and RLS policies. See the [release record](docs/releases/2026-09-27.md) for verification and remaining live-account checks. Apply the migration first when deploying to another existing schema-2 database. A pre-v3 client cannot read v3 documents; rollbacks must retain a v3-capable reader. Do not restore old account snapshots over later edits as a code rollback.

Settings → **Merge selected data** accepts this browser's signed-out local copy or an explicitly chosen Forge backup. It starts with no selections and excludes unfinished sessions, profiles, targets, preferences, and active-session selection. Review required definitions, duplicates and conflicting records, then confirm the destination account and totals. Nothing is uploaded during ordinary selection or preview. Newer cloud revisions, changed sources, pending edits, or failed local backup persistence block confirmation. Recovery snapshots stay in account-scoped IndexedDB; Settings can download them. A receipt in the cloud document and permanent source/copy mappings make acknowledgement recovery and repeat imports safe. Neither receipts nor mappings are automatically pruned; reaching the document size limit blocks further growth instead of forgetting import history.

**Sync recovery** compares the device and account versions. Review all dependent queued edits together, then keep account/local values or make a separate copy where supported. Exporting pending changes is diagnostic backup only; it does not resolve the queue or permit sign-out. If acknowledgement is uncertain, reconnect and use Retry sync before starting another operation. A prepared, previously confirmed operation is reconciled against its original revision and operation identity.

Account writes use Web Locks to serialize tabs. Selective merge, full replacement, and conflict resolution require this browser capability. An update worker normally waits until every Forge tab closes. Settings → **App updates → Check for updates** checks for a newer build. When one is ready, save your edits and go to Today to choose **Update and reload**. This action is blocked during an active workout, pending sync or conflicts, save errors, or while another Forge tab/app window is open. Saved data remains in browser storage across app updates. Older installations without these controls need all Forge tabs and app windows closed and reopened once to receive them; clearing browser data is unnecessary.

For measurements, newest recorded day/time wins, followed by saved logical entry order. Old tied timestamps use their existing array order (later position wins). This is a stable fallback, not a reconstruction of historical creation times. New logs save their chosen calendar date; editing without changing it preserves the recorded timestamp and original order. Existing nutrition targets change only through the explicit target action.


## Core journal improvements (local continuation)

The core journal includes light/dark/system themes, the numbered workout editor, compact workout selection on Today, durable active-set drafts with previous results and undo, consistent working-set analytics, history correction, and snapshot-preserving diary editing/copying. See [the original implementation details](docs/superpowers/plans/2026-09-27-core-improvements.md) and [the 8 October improvements](docs/releases/2026-10-08-local-improvements.md) for the newest changes and verification. The 8 October changes are published to the main app.

Workout drafts are scoped to the account and session on this browser. They persist while typing; leaving a field or taking a workout action submits the saved change. External session changes require an explicit decision. Rest timing uses a saved end timestamp, but suspended browsers cannot guarantee an alarm.

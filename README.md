# Forge — Workout Companion

Forge is a responsive workout web app for planning programs, running guided gym sessions, reviewing training volume, tracking body measurements, and keeping a simple nutrition diary. It works on desktop and mobile. Without cloud configuration, records remain on one device. An optional Google/Supabase mode is under development for account sync and offline logging.

## What it includes

- Multiple workout programs and ordered guided sessions
- Set logging, rest timers, workout history, and exercise-volume charts
- Effective muscle-set summaries using configurable contribution weights
- Body-weight and measurement history with a seven-entry moving average
- Optional calorie-range and macronutrient estimates
- An offline catalog of common foods plus user-created foods
- Daily meal logging with calorie and macro totals
- Full-data export, validated import preview, and category-specific resets

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

## Verification

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

When the two public Supabase environment variables are configured, Forge requires Google sign-in and stores the account's document in Supabase. A local IndexedDB copy keeps pending mutations until they can sync. This hosted mode has not yet been deployed or verified against a live project. Follow [the cloud setup and acceptance guide](docs/cloud-setup.md) before relying on it.

Browser storage is device- and browser-profile-specific. Clearing site data, using private browsing, or uninstalling a browser can remove local or unsynced records. Download a backup from **Settings** before changing devices or clearing storage.

## Backup, import, and recovery

Backups are readable JSON documents containing programs, exercises, sessions, settings, body records, nutrition targets, custom foods, and diary entries.

To restore data:

1. Open **Settings**.
2. Under **Import a backup**, choose a Forge JSON file.
3. Review the validated record counts.
4. Select **Replace my data** and confirm.

Forge validates the complete document before replacement. Invalid or unsupported files do not overwrite current data. Category resets are also available for workouts, body records, nutrition records, or everything. Reset actions are irreversible without a backup.

## Nutrition estimates and limitations

The optional energy estimate uses the Mifflin–St Jeor resting-energy equation, a selected activity multiplier, and a conservative goal adjustment. Forge presents a range because individual energy needs vary. Default macro percentages are 25% protein, 45% carbohydrate, and 30% fat.

Automatic estimates are intended only for adults who confirm the eligibility statement in the profile form. They are informational estimates—not medical advice, a diagnosis, or a promised rate of weight change. Use manual targets or qualified professional guidance when an automatic estimate is inappropriate.

## Food data

The bundled common-food catalog uses normalized records from USDA FoodData Central and distinguishes preparation states when the source data does. Nutrients are stored per 100 grams and scaled to the logged amount. Diary entries retain a nutrient snapshot, so old entries do not change when a catalog item changes.

Custom foods use the label values entered by the user. USDA data and food labels can include rounding and preparation variation; displayed totals should be treated as estimates.

The development-only import script reads `USDA_FDC_API_KEY` from the local environment. The key must never be placed in browser code or committed data.

## Data format

The current export schema is version `2`. Version `1` workout documents migrate locally to version `2` with empty body and nutrition collections. Newer unsupported versions are rejected rather than guessed or partially imported.

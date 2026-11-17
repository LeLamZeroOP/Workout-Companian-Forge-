# Tracking screens (Chunk 5) — 17 November 2026

This is local work on branch `ui/chunk-5-tracking`, which builds on `main` (Chunks 1, 3 and 4). It isn't deployed. It is Chunk 5 of [the UI and design update plan](../../planning/ui-design-update-plan-2026-11-17.md), and covers roadmap Batch 5.

These screens were reviewed with synthetic data for the first time: 12 completed workouts over four weeks, 7 weight entries, a nutrition target and four diary entries, one with unknown carbs and fat. The data was written only to the local dev server's storage on port 4181.

## Changes

### Shared

- **One date format:** `formatDisplayDate` in `src/domain/calendar.ts` gives "Nov 12, 2026" everywhere. Progress showed three formats on one screen ("11/12/2026", "Nov 12", "2026-11-12"), and Body's table used ISO dates. Chart tables, chart tooltips, axis ticks and the personal-best date now all use it.
- **Chart key:** every trend chart shows its unit (kg, reps, sets). Charts with two series get a legend, and the second series is now dashed as well as coloured, so it can be told apart without colour.
- **Date range filter:** the new `src/components/DateRangeFilter.tsx` puts From/Through behind a "Date range" disclosure. The summary always shows the active range ("All dates" or "Nov 1, 2026 – today"), so filtering is never hidden. It opens itself when a range is set or invalid. The labels stay "From" and "Through".

### History

- Sessions are grouped by month ("November 2026 · 7 sessions").
- Each row shows the weekday instead of the repeated year, and adds the duration ("1 h 15 min") to sets and volume.
- Search stays visible, the date range is collapsed, and Export history CSV sits on the same row. At 390px the first session now starts at about 520px instead of about 600px.

### Progress

- The Training/Muscles switch comes first, followed by the training filters.
- Before any workout is completed, the date range, warm-up toggle and counting note are hidden, leaving the switch and the empty state.

### Body

- The latest-weight card says when it was recorded ("Recorded Nov 17, 2026"). A drop uses a real minus sign ("−0.4 kg").
- The weight chart's axis fits the data (79–84 kg in the sample) instead of starting at 0. Before, a 2 kg trend looked flat on a 0–100 kg scale. Exercise charts keep their zero baseline.

### Nutrition

- **One date control:** the heading keeps the readable date ("Tuesday, November 17"). The date field is now a 44px calendar button that opens the browser's picker and shows the field while focused, so keyboard entry still works. Its accessible name is still "Diary date".
- **Target guidance in the totals card:** "No nutrition target is active…" and Set manual target / Edit target now sit in a footer inside the totals card.
- **Day actions beside the meals:** Copy day and Export day CSV moved from the top of the page to a "Meals · 4 entries" heading above the meal cards. At 390px the totals now start at about 290px instead of about 560px.
- Totals keep the number and its unit on one line ("1,415 kcal").
- **Existing bug fixed:** diary rows have four items (food, kcal, Edit, delete), but the grid had three columns, so every delete button wrapped onto its own line. It now has four columns.

## Not done in this chunk

- **A reusable demo-data seed** (proposed in the plan). The sample data was injected by hand for this review. A dev-only seed, so anyone can review populated screens, is still open.
- **History detail and session correction screens:** not changed.
- **Progress "Muscles" section** (`MuscleSummaryPage`): only checked for regressions, not redesigned.

## Tests

- New `tests/features/tracking-layout.test.tsx` covers the shared date format, History month groups, durations and range summary, the Progress order and hidden filters, the Nutrition totals footer and Meals actions, and the Body recorded date with a minus sign.
- Existing tests needed no changes: labels, button names and the nutrition header layout regression were all kept.

## Verification (17 November 2026)

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | Passed |
| `pnpm build` | Passed (existing chunk-size warning) |
| `pnpm test:run --testTimeout=20000` | 83 files, 389 tests passed on the first run |
| `pnpm exec playwright test --workers=2` | 73 passed, 1 skipped (opt-in live YouTube test) on the first run |

In the browser (dev server on port 4181) at 390px and 1280px: History groups and row facts were correct, Progress order and dates were consistent, the Body chart axis read 79–84 with legend and unit, the Nutrition calendar button was 44 × 44, totals and Meals were in their new places, diary rows stayed on one line, and nothing scrolled sideways. Not checked: physical phones, and how the native date picker looks across browsers (`showPicker` isn't available everywhere; typing the date still works there).

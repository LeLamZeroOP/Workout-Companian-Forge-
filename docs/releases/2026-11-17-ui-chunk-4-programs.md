# Programs page and editors (Chunk 4) — 17 November 2026

This is local work on branch `ui/chunk-4-programs`, which builds on `ui/chunk-3-shell` and `ui/chunk-1-quick-fixes`. It isn't deployed. It is Chunk 4 of [the UI and design update plan](../../planning/ui-design-update-plan-2026-11-17.md), and covers roadmap Batch 4.

## Changes

### Programs page

- **Delete is in a ⋯ menu.** Program cards show Edit, Duplicate, Export and a "More actions for <program>" button. The menu holds "Delete <program>" in the danger colour and still opens the existing confirmation. The new shared `src/components/ActionMenu.tsx` opens with focus on the first item. Arrow keys, Home and End move between items. Escape closes and returns focus to ⋯, and Tab or a click outside closes it.
- **Toolbar:** the program search field grows (up to 30rem) beside Create program instead of staying narrow.
- The split library and exercise library filter chips already shared one style (`.food-filters`), so the plan's G3 chip item needed no change.

### Program editor

- **Numbered sections in working order:** 1 Program, 2 Workouts (with counts), 3 Schedule and targets (optional), 4 Review. Before this, the 877px muscle-set table and the schedule card came before the first workout. Now workouts start right after the name, and at 1280px the form is about 3,550px tall instead of 4,140px.
- **Review is collapsible.** The muscle-set table starts collapsed. Its summary line still shows "Current plan · Muscle sets · N performed sets" and a "Partial totals" badge when exercise definitions are missing. The Programs page's split library keeps the open version.
- **Sticky save bar:** Cancel and Save program stay at the bottom of the window, and above the nav dock on phones. The bar shows the draft state: "No changes yet", "Unsaved changes" (with a dot) or "New program · not saved yet". Saving, the unsaved-changes prompt and conflict handling are unchanged.
- Exercise rows add "· notes" to the "3 × 8–12 · 90s rest" summary when notes exist. The workout stats now say "1 exercise" instead of "1 exercises".

### Exercise editor

- **Basics first:** name, equipment and chest emphasis share one row on wide screens, followed by setup notes.
- **Muscle mapping:** the two grids (effective sets per working set, reviewed roles) sit side by side from 1180px, with one explanation and a count ("3 weighted · 3 with roles"). They stay fully visible because the mapping is the main reason to open an exercise. The heading eyebrow changed from "Muscle mapping" to "Exercise editor" so it doesn't repeat the section name.
- The same sticky save bar and draft status as the program editor.

## Tests

- New `tests/features/program-editor-layout.test.tsx` covers the card menu (focus, Escape, delete only after confirming), section order, the collapsed review with its total, and the draft status for edited and new programs.
- `tests/e2e/muscle-volume.spec.ts` opens the collapsed review before its screenshots.

## Verification (17 November 2026)

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint` | Passed |
| `pnpm build` | Passed (existing chunk-size warning) |
| `pnpm test:run --testTimeout=20000` | 82 files, 384 tests passed on the first run |
| `pnpm exec playwright test --workers=2` | 73 passed, 1 skipped (opt-in live YouTube test) on the first run |

In the browser (dev server on port 4181), at 1280px: the ⋯ menu opened with focus on Delete, and Escape returned focus. The editor order and sticky bar were checked by measurement, and editing the name switched the status to "Unsaved changes". At 390px: the bar sat 8px above the nav dock, with no horizontal scroll and equal-width buttons. Not checked: physical phones and keyboard-only use of the full editor.

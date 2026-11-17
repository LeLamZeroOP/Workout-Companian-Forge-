# Workout workspace and daily overview — 8 October 2026

This local update prioritizes set logging on small screens while retaining Forge's blue accent, existing typography, and light/dark themes.

## Interface changes

- The active workout has a compact program/elapsed header and a native completion indicator. Large weight and repetition fields and the Complete set action appear before the historical set table.
- Current exercise, set position, rep targets, rest duration, and load units are grouped together. Previous-set values sit near entry fields; the historical-load convention appears beside the set log.
- Workout details, exercise options, and set-count edits remain available with quieter controls. Workout order expands on desktop and starts collapsed on mobile. Discard is separated from the main logging action.
- Manual set completion focuses rest controls; skipping rest and choosing a recorded set return focus to entry. Dialogs retain keyboard navigation and restore focus on cancellation.
- Before starting, the selected workout previews its ordered exercises, sets, target repetitions, rest times, and notes. An empty program library links directly to the program builder.
- Today shows valid completed sets for an active session, the current exercise, and a resume action. A Monday–Sunday strip counts completed workouts in the user's local timezone.
- Today suggests the next workout in the selected program's template order, using its latest completed session. The suggestion wraps after the final workout, ignores future/other-program results, and falls back to the first template if the previous template was removed. Users can select any workout. This is independent of calendar scheduling.
- Mobile navigation labels are larger. Short viewports use a compact session header and spacing so the primary set action fits above navigation at 375×667. Inputs remain at least 64px high and the completion action at least 48px high. Long names, notes, enlarged text, reduced motion, and forced colors retain the relevant controls.

## Correctness and recovery

- Structural workout edits return a save result. Rejected edits/removals/replacements remain pending in their panels; a failed completion does not advance progress or begin rest. Typed input remains available for correction or retry.
- Save errors appear inside the active editor or confirmation, rather than behind it. Failed finish and discard attempts keep their confirmation and support retry. Exceptions receive a recovery message.
- Conflict resolution distinguishes invalid data from persistence rejection. A saved-session acknowledgement clears an obsolete device-draft cache error.
- Previous performance matches the same occurrence of repeated movements, uses actual completion instants across timezone offsets, and searches older compatible results when the latest session has no valid sets of the requested kind.
- Previous set ordinals preserve skipped and invalid historical positions. An unrecorded second set stays blank; it cannot silently receive the third set's load. History selection is memoized independently of typed weight/repetition changes.
- Same-day summaries use the current instant on each render, so a newly received completion appears without waiting for midnight or a focus event.

## Verification scope

The verification uses isolated browser fixtures. The user's active workout at the existing local preview was inspected without editing its records. Chromium responsive coverage includes 320×568, 375×667, 375×812, 390×844, 768×1024, and desktop widths of 1280 and 1440 pixels, across light/dark themes. The enlarged-text check doubles rendered text, including controls created during rest, and also checks reduced motion and forced colors.

Final results:

- `pnpm test:run`: 298 tests across 66 files passed (72.14 seconds).
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm build`: passed; initial JS 475.78 kB / 136.65 kB gzip, CSS 75.47 kB / 14.12 kB gzip. Charts retain their separate deferred chunk. No dependencies were added.
- `pnpm test:e2e --workers=6`: all 38 Chromium tests passed (24.2 seconds).
- `git diff --check`: passed.
- Sampled text/accent token pairs in both themes have contrast ratios from 4.75:1 to 6.97:1; the primary light-theme button pair is 5.36:1. This sampling does not represent a complete accessibility audit.

Representative previews are saved under `output/playwright/workout-design-*.png` for mobile logging, rest, tablet/desktop logging, plan selection, and Today.

Physical phones, native screen readers, Safari/WebKit, and a live authenticated cloud account were not exercised. The synchronous save-result changes cover local persistence and callback rejection; asynchronous cloud/server failure continues through the existing queued-sync recovery flow.

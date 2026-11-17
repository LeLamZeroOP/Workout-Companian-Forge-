# UI quick fixes (Chunk 1) — 17 November 2026

This is local work on branch `ui/chunk-1-quick-fixes`. It isn't deployed. It is Chunk 1 of [the UI and design update plan](../../planning/ui-design-update-plan-2026-11-17.md).

## Changes

- **Workout timer:** elapsed time shows hours after the first hour, so `2:14:41` instead of `134:41`. The new `formatElapsed` lives in `useElapsedTime.ts`.
- **Today:** the weekly tile is now "Sessions this week". Below the count it shows the last completed date ("Last on Nov 12") or "None completed yet", instead of repeating the count. The Programs tile shows "<first> + N more" when there are several programs.
- **Empty states:** History and Progress now have a "Start a workout" button that opens Workout, the same pattern as Body's empty state. Paragraphs in an empty state stay muted when an action follows them.
- **Nutrition:** removed the repeated "Meal" label above Breakfast, Lunch, Dinner and Snack.
- **Page descriptions:** Settings now reads "Rest alerts, backups, and your saved data." (there is no units setting). Body now reads "Track weight and measurements, and estimate your calorie target."
- **Clean-up:** removed the unreachable "Coming in the next build" screen from `App.tsx`.
- **Docs:** `planning/design.md` is marked archived. The plan's P4 (blank pages) is downgraded: the blank pages came from the hidden in-app browser pane, which stops animation frames.

## Verification (17 November 2026)

| Check | Result |
| --- | --- |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm test:run --testTimeout=20000` | First run: 1 of 379 failed, but the log kept only the summary, so which test is unknown. Re-run: 80 files, 379 tests passed. |
| `pnpm build` | Passed, with the existing chunk-size warning |
| Playwright (7 related specs: ui-redesign, ui-next-update, journal-improvements, body-nutrition, workout-design, nutrition-header-layout, mobile-timer) | 45 passed |
| Browser (dev server on port 4181, empty local data, 390px) | History empty state shows Start a workout, which opens the workout chooser. Today tiles, meal headings and the Settings description are as above. No console errors. |

New tests: hours in `timer-cadence.test.tsx`, empty-state actions in `history-page.test.tsx` and `progress-page.test.tsx`, and the updated weekly tile in `today-page.test.tsx`. Not checked: a real session longer than an hour in the browser (unit tests cover it), the light theme by eye, and physical phones.

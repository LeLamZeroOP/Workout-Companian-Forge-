# Local improvements — 8 October 2026

This update improves the current local checkout. It has not been deployed. Existing account configuration and earlier workspace changes remain in place.

## Workout and navigation

- Today restores the last selected program, prioritizes an active session even when its program was removed, and refreshes day-based summaries at local midnight or after browser suspension.
- New sessions copy template notes. A session with at least one valid completed set can finish early after a review of unfinished sets; recorded results and notes remain available in History.
- Finish validation is shared by local and cloud mutations. Invalid reps cannot finish a session, while a recorded 0 kg load supports bodyweight exercises.
- Settings saves rest sound, vibration, and screen-awake preferences. Rest alerts are deduplicated, and a released wake lock is requested again when the workout becomes visible.
- Browser Back/Forward, section URLs, reload persistence, and page titles work with the app navigation. Editor jump links and the skip link keep the selected section intact.

## Journals and progress

- History searches workout names, exercise names, and saved notes, with counts and a clear-filter action. Invalid or reversed dates show a correction message.
- Workout details retain session and exercise notes, original set positions, unknown values, and correctly rounded duration. Deleting a completed workout requires confirmation tied to that specific session.
- Body measurement history exposes saved circumferences and notes. Mobile edit/delete controls fit the viewport and have date/weight descriptions for assistive technology.
- My foods supports search, favorites, archive review, edit, and restore. Diary deletion offers Undo using the deleted snapshot even after the selected date changes.
- Calendar inputs reject impossible dates. Oversized nutrients, food amounts, and targets are checked before saving, so invalid forms remain open for correction.
- Progress excludes unfinished or invalid sets, uses the latest recorded exercise name, and labels a date-filtered record as “Best in selected period.” Invalid muscle ranges no longer silently show all sessions.
- Exercise trends now include daily repetitions and completed sets. These show bodyweight progress at 0 kg without inventing load or volume. Warm-ups remain optional, and count axes use whole numbers.

## Data protection and exports

- Local saves complete before updating the screen. Quota failures retain drafts and confirmation reviews for retry.
- Unreadable saved data opens recovery without overwriting the original document. Users can download its original bytes, retry loading, or review and confirm a validated replacement.
- Storage events refresh the saved document across tabs. A stale read detected immediately before saving blocks the write and loads the latest copy. Conflicting program, exercise, body, food, diary, target, and preference drafts require explicit review.
- Backup imports reject files over 10 MB before reading, clear stale previews, and block overlapping file/import operations. Cloud replacement has a single-flight guard and keeps its confirmation open during the operation.
- Full reset removes merge metadata, library overrides, and local workout drafts, and restores default workout preferences. Scoped resets preserve the other categories. Successful reset/restore actions show completion feedback.
- JSON backup downloads clean up temporary links, allow time before releasing the download URL, and explain failures for retry.
- History CSV uses the current filters; measurement CSV includes saved body entries; diary CSV uses the selected day's nutrient snapshots. Exports retain IDs, original set ordinals, warm-ups, and notes. Unknown nutrients stay blank; quoting, newlines, Unicode, and formula-leading text are handled.

## Editor and performance

- Exercise search matches readable muscle names, aliases, and equipment. Equipment is editable for custom exercises, with matching counts and filter recovery.
- Program editing respects the 14-workout and 20-exercise limits. Removing a workout clears its repeating-cycle references, and copying a maximum-length name still allows saving.
- Exercise pickers share prepared catalog options; search filtering reuses results.
- Charts load in a separate chunk while accessible tables appear immediately. The service worker caches the chart chunk for offline navigation.
- Initial JavaScript changed from **801.43 kB / 231.92 kB gzip** to **467.45 kB / 134.62 kB gzip**, approximately a **42% reduction**. Deferred chart JavaScript is **352.68 kB / 102.44 kB gzip**. This reduces JavaScript loaded by the initial app entry point; the offline cache still downloads chart assets in the background.

## Verification

| Check | Result |
| --- | --- |
| `pnpm test:run` | 276 tests passed across 64 files; two workers, 83.89 seconds |
| `pnpm typecheck` | Passed |
| `pnpm lint` | Passed |
| `pnpm build` | Passed; all JavaScript chunks below 500 kB |
| `pnpm test:e2e` | 29 Chromium scenarios passed against the final production build; 39.8 seconds |
| Git whitespace check | Passed with Windows CRLF handling |

Browser coverage includes early finish, saved notes, route reloads, all three CSV downloads, complete JSON backup downloads, full reset cleanup, quota failures and retry, cross-tab editor review, unrelated cross-tab saves during an active draft, corrupt-data recovery, offline chart loading, persisted preferences, narrow layouts, and keyboard skip-link behavior. The existing workout editing, timer, muscle-volume, body, nutrition, and service-worker update scenarios also ran.

Browser screenshots use disposable fixture data:

- `output/playwright/journal-history-mobile.png`
- `output/playwright/journal-body-mobile.png`
- `output/playwright/journal-bodyweight-progress-mobile.png`
- `output/playwright/journal-progress-offline-desktop.png`

Live Google sign-in/account synchronization and physical-device sound, vibration, and wake-lock behavior were not exercised. Local stale-write detection is an optimistic check; it does not provide an atomic transaction across simultaneous browser-tab writes. No deployment or account records were changed by this update.

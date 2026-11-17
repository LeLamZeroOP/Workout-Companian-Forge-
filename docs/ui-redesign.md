# Forge interface redesign

Reference: [Emil Kowalski's UI skills](https://github.com/emilkowalski/skills/tree/main), read October 9, 2026.

Forge remains a React web app. The redesign uses system typography, grouped white surfaces on a neutral canvas, blue primary actions, semantic accent colors, and translucent structural navigation. The same tokens support dark mode. Actions commit immediately; motion accompanies the resulting state.

## Skill coverage

| Skill | Application |
| --- | --- |
| apple-design | Materials, type hierarchy, depth, predictable controls, and motion/transparency/contrast preferences. |
| emil-design-eng | Shared tokens, intentional spacing, pointer-down press feedback, and restrained transitions. |
| animate | CSS transitions for presses, navigation, nutrition fills, saved-set feedback and occasional surfaces; staggered page entrances with no animation dependency. |
| animation-vocabulary | Consistent names for press feedback, origin-aware entrances, and reduced motion in implementation comments and reviews. |
| find-animation-opportunities | Page entrances and hover depth added following the user's request for more effects. Reading, typing, chart data and timer ticks stay stable. |
| improve-animations | Read-only motion audit identified keyboard entrances, reduced-motion press leakage, and popup origins. Implemented those findings in the redesign. |
| review-animations | Reviewed movement against frequency, duration, properties, origin, keyboard interaction, and accessibility criteria. |
| mobile-native | Dynamic viewport, safe areas, input sizing, hover capability checks, native tap handling, scroll containment, and matching browser chrome. |
| pick-ui-library | Retained Recharts and tested existing controls; added Sonner for confirmed local-save notifications. |
| ask-sonner | One root Toaster, theme synchronization, accessible notifications, safe-area offsets, and no success notification before a save is confirmed. Cloud save status remains authoritative. |
| break-ui | Responsive checks include narrow screens, long names, large text, empty states, dark mode, and reachability of workout actions. Test data remains isolated from personal storage. |
| prototype | Evaluated layout alternatives while developing the live interface. A variants picker is a separate exploration workflow and was not added to the production app. |
| animate-expo | Reviewed; its native runtimes and dependencies do not apply to React DOM. Adopted the shared restraint and touch-target principles. |
| write-swift | Reviewed; the app has no Swift code. No language or platform migration is part of this redesign. |

## Interaction decisions

| Before | After | Why |
| --- | --- | --- |
| Keyboard-opened selects shared the pointer entrance | Keyboard actions suppress transitions | Immediate feedback for repeated keyboard workflows. |
| Reduced-motion presses still translated | Opacity feedback without movement | Preserve feedback while respecting the preference. |
| The select's options animated inside static chrome | The whole popup enters from its top edge | The panel reads as a single surface connected to its trigger. |
| A single browser chrome color | ThemeControl updates the browser color | Match the selected light or dark appearance. |
| Generic card treatment everywhere | Consistent surfaces with semantic color and clearer hierarchy | Make the next action easy to find without hiding supporting tools. |

## Motion follow-up

At the user's request, page surfaces enter in a 40ms stagger with a 250ms opacity/transform animation. The highlight moves between navigation destinations using an interruptible 250ms transform transition and real button measurements, including on viewport resize. Card hovers lift by 3px; the training card gains a soft radial light and the existing buttons retain their design with a hover sheen and directional icon feedback. Nutrition bars use scaleX transitions; rest surfaces fade in and newly saved set checks enter once.

Entrances do not replay on edits or scrolling. Animation transforms are not retained after entry, preserving the viewport origin of nested dialogs. Hover effects require a fine pointer. Keyboard workflows remain instant, and reduced motion removes movement. The redundant chest-emphasis and contributing-exercise details were removed from the planned muscle summary.

## Selection follow-up

All remaining native selects now use the shared SelectControl, including muscle contributions and roles, equipment, chest emphasis, cycle days, training goals, target basis/period and plan comparisons. Menus show an accent selection row with a check, scroll long lists and choose an upward or downward origin based on viewport space, reserving space for the mobile navigation dock. Options receive focus without scrolling the page; the option list scrolls independently. Focus returns to the trigger on selection or Escape. Workout edit dialogs keep their inline menus inside the dialog's scroll area.

The repeated-chevron bug was caused by the native focus rule's background shorthand resetting the icon's repeat/position properties. That rule now changes only background-color. Segmented controls use one measured highlight across progress views, exercise metrics and muscle-summary periods/counting bases, with arrow/Home/End navigation and immediate keyboard changes.

## First roadmap update

Today now puts its training panel before weekly activity, with a compact expandable preview containing every exercise and a real planned-set count. The preview's chevron rotates and supporting browsers interpolate the disclosure height; reduced motion and keyboard input retain immediate updates. Body measurements show their recorded local date, without changing measurement ordering or diary calculations.

Short menus support typeahead: prefixes find labels, repeated letters cycle matches, and selection commits only on Enter/Space or click. Searchable menus retain text filtering. Menus listen to visual-viewport resize/scroll events, clamp into usable space and reveal the focused option within their own list.

The shared DialogSurface portals confirmation, workout and food dialogs to the document body, avoiding transformed ancestor positioning. It owns background scroll locking, nested Escape handling, initial focus, Tab containment and return focus. Dialog headings and confirmation footers remain outside the scrolling body; editor actions stick within it. Busy confirmations block dismissal. Workout detail validation now links field errors and focuses the first invalid field. Save rejection and draft retention follow the existing callbacks.

Menu/dialog exit transitions and broader validation were left for the second local update. No claim of physical software-keyboard acceptance is made.

Local verification on 9 October 2026: production build and lint passed, 67 unit-test files / 305 tests passed, and all 51 Chromium browser tests passed. The final unit run used `pnpm exec vitest run --maxWorkers=2 --testTimeout=15000`; earlier five-second runs intermittently timed out in long interface tests. Assertions were unchanged. The browser suite checked both themes, narrow/tablet/desktop layouts, 200% text, menu resizing, nested Escape, focus restoration and save rejection. The localhost preview reported no runtime errors during review.

After the final disclosure-motion adjustment, the production build and focused browser regression passed again, explicitly checking the `::details-content` transition for keyboard and reduced-motion use.

## Second roadmap update

OverlayPresence retains occasional menus and dialogs for a short pointer exit, while closed surfaces become inert and inaccessible immediately. DialogSurface releases its focus trap and scroll lock at dismissal; it restores focus after DOM mutations and skips stale triggers inside exiting surfaces. Reopening and switching editors cancel stale removal timers. Keyboard and reduced-motion use remove closed surfaces immediately.

ValidatedField and useValidationFocus provide linked inline messages, explicit invalid states and first-error focus for measurement, profile, target, food, program and exercise forms. Collapsed measurement/target sections open for submitted errors and show a Needs attention label. Food amounts and diary edits show live validation while retaining their existing disabled-save rules. Domain validation and saved-record calculations remain authoritative; correction/recovery flows remain part of later screen review.

TodayBalance presents the latest recorded measurement/date, daily weight samples and actual diary totals. The calorie fill caps visually at the selected target while its text preserves totals above that target. Missing macros remain unknown. Tablet overview columns and compact mobile metrics preserve the primary training action.

ProgressMeter separates the immediate accessible progress value from a decorative scaleX fill, with an instant reduced-motion update and native progress in forced colors. Rest is visually distinct and successful rest completion focuses set entry; rejected skipping keeps rest and does not announce advancement. Timer digits and drafts remain stable.

WorkoutCompletion appears only after the finish callback accepts and the authoritative record has a completion timestamp. It uses existing working-set, duration and recorded-volume definitions, reports retained warm-ups separately, and preserves pending/conflict/offline cloud status. One brief check animation accompanies this milestone. Focus lands on the summary heading; history, next-workout and Today actions remain reachable above mobile navigation.

New regressions cover inert exits, interrupted reopening/editor replacement, reduced-motion dismissal, invalid-field focus, accepted/rejected/missing-record completion, incomplete macro totals and rejected rest skipping. Browser previews use isolated synthetic records. Existing saved-content selectors now scope to the saved page content rather than matching text inside a retained closing editor.

Final local verification on 9 October 2026: `pnpm build`, `pnpm lint` and `git diff --check` passed. `pnpm exec vitest run --maxWorkers=2 --testTimeout=15000` passed 70 files / 319 tests. `pnpm exec playwright test --workers=2` passed all 54 Chromium tests after the production build. The suite includes both themes, 320/375/768/1440px layouts, enlarged text, forced colors, reduced motion, offline shell loading, save rejection/retry and cancellation. The development preview at `http://localhost:4180/` returned HTTP 200. No deployment or physical-device acceptance is included.

Synthetic previews: `output/playwright/ui-next-completion-desktop-light.png`, `ui-next-completion-mobile-dark.png`, `ui-next-today-tablet-light.png` and `ui-next-today-mobile-dark.png`.

## Verification boundaries

Nutrition header correction, 11 October 2026: the desktop toolbar could squeeze the diary date until individual words broke into fragments, especially with enlarged text. The toolbar now wraps when its content needs more space, reserves a useful minimum width for the date, and keeps its controls within the available width. Date words wrap at spaces. The date field grows with text size, and its narrow-screen minimum width is capped by its container. A browser regression covers intermediate desktop widths, both themes, enlarged text, control bounds and previous/next-day navigation. The production build and 22 related Chromium checks passed; the header regression passed again after the date-field sizing adjustment. Normal and enlarged-text previews are saved under `output/playwright/nutrition-header-1110-16px-light.png` and `nutrition-header-1110-32px-light.png`.

Automated browser checks cover responsive layouts and interactions. Physical iOS/Android verification is still needed for software keyboard behavior, input zoom, safe-area behavior, installed-PWA status bars, and touch feel; desktop emulation cannot establish those.

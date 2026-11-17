# Styling system consolidation (Chunk 7) — 17 November 2026

This is local work on branch `ui/chunk-7-styles`, which builds on `ui/chunk-6-workout-settings`. It isn't deployed. It is Chunk 7 of [the UI and design update plan](../../planning/ui-design-update-plan-2026-11-17.md), and covers roadmap Batch 6 apart from physical-device acceptance. The design-system reference (tokens, breakpoints, control states, baselines) is in [docs/ui-redesign.md](../ui-redesign.md#design-system-reference-ui-plan-chunk-7-17-november-2026).

It was done in small commits, each checked against new pixel baselines:

1. **Pixel baselines first** (decision 4). `tests/e2e/visual-baselines.spec.ts` covers nine screens (phone and desktop, light and dark) with a fixed clock, synthetic data and a masked timer. They matched across repeated runs. The first run also exposed two dates still in the browser's default format: the workout set log ("Last session · 11/12/2026") and the muscle plan comparison. Both now use `formatDisplayDate`.
2. **Tokens, no visual change.** A rem type scale and radius tokens replaced 314 literal `font-size` and `border-radius` values of exactly the same size. The baselines matched pixel for pixel. Text now follows the browser's font-size setting, and the enlarged-text layout specs pass.
3. **12px minimum text (intended change).** The 10px and 11px sizes (42 rules) and the 8px phone nav labels at 380px and below now use `--text-sm` (12px). At 320px every nav label still fits; "Programs" is 52px of text in a 55px button. The baselines were reviewed and regenerated. Today's weight change now uses a true minus sign, like Body.
4. **Breakpoints.** Three 600px phone rules moved to the shared 640px breakpoint, `@media(` spacing was normalised, and the Chunk 4 exercise-editor rules moved from 480/900/1180px onto 640/1100px. The baselines were unchanged. The 800/880/960/1060px workout and split-library breakpoints stay, documented as layout-specific.
5. **One definition per property.** A postcss script (kept outside the repo) removed 283 `global.css` declarations that `apple.css` always overrode: same selector list, same media query, same property, and `apple.css` loads later. `!important` declarations were never removed, and 38 rules that ended up empty were deleted. `global.css` went from 85 KB to 78 KB. The baselines matched pixel for pixel, and the full unit and e2e suites passed.
6. **State audit fixes.**
   - `ActionMenu` items had removed their focus outline and showed focus only by background colour, which disappears in forced-colours mode. They now keep a 2px inset outline.
   - `secondary-action[aria-pressed="true"]` had no style, so "My foods" looked the same open or closed. It now uses the filter-chip accent tint.
7. **Documentation:** tokens, breakpoints, stylesheet order, a table of shared control states, and how to update the baselines.

## Not done

- **Folding `apple.css` into `global.css` completely.** The remaining overlap is complementary (each file sets different properties on the same selector). Merging the two files is mechanical but touches every component. It's worth doing as its own change now that the baselines exist.
- **One-off radii:** about ten remain (5–22px) on workout and editor parts.
- **Remaining 800/880/960/1060px breakpoints:** not moved.
- **Physical iOS/Android acceptance** (roadmap Batch 6): still needs your phones.

## Verification (17 November 2026)

| Check | Result |
| --- | --- |
| `pnpm typecheck`, `pnpm lint`, `pnpm build` | Passed |
| `pnpm test:run --testTimeout=20000` | 84 files, 391 tests passed |
| `pnpm exec playwright test --workers=2` | 82 passed (including the 9 baselines), 1 skipped (opt-in live YouTube test), before the two state-audit CSS fixes |
| After the state-audit fixes | Rebuilt; the baselines plus `body-nutrition`, `ui-redesign` and `selection-controls` passed (36/36) |

Not checked: the "My foods" pressed tint by eye (the browser panel was in use), physical phones, and browsers other than Chromium.

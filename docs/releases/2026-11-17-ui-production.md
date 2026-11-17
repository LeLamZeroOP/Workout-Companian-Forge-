# Production: UI update (Chunks 1 and 3–7) — 17 November 2026

workout-companian-forge.vercel.app is serving commit `95c0198` on `main`: the UI plan's Chunks 1, 3, 4, 5, 6 and 7.

- Deployment: https://workout-companian-forge-cvi7zq5hv-lelamctin2005-3819.vercel.app (`dpl_5ese1MD69h5R9hqeN9nbedqKYQVy`). Target production, status Ready, built in 22 s, created 20:02 (UTC+7).
- Source: Vercel's GitHub integration (`source: git`, `githubCommitRef: main`, `githubCommitSha: 95c01980cc12…`). No CLI upload, no `vercel promote`, and no database migration.

## How this went live

The Vercel project deploys every push to GitHub `main` to production automatically. Earlier release notes describe CLI deploys (`vercel deploy --prod` then `vercel promote`), so this wasn't known when the UI chunks were merged. Each merge push therefore went live on its own:

| Time (UTC+7) | Deployment | Commit | What changed for users |
| --- | --- | --- | --- |
| ~18:05 | `1jr215fzj` | `8850345` | Nothing visible: the split export / add-exercise code was already live, plus the verification fixes and the UI plan document. |
| ~19:06 | `c246engtw` | `dfe322c` | Chunks 1, 3 and 4 (quick fixes, theme in Settings, nav order, live workout dot, Programs page and editors). |
| ~20:02 | `cvi7zq5hv` | `95c0198` | Chunks 5–7 (tracking screens, workout and Settings polish, styling tokens and 12px minimum text). |

The user had approved each merge but not a deploy, and was told after the first two merges that production was unchanged. That was wrong. The user then asked for a production deploy of `main`, which matches what is live.

## Checks

- Before merging, each chunk passed typecheck, lint, build, the unit suite and the e2e suite locally (see the chunk release notes). The final state passed 391 unit tests and 82 e2e tests, including 9 pixel baselines, with 1 skipped.
- Live smoke check: `/`, `/sw.js`, `/manifest.webmanifest` and the CSS bundle return HTTP 200. The live CSS file (`index-xrVbZ5Yo.css`) is byte-for-byte the local build of `95c0198`; the JS file name differs only because production bakes in the cloud environment. The live JS contains strings from Chunks 4–6 ("More actions for", "All dates", "Workout preferences saved").
- Not checked: signing in and using the live app (that would show personal data), cloud sync on the new screens, and physical phones.

## For users

Existing installs may keep the previous service worker while Forge is open. Finish any edits, close all Forge tabs and app windows, then reopen the main URL. Keep browser storage intact.

## Rollback

`vercel rollback https://workout-companian-forge-4bmvja8p2-lelamctin2005-3819.vercel.app --scope lelamctin2005-3819` returns production to the 17 November split-export build. Pushing to `main` will deploy again.

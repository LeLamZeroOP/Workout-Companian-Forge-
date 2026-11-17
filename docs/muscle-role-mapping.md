# Built-in muscle role review

Reviewed 30 September 2026. `src/domain/exerciseCatalog.ts` is the exact per-exercise mapping. Roles describe the intended principal and assisting muscles for the named movement, independently of Forge's existing fractional effective-set coefficients. They are not claims that every logged set delivers an equal growth stimulus. Saved user exercises, existing account copies, and historical sessions are never automatically rewritten from this table.

| Movement family | Direct role | Indirect role and assumptions |
|---|---|---|
| Flat, incline, machine chest presses; push-up | Chest | Triceps and front delts assist. Incline remains a chest movement with front-delt assistance. |
| Cable fly, pec deck | Chest | No secondary role recorded. |
| Pulldown, pull-up, chin-up | Lats | Biceps assist; upper back also assists except for the listed chin-up mapping. |
| Seated, barbell, chest-supported row | Upper back | Lats and biceps assist. One-arm dumbbell row is classified as lat-focused with upper-back and biceps assistance. |
| Straight-arm pulldown | Lats | No secondary role recorded. |
| Barbell and dumbbell shoulder press | Front delts | Side delts and triceps assist. |
| Lateral raises | Side delts | No secondary role recorded. |
| Reverse pec deck, face pull | Rear delts | Upper back assists. |
| Curl variants | Biceps | No secondary role recorded. |
| Triceps extension and pushdown | Triceps | No secondary role recorded. |
| Back, goblet, hack, split squat; leg press | Quads | Glutes assist. Leg-press hamstring coefficient remains in the separate weighted model; it is not labeled a reviewed indirect role. |
| Romanian deadlift variants | Hamstrings | Glutes assist. |
| Leg extension | Quads | No secondary role recorded. |
| Seated leg curl | Hamstrings | No secondary role recorded. |
| Hip thrust | Glutes | No secondary role recorded. |
| Standing calf raise | Calves | No secondary role recorded. |
| Cable crunch, hanging knee raise | Abs | No secondary role recorded. |

The role table covers the original 40 built-ins; the 17 added variants carry individual roles in `additionalExercises` in the same catalog file. Chest variants carry upper, mid or mixed exercise-emphasis metadata. Equipment setup, grip, range of motion, and individual technique can change emphasis. Users may edit a definition's future role metadata; a logged session keeps its snapshot. Unknown legacy roles remain visibly unknown in direct/indirect summaries.

# Split muscle volume and target guidance

Date: 27 September 2026
Status: **Plan only.** Requested after the core journal improvements. No app implementation, program prescription changes, account writes, or deployment are authorized by this planning update.

## Product goal

Before choosing or editing a split, answer four questions: Which muscles does it train? How many sets does each muscle receive? How are those sets distributed across sessions and rest days? How does that compare with the user's chosen target and what they actually completed?

A split name alone does not determine training volume. Calculate from the exercises, set prescriptions, muscle mappings, and explicit repeat schedule. Explain numbers at the point of use; do not present a body heat map or a single balance score as the source of truth.

## Proposed experience

### 1. Every library split gets a muscle summary

Add “Muscle sets” beside the workout preview. Show schedule basis, total performed working sets, sessions per cycle, and a compact muscle-by-workout matrix. Default to the actual calendar week for the four built-in schedules; offer cycle view for rotating programs. Include all tracked muscles: chest, lats, upper back, front/side/rear delts, biceps, triceps, quads, hamstrings, glutes, calves, and abs.

Each muscle row exposes:

| Field | Meaning |
|---|---|
| Direct sets | Working sets explicitly classified as directly targeting the muscle |
| Indirect sets | Working sets involving it as a secondary muscle; shown separately |
| Weighted contributions | Existing Forge sum of sets × saved coefficients, labeled an estimate |
| Frequency | Distinct scheduled sessions with direct work; indirect exposure is separate |
| Target | Optional user-selected range and its counting basis |
| Details | Exercises and sessions responsible for every count, plus unknown mappings |

Offer a neutral “Compare splits” view for up to two library splits using the same period and counting basis. Preserve template creator attribution, but attribute Forge's calculations and target guidance to Forge, not the influencer. Do not silently change the existing templates to make every row reach a generic target.

### 2. Program editor becomes a live volume planner

Place a compact “Muscle sets for this plan” summary before workout sections. A change to an exercise, set count, workout duplication, mapping, or repeat schedule immediately recomputes the preview. Expanded rows explain where the change came from. Counts remain a preview until Save program; Cancel preserves the saved program and historical sessions.

Example interaction: “Chest: 6 direct sets per cycle; 3 in Upper A and 3 in Upper B.” Expanding shows dumbbell press and pec deck. A separate weighted view may show more because a secondary contribution from another movement is included. A planned exercise with an unknown mapping is visible, never counted as zero with no explanation.

### 3. Targets are editable guidance with an explicit basis

Put “About set targets” beside the table. First ask the user's intent: muscle growth, strength practice, maintenance, or custom/no target. Do not reuse hypertrophy guidance as a strength prescription. Show the source-backed general reference for muscle growth; leave numerical per-muscle targets unset until the user chooses them. Provide per-muscle lower/upper values and priority tags (focus, maintain, no target). Target basis is either direct sets or the user's saved weighted-contribution convention and period is cycle or seven-day average.

Use the labels “Below your range,” “Within your range,” and “Above your range.” These compare only with the user's range; they do not diagnose undertraining, wasted sets, or overtraining. Offer “Review distribution” and “Edit target,” not automatic additions/removals. Keep source references, review date, and assumptions visible. No fake precision, automatic progression, fixed 10–20 prescription for everyone, or recommendation that all three delt heads each need the broad muscle-group reference.

Store broad evidence guidance separately from numeric target objects. The research reference does not establish that 10 direct sets and 10 Forge weighted contributions are interchangeable. Do not auto-apply its number to either basis. A later curated target preset would require a source, population, goal, counting definition, and explicit opt-in before release.

### 4. Planned versus completed

In Progress → Muscles, add “Plan / Completed” with the same definition and a visible date/period. Completed totals use saved session snapshots and valid completed working sets; warm-ups stay excluded. Log source program IDs and snapshots, not exercise-name matches. Use the selected program and clearly show whether sessions from other programs are included (default excluded).

In the first slice, compare the current plan with an actual completed calendar range; label that it is a current-plan reference rather than historical adherence. Do not claim “missed” sessions or completion percentage until anchored scheduling and historical plan versions exist. Never multiply actual logged sets by 7/cycleDays. For a past session without direct/indirect metadata, show those figures as unknown; its existing weighted summary remains available.

## Counting and schedule contract

- Planned counts include prescribed working sets. They do not claim sets were completed with a particular effort or sufficient stimulus; effort logging remains deferred.
- Completed counts use `countedSet(set)` and snapshot mappings. Zero added load is valid; warm-ups, incomplete or invalid sets are excluded.
- Direct and indirect classification must be explicit, audited metadata, not inferred from coefficient `1`, `0.5`, muscle names, or the fact an exercise is compound. A muscle cannot be both direct and indirect for the same exercise. Several muscles can be direct targets of one exercise.
- Existing editable coefficients remain unchanged. Do not retrofit all secondary contributions to 0.5. A fractional calculation is a bookkeeping model, not a physiological measurement.
- Sum performed working sets once per exercise. Never sum the muscle rows to report total performed sets; one set can involve multiple muscles.
- Unilateral 2 sets per leg count as 2 sets for the muscle on each side, not 4 bilateral-equivalent sets. Show the per-side convention. Do not infer asymmetric left/right work from today's data.
- Planned timed holds can count their prescribed sets if explicitly mapped, but remain labeled timed work. Do not convert side-plank seconds or its legacy “1 rep” placeholder into a rep record, training volume in kg, or a recommendation. General duration logging is outside this slice.
- Rest days are explicit `null` entries in the cycle; repeated workout IDs are allowed. The PPL template is Push/Pull/Legs/Push/Pull/Legs/rest, not one occurrence each.
- Unknown schedule: show “Per pass through listed workouts.” No weekly number, frequency per week, or weekly target comparison until a schedule is selected. Never parse free-text notes to infer the cycle.
- Rotation average = cycle total × 7 / cycle length in days. Label “Average per 7 days if repeated as written.” It is not this calendar week's scheduled workload. Round only for display to one decimal, retaining raw precision for comparisons.
- Direct frequency = number of cycle slots with at least one direct set × 7 / cycleDays. Multiple exercises for a muscle in one workout count as one exposure. Display fractions as averages, not fractional sessions to perform.
- A cycle records one workout or rest per day in this slice. Two-a-day scheduling, anchor dates, skipped-day rescheduling and reminders are excluded.
- Support cycle length 1–28 days; at least one training day; all referenced workout IDs must belong to the program. Removing a referenced workout requires an explicit replacement or rest choice before Save. Reordering editor sections does not reorder calendar slots.

## Worked example: user's rotating program

Source: `imports/upper-a-lower-upper-b.forge.json`, inspected 27 September 2026. Rotation supplied by the user: Upper A / Lower / Upper B / rest. There are 18 + 15 + 19 = **52 prescribed working sets per four-day cycle**, equivalent to 91 performed sets per seven days averaged across repeated cycles. That total is not a per-muscle target.

These example direct counts are based on named exercises, pending explicit role review: chest press 3 + pec deck 3 = 6 chest sets/cycle (10.5 per seven-day average); squat 2 + split squat/step-up 2 + leg extension 2 = 6 quad sets (10.5 average); RDL 2 + leg curl 2 = 4 hamstring sets (7 average); calf raise 3 = 3 calf sets (5.25 average, displayed 5.3). These are descriptive counts, not advice to add sets. The split-squat/step-up alternative needs an explicit exercise choice before assigning variant-specific indirect mappings.

For reproducible existing-app bookkeeping, the imported coefficients give:

| Muscle | Upper A | Lower | Upper B | Four-day weighted total | Seven-day average (unrounded) |
|---|---:|---:|---:|---:|---:|
| Chest | 3.5 | 0 | 3.5 | 7 | 12.25 |
| Lats | 4 | 0 | 3.5 | 7.5 | 13.125 |
| Upper back | 2.75 | 0 | 3.5 | 6.25 | 10.9375 |
| Front delts | 3.5 | 0 | 3 | 6.5 | 11.375 |
| Side delts | 3 | 0 | 3.5 | 6.5 | 11.375 |
| Rear delts | 0 | 0 | 0 | 0 | 0 |
| Biceps | 4.5 | 0 | 4.5 | 9 | 15.75 |
| Triceps | 4.5 | 0 | 3.5 | 8 | 14 |
| Quads | 0 | 6 | 0 | 6 | 10.5 |
| Hamstrings | 0 | 4 | 0 | 4 | 7 |
| Glutes | 0 | 4 | 0 | 4 | 7 |
| Calves | 0 | 3 | 0 | 3 | 5.25 |
| Abs | 2 | 2 | 2 | 6 | 10.5 |

Rear delts at zero means this imported mapping assigns no rear-delt coefficient. It is not evidence that rows provide no rear-delt stimulus. Abs includes prescribed timed side-plank sets. Weighted chest differs from the six direct chest sets because the import assigns a secondary chest contribution to JM presses. This is precisely why “sets” must disclose its counting method.

Upper sessions repeat on average 3.5 times per seven days, Lower 1.75; this is not a 3-days-per-week plan. Missing workouts or extra rest will change actual completed totals.

## Added scope: upper chest, mid chest and exercise expansion

User follow-up, 27 September: add upper chest and mid chest under Chest, and more exercises. This extends the planned feature; it does not change the delivered app or the user's imported routine.

### Chest hierarchy and counting

Keep **Chest** as the existing parent muscle and total. Expand it into **Upper chest emphasis** and **Mid chest emphasis**, with **Mixed/unspecified emphasis** visible so old records are not silently assigned to a region. User-facing short labels can be Upper chest and Mid chest; the adjacent subtitle must say “Exercise emphasis, not isolated muscles.”

“Upper” refers to clavicular emphasis; “mid” is a practical label for sternal/sternocostal emphasis, not a newly invented independent muscle. Flat and incline movements can involve both regions. [A primary EMG study](https://pubmed.ncbi.nlm.nih.gov/34644424/) found regional differences between flat and inclined pressing. Activation differences do not establish exact hypertrophy percentages, set-equivalence coefficients or a universal optimum bench angle. Do not turn EMG amplitudes into numeric set weights.

Use a separate optional classification `chestEmphasis: 'upper' | 'mid' | 'mixed'` on exercise definitions and new session snapshots. Absence means unspecified. Do not add these values to the existing MuscleGroup union or replace legacy `chest` coefficients. One exercise has one emphasis classification for this first version; its actual regional involvement is not claimed to be exclusive.

Regional rows display **direct chest sets with that emphasis**. The parent retains its existing direct, indirect and weighted figures. Count each set once in the parent; do not add the parent to its children or show their sum as additional training. With complete direct-role metadata, upper + mid + mixed + unspecified direct-emphasis counts equal parent direct chest sets. Unknown direct roles make this partition incomplete and must be labeled. Secondary chest work remains in the parent's indirect/weighted details and is not silently counted as direct upper or mid work.

Example: 3 direct chest sets of an explicitly upper-emphasis incline press plus 3 mid-emphasis pec-deck sets produces 6 direct Chest sets, partitioned 3 upper and 3 mid. If the incline variant has not been reviewed, show its 3 sets as unspecified until the user or catalog review assigns emphasis. Existing JM-press secondary coefficients stay separate. The user's 15-degree dumbbell press must remain its named variant; do not replace it with a generic 30- or 45-degree exercise.

Use one overall chest target in the first release, with descriptive regional distribution. Do not apply the broad weekly chest guideline separately to upper and mid rows. A later opt-in regional target must be labeled an emphasis preference, not a validated requirement. Other muscle rows are unchanged.

### Exercise library additions

Existing flat dumbbell/barbell presses, generic incline dumbbell press, machine chest press, cable fly, pec deck and push-ups remain. Add these distinct variants after role/emphasis review:

| Proposed new exercise | Metadata and distinction |
|---|---|
| 15-degree dumbbell chest press | Preserve the user's low-incline setup; separate from generic incline |
| 30-degree dumbbell incline press | Explicit angle, separate exercise ID |
| Incline barbell bench press | Incline angle noted in setup; reviewed emphasis |
| Smith machine incline press | Smith equipment and setup notes |
| Incline converging machine press | Machine-specific incline pattern |
| Low-to-high cable fly | Cable path and setup explicit; emphasis reviewed rather than inferred from its name |
| Flat Smith machine chest press | Distinct from free-weight bench |
| Flat dumbbell fly | Distinct from cable fly/pec deck |
| Standing cable chest press | Distinct from fly and seated machine press |
| Single-arm cable chest press | Per-side reps and sets; no doubling of set totals |
| Chest-focused dip | Added-load convention explicit; mixed/unspecified if upper/mid classification is inappropriate |
| Feet-elevated push-up | Added external load only; exact setup retained |

Also add five missing movements used in the user's program: neutral-grip lat pulldown, machine shoulder press, machine row, Smith JM press, and lying leg curl. Keep generic existing movements and customized imported definitions; do not merge by similar names. Dead bug and timed side plank remain separate follow-on candidates because their reps-per-side/duration semantics need a dedicated logging decision.

Each new exercise needs stable ID, equipment, audited direct/indirect roles, existing-style muscle coefficients, optional chest emphasis, setup note, unilateral convention where needed, and searchable aliases. Equipment should use the current enum (Smith = machine) until a broader equipment taxonomy is explicitly designed. More exercises must be discoverable using chest-region and equipment filters rather than making a longer undifferentiated list.

No automatic substitutions or changes to existing template set counts. The new exercises become selectable library entries; changing a user's program remains an explicit edit. Verify selection, snapshot creation, historical preservation, selective import/copy and local/cloud persistence.

## Evidence and recommendation policy

Sources reviewed 27 September 2026:

- [ACSM 2026 resistance training guidance](https://acsm.org/resistance-training-guidelines-update-2026/) gives roughly 10 weekly sets per muscle group as a broad hypertrophy reference and emphasizes adaptable programs. It does not prescribe a unique target for each of Forge's 13 muscle labels.
- [Pelland et al., Sports Medicine 2026; online December 2025](https://pubmed.ncbi.nlm.nih.gov/41343037/) compares direct, total and fractional counting. Fractional treatment of indirect work had the strongest relative support in its models, with diminishing returns as volume rose. This supports showing indirect work explicitly; it does not validate each Forge exercise coefficient or establish a personal optimum.

Product inference: put evidence in a short optional explanation, use transparent descriptive counts first, and let people choose targets that reflect experience, recent workload, goal and recovery. Do not produce precise personalized recommendations from split choice alone.

## Release order and acceptance

1. Pure accounting and explicit schedules, then library/editor summaries; no targets required to use them.
2. Audited direct/indirect roles with snapshot preservation and clear legacy unknowns; range comparisons only where their basis is available.
3. User targets, two-split comparison and current-plan/completed view.

Done means PPL repetition and four-day rotation arithmetic are correct; all rows trace to exercises; unknowns stay visible; goal/basis labels remain visible; edits/cancel behave predictably; old sessions never change; import/export and cloud round trips preserve metadata; and light/dark/mobile/keyboard table interactions pass. No deployment is part of this planning task.

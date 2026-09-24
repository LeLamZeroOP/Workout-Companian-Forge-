# Body and Nutrition Product Specification

## Product outcome

Extend Forge from a workout logger into a private, local-first training and nutrition companion. A user can record body weight and measurements, see trends, receive a clearly labelled calorie estimate, set macro targets, and log common foods without losing the app's fast gym-focused workflow.

## Product principles

- Keep workout logging as the primary experience. Nutrition must not slow down the active workout flow.
- Treat calorie and macro outputs as estimates, not prescriptions or medical advice.
- Support manual targets. Users must always be able to override or disable calculated targets.
- Keep sensitive body and nutrition data on-device in the first release and include export/import.
- Snapshot food nutrition inside diary entries so old logs do not change when the catalog changes.
- Distinguish raw, cooked, drained, skin-on, and skinless foods when the source distinguishes them.
- Show grams and kilograms internally. Unit conversion is presentation only.
- Do not use color or moral labels such as “good,” “bad,” or “cheat” for foods or body-weight changes.

## Health boundaries

The automatic estimator is available only to adults aged 18 or older who are not pregnant or breastfeeding. The onboarding flow asks users to confirm those conditions without storing pregnancy status after the eligibility check. For minors, pregnancy, breastfeeding, eating-disorder concerns, or clinician-directed diets, Forge offers manual targets only and recommends qualified professional guidance.

The initial estimate uses the published Mifflin-St Jeor resting-energy equation and an explicitly selected activity multiplier. It is displayed as a range and explains that individual error is expected. The original equation was derived in adults aged 19–78, and validation literature notes meaningful individual error ([PubMed: original equation](https://pubmed.ncbi.nlm.nih.gov/2305711/), [PubMed: systematic review](https://pubmed.ncbi.nlm.nih.gov/15883556/)). For a future higher-fidelity planner, use the dynamic approach described by the [NIDDK Body Weight Planner](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner).

Default adult macro percentages are 25% protein, 45% carbohydrate, and 30% fat. The guided editor constrains presets to the adult Acceptable Macronutrient Distribution Ranges: protein 10–35%, carbohydrate 45–65%, and fat 20–35% ([Dietary Guidelines scientific report](https://www.dietaryguidelines.gov/sites/default/files/2020-07/PartD_Ch8_DietaryPatterns_first-print.pdf)). Manual gram targets remain possible and are clearly marked as manual. Energy conversion uses 4 kcal/g for protein, 4 kcal/g for carbohydrate, and 9 kcal/g for fat, consistent with the [USDA Food and Nutrition Information Center](https://www.nal.usda.gov/programs/fnic).

## Information architecture

Desktop navigation:

1. Today
2. Programs
3. Workout
4. History
5. Progress
6. Body
7. Nutrition
8. Settings

Muscle analytics moves inside Progress as a “Muscles” subview. On mobile, use five primary tabs: Today, Workout, Programs, Progress, and More. More contains History, Body, Nutrition, and Settings. This prevents a nine-item bottom bar.

## Body profile and measurements

The body profile stores height, date of birth, equation sex, activity level, goal, and whether targets are calculated or manual. “Equation sex” is explained as an input required by the selected energy equation, not an identity field.

Users can log:

- body weight;
- body-fat percentage;
- waist, chest, hips, upper arm, and thigh circumference;
- a private note.

Only weight is required. A body entry may be added, edited, or deleted. The body dashboard shows the latest value, change from the previous entry, a raw trend, and a seven-entry moving average. Same-day entries remain separate, while the chart uses the last entry of each local calendar day.

## Calorie and macro targets

Calculated mode requires a valid body profile and latest weight. It returns:

- estimated resting energy expenditure;
- estimated maintenance calories;
- a suggested goal range, never a single “correct” number;
- protein, carbohydrate, and fat grams based on the selected percentage split;
- formula name, formula version, input date, and a plain-language limitation message.

Goal adjustments are conservative product defaults, not medical claims: maintain 0%, gradual loss -10%, gradual gain +10%. Users can select manual calories instead. The UI never extrapolates a promised date or amount of weight change from the calorie estimate.

## Food catalog

The first release ships a curated catalog of common foods and meats sourced from USDA FoodData Central. The catalog contains 100–200 normalized items across poultry, red meat, fish, eggs, dairy, grains, legumes, fruit, vegetables, fats, and common snacks. Each entry includes source, FDC identifier, data type, description, preparation state, data version, nutrients per 100 g, and common serving presets.

USDA FoodData Central offers food search and food-detail endpoints and requires an API key ([official API guide](https://fdc.nal.usda.gov/api-guide/)). The browser application must never contain that key. A development-only ingestion script reads `USDA_FDC_API_KEY`, normalizes approved records, and commits a static catalog. Broader live search is a later server-backed feature.

Users can also create custom foods. Required fields are name, serving weight, calories, protein, carbohydrate, and fat. Fiber and sodium are optional. Validation warns when macro-derived calories differ from entered calories by more than 15%, but users may save because labels use rounding and may include alcohol or organic acids.

## Food diary

A diary entry stores local date, meal, food name, grams consumed, serving description, source metadata, and a full nutrient snapshot. Meals are Breakfast, Lunch, Dinner, and Snack. Users can search, choose a food, enter grams or a serving multiplier, duplicate an entry, edit quantity, and delete it.

The daily screen shows consumed versus target calories and macros. Over-target values are neutral facts, not errors. It also shows fiber when available. Quick-add calories is allowed but marked as incomplete because it cannot contribute to macro totals.

## Today integration

Today gains two compact cards:

- Body: latest weight and seven-entry trend direction, with a “Log weight” action.
- Nutrition: calories and macros consumed versus target, with an “Add food” action.

Both cards have useful empty states and can be hidden from Settings.

## Privacy and portability

- Body profile, measurements, food diary, and custom foods remain in localStorage for the current architecture.
- Export includes the entire versioned app data document.
- Import validates before replacing data and shows a summary of affected record counts.
- Reset supports separate deletion of workout data, body data, nutrition data, or all data.
- No analytics, advertising identifiers, or remote food queries ship in this milestone.

## Deferred features

- barcode scanning;
- live USDA search;
- wearable or health-platform sync;
- recipes and meal plans;
- micronutrient targets;
- automatic calorie adaptation from observed weight change;
- clinician or coach sharing;
- photo-based food recognition.

These require additional privacy, accuracy, backend, or platform work and are not part of the first body/nutrition release.

## Acceptance criteria

- Existing version-1 workout data migrates without loss.
- A user can log and chart body weight on phone and desktop.
- An eligible adult can receive an explained calorie range and macro targets, or set manual targets.
- Ineligible or incomplete profiles never receive an automatic estimate.
- A user can log common USDA-backed foods and custom foods by weight or serving.
- Daily calorie and macro totals are computed from immutable diary snapshots.
- The app works offline after initial load with the bundled food catalog.
- Export/import round-trips all new data.
- No API key appears in the client bundle or repository.
- All calculations have unit tests, and body/nutrition screens pass mobile accessibility and overflow checks.

# Body and Nutrition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private body tracking, transparent calorie and macro estimates, a curated common-food catalog, and a daily food diary to Forge.

**Architecture:** Upgrade the persisted document from version 1 to version 2 and keep calculations in pure domain modules. Bundle a normalized USDA-derived food catalog for offline use, snapshot nutrients into diary entries, and expose Body and Nutrition as independent feature areas that integrate into Today and Progress.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, Recharts, localStorage repository, Node ingestion script

**Spec:** `docs/superpowers/specs/2026-09-24-body-nutrition.md`

## Global Constraints

- Preserve all existing workout, program, history, progress, and muscle-set behavior.
- Store weights in kilograms, measurements in centimeters, food quantities in grams, energy in kilocalories, and macros in grams.
- Automatic calorie estimates are adult-only, opt-in, and labelled estimates.
- Do not ship a USDA API key in browser code or any `VITE_` environment variable.
- Diary entries snapshot nutrients and never depend on a mutable food record.
- Use local calendar dates for measurements and diary grouping.
- Follow test-driven development for every domain calculation and persistence migration.

---

### Task 1: Version 2 persistence model and migration

**Files:**
- Modify: `src/domain/models.ts`
- Modify: `src/data/migrations.ts`
- Modify: `src/data/defaults.ts`
- Test: `tests/data/migrations-v2.test.ts`

**Interfaces:**
- Produces: `AppDataV2`, `BodyProfile`, `BodyMeasurement`, `NutritionTarget`, `FoodDefinition`, `FoodLogEntry`
- Produces: `parseAppData(value: unknown): AppDataV2`

- [ ] **Step 1: Write the failing version-1 migration test**

```ts
it('migrates version 1 without changing workout records', () => {
  const old = createDefaultDataV1();
  const migrated = parseAppData(old);
  expect(migrated.version).toBe(2);
  expect(migrated.programs).toEqual(old.programs);
  expect(migrated.sessions).toEqual(old.sessions);
  expect(migrated.body).toEqual({ profile: null, measurements: [] });
  expect(migrated.nutrition).toEqual({ targets: [], customFoods: [], diary: [] });
});
```

- [ ] **Step 2: Run `pnpm test:run -- tests/data/migrations-v2.test.ts` and confirm the version assertion fails**

- [ ] **Step 3: Add the version-2 types**

```ts
export interface BodyProfile {
  birthDate: string;
  heightCm: number;
  equationSex: 'female' | 'male';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'veryActive';
  goal: 'lose' | 'maintain' | 'gain';
  targetMode: 'calculated' | 'manual';
}
export interface BodyMeasurement {
  id: Id; recordedAt: string; weightKg: number;
  bodyFatPercent: number | null; waistCm: number | null; chestCm: number | null;
  hipsCm: number | null; upperArmCm: number | null; thighCm: number | null; notes: string;
}
export interface NutritionTarget {
  id: Id; effectiveFrom: string; mode: 'calculated' | 'manual'; caloriesKcal: number;
  proteinG: number; carbsG: number; fatG: number; formulaVersion: string | null;
}
export interface Nutrients { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number; fiberG: number | null; sodiumMg: number | null }
export interface FoodDefinition {
  id: Id; name: string; brand: string | null; category: string; preparation: string;
  source: 'usda' | 'custom'; sourceId: string | null; dataVersion: string;
  nutrientsPer100g: Nutrients; servings: Array<{ name: string; grams: number }>;
}
export interface FoodLogEntry {
  id: Id; localDate: string; meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodId: Id | null; foodName: string; grams: number; servingDescription: string;
  nutrients: Nutrients; source: FoodDefinition['source']; sourceId: string | null;
}
export interface AppDataV2 extends Omit<AppDataV1, 'version'> {
  version: 2;
  body: { profile: BodyProfile | null; measurements: BodyMeasurement[] };
  nutrition: { targets: NutritionTarget[]; customFoods: FoodDefinition[]; diary: FoodLogEntry[] };
}
```

- [ ] **Step 4: Implement strict parsing and a lossless v1-to-v2 migration**
- [ ] **Step 5: Run the migration test and the existing repository tests**
- [ ] **Step 6: Commit with `git commit -m "feat: add body and nutrition data model"`**

### Task 2: Body measurement domain

**Files:**
- Create: `src/domain/bodyMeasurements.ts`
- Test: `tests/domain/body-measurements.test.ts`

**Interfaces:**
- Consumes: `BodyMeasurement`
- Produces: `validateBodyMeasurement`, `getLatestMeasurement`, `getWeightTrend`, `getWeightChange`

- [ ] **Step 1: Write failing tests for validation, local-day grouping, ordering, and moving average**

```ts
expect(validateBodyMeasurement({ ...entry, weightKg: 0 })).toHaveProperty('weightKg');
expect(getWeightTrend(entries)).toEqual([
  { date: '2026-09-20', weightKg: 80, movingAverageKg: 80 },
  { date: '2026-09-21', weightKg: 79.8, movingAverageKg: 79.9 },
]);
expect(getWeightChange(entries)).toBeCloseTo(-0.2);
```

- [ ] **Step 2: Run `pnpm test:run -- tests/domain/body-measurements.test.ts` and confirm the missing module failure**
- [ ] **Step 3: Implement range checks: weight 20–500 kg, body fat 1–75%, and optional circumferences 20–300 cm**
- [ ] **Step 4: Implement chart grouping using the final entry on each local date and a trailing seven-entry average**
- [ ] **Step 5: Run the domain tests and commit with `git commit -m "feat: add body measurement calculations"`**

### Task 3: Body profile and calorie estimator

**Files:**
- Create: `src/domain/energyEstimate.ts`
- Test: `tests/domain/energy-estimate.test.ts`

**Interfaces:**
- Produces: `estimateNutritionTarget(input): EnergyEstimateResult`
- Produces: `calculateMacroGrams(caloriesKcal, percentages)`

```ts
export interface EnergyEstimateInput {
  age: number; weightKg: number; heightCm: number;
  equationSex: 'female' | 'male';
  activityLevel: keyof typeof activityFactors;
  goal: 'lose' | 'maintain' | 'gain';
  eligibleAdult: boolean;
}
export type EnergyEstimateResult =
  | { status: 'manual-only'; reason: 'adult-only' | 'ineligible' | 'invalid-input' }
  | { status: 'estimated'; reeKcal: number; maintenanceKcal: number; targetLowKcal: number; targetHighKcal: number; midpointKcal: number; formulaVersion: 'mifflin-st-jeor-1990-v1' };
export const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, veryActive: 1.725 } as const;
```

- [ ] **Step 1: Write failing tests for adult eligibility, Mifflin-St Jeor output, range rounding, macro conversion, and manual mode**

```ts
expect(estimateNutritionTarget({ age: 17, ...valid })).toEqual({ status: 'manual-only', reason: 'adult-only' });
expect(calculateMacroGrams(2400, { protein: 25, carbs: 45, fat: 30 })).toEqual({ proteinG: 150, carbsG: 270, fatG: 80 });
```

- [ ] **Step 2: Run the targeted test and confirm it fails**
- [ ] **Step 3: Implement REE as `10 * kg + 6.25 * cm - 5 * age + adjustment`, with `+5` for male and `-161` for female equation input**
- [ ] **Step 4: Apply named activity factors in one exported constant and goal factors of `0.9`, `1`, and `1.1`; return a visible ±10% estimate range rounded to 50 kcal**
- [ ] **Step 5: Reject incomplete, under-18, pregnant, or breastfeeding calculation requests with `manual-only`; never invent fallback values**
- [ ] **Step 6: Run tests and commit with `git commit -m "feat: add transparent calorie and macro estimates"`**

### Task 4: Body tracking screens

**Files:**
- Create: `src/features/body/BodyPage.tsx`
- Create: `src/features/body/BodyProfileForm.tsx`
- Create: `src/features/body/MeasurementForm.tsx`
- Create: `src/features/body/WeightTrendChart.tsx`
- Modify: `src/hooks/useAppData.ts`
- Test: `tests/features/body-page.test.tsx`

**Interfaces:**
- Consumes: Task 1 body state and Task 2 trend functions
- Produces: `saveBodyProfile`, `saveBodyMeasurement`, `deleteBodyMeasurement` application actions

- [ ] **Step 1: Write failing component tests for the empty state, quick weight entry, profile validation, editing, deletion confirmation, and accessible chart table**
- [ ] **Step 2: Run the test and confirm missing components/actions**
- [ ] **Step 3: Build the profile form with explicit estimator eligibility copy and a manual-target path**
- [ ] **Step 4: Build the measurement form with weight required and advanced fields collapsed by default**
- [ ] **Step 5: Build the responsive chart plus a visible history table and edit/delete controls**
- [ ] **Step 6: Add immutable repository actions in `useAppData` and run tests**
- [ ] **Step 7: Commit with `git commit -m "feat: add body tracking experience"`**

### Task 5: USDA catalog ingestion and normalized seed data

**Files:**
- Create: `scripts/import-usda-foods.mjs`
- Create: `scripts/usda-food-manifest.json`
- Create: `src/data/foods/commonFoods.json`
- Create: `src/data/foods/catalog.ts`
- Test: `tests/data/food-catalog.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `commonFoods: FoodDefinition[]`
- Produces script: `pnpm foods:import`

- [ ] **Step 1: Write a failing catalog test requiring unique IDs, source IDs, preparation labels, positive serving weights, and finite nonnegative nutrients**
- [ ] **Step 2: Create a reviewed manifest of FDC IDs covering the categories in the spec; list raw and cooked records separately**

The initial manifest must resolve at least these descriptions as distinct records where preparation is stated: chicken breast raw; chicken breast roasted; chicken thigh raw; chicken thigh roasted; whole egg raw; whole egg cooked; 90% lean ground beef raw; 90% lean ground beef cooked; beef sirloin raw; beef sirloin grilled; pork loin raw; pork loin roasted; Atlantic salmon raw; Atlantic salmon cooked; canned tuna in water drained; shrimp raw; shrimp cooked; whole milk; nonfat Greek yogurt; cheddar cheese; white rice dry; white rice cooked; brown rice cooked; rolled oats dry; white bread; potato raw; potato baked; sweet potato cooked; black beans cooked; chickpeas cooked; firm tofu; banana; apple with skin; orange; broccoli raw; broccoli cooked; spinach raw; carrot raw; avocado; olive oil; peanut butter; almonds; and whey protein powder. Each manifest row uses:

```json
{ "query": "chicken breast roasted", "expectedDescriptionIncludes": ["chicken", "breast", "roasted"], "category": "poultry", "preparation": "roasted", "servings": [{ "name": "100 g", "grams": 100 }] }
```
- [ ] **Step 3: Implement the Node script to read `USDA_FDC_API_KEY`, fetch `/food/{fdcId}`, map only energy, protein, carbohydrate, fat, fiber, and sodium, then write deterministic sorted JSON**
- [ ] **Step 4: Ensure the script exits with a clear error when the key is missing and never prints the key**
- [ ] **Step 5: Generate and manually inspect the initial catalog, then run the catalog test**
- [ ] **Step 6: Commit the script, manifest, and normalized public data with `git commit -m "feat: add offline common food catalog"`**

### Task 6: Food calculations and custom foods

**Files:**
- Create: `src/domain/nutrition.ts`
- Create: `src/features/nutrition/FoodSearch.tsx`
- Create: `src/features/nutrition/CustomFoodForm.tsx`
- Test: `tests/domain/nutrition.test.ts`
- Test: `tests/features/custom-food-form.test.tsx`

**Interfaces:**
- Produces: `scaleNutrients`, `sumNutrients`, `validateFood`, `searchFoods`, `createFoodLogEntry`

- [ ] **Step 1: Write failing tests proving that 150 g scales per-100-g nutrients by 1.5 and totals preserve nullable fiber/sodium semantics**
- [ ] **Step 2: Write failing search tests for case-insensitive names, categories, and preparation terms**
- [ ] **Step 3: Implement pure nutrition arithmetic rounded only at display time**
- [ ] **Step 4: Implement custom-food validation and a non-blocking 15% calorie/macro discrepancy warning**
- [ ] **Step 5: Build search with category chips and preparation shown in every result**
- [ ] **Step 6: Run tests and commit with `git commit -m "feat: add food search and custom foods"`**

### Task 7: Daily food diary

**Files:**
- Create: `src/features/nutrition/NutritionPage.tsx`
- Create: `src/features/nutrition/FoodEntryDialog.tsx`
- Create: `src/features/nutrition/MacroSummary.tsx`
- Create: `src/domain/foodDiary.ts`
- Modify: `src/hooks/useAppData.ts`
- Test: `tests/domain/food-diary.test.ts`
- Test: `tests/features/nutrition-page.test.tsx`

**Interfaces:**
- Produces: `getDailyNutrition`, `getTargetForDate`
- Produces actions: `saveFoodLogEntry`, `deleteFoodLogEntry`, `saveCustomFood`, `saveNutritionTarget`

- [ ] **Step 1: Write failing tests for date grouping, meal grouping, snapshot immutability, target selection by effective date, and quick-add calories**
- [ ] **Step 2: Run tests and confirm failures**
- [ ] **Step 3: Implement diary calculations without reading current catalog values after entry creation**
- [ ] **Step 4: Build date navigation, four meal sections, consumed-versus-target summary, and neutral over-target presentation**
- [ ] **Step 5: Build add, edit quantity, duplicate, and delete interactions with mobile-sized controls**
- [ ] **Step 6: Run tests and commit with `git commit -m "feat: add daily nutrition diary"`**

### Task 8: Navigation and dashboard integration

**Files:**
- Modify: `src/app/navigation.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/features/today/TodayPage.tsx`
- Modify: `src/features/progress/ProgressPage.tsx`
- Modify: `src/styles/global.css`
- Test: `tests/app-shell.test.tsx`
- Test: `tests/features/today-page.test.tsx`

**Interfaces:**
- Consumes: Body and Nutrition pages and summaries
- Produces: desktop navigation and five-tab mobile navigation described in the spec

- [ ] **Step 1: Write failing navigation tests for Body, Nutrition, More, and Muscles inside Progress**
- [ ] **Step 2: Write failing Today tests for body/nutrition empty and populated states**
- [ ] **Step 3: Replace the seven-item mobile bar with Today, Workout, Programs, Progress, and More; implement More as an accessible page, not a hover menu**
- [ ] **Step 4: Add Body and Nutrition routes on desktop and move muscle analytics into Progress without deleting its tests**
- [ ] **Step 5: Add compact Today cards with Log weight and Add food actions**
- [ ] **Step 6: Verify 320, 390, 768, and 1280 px widths, then commit with `git commit -m "feat: integrate body and nutrition navigation"`**

### Task 9: Export, import, and scoped reset

**Files:**
- Create: `src/features/settings/DataManagement.tsx`
- Modify: `src/data/localStorageRepository.ts`
- Modify: `src/hooks/useAppData.ts`
- Test: `tests/features/data-management.test.tsx`
- Test: `tests/data/repository.test.ts`

**Interfaces:**
- Produces: validated full export/import and reset scopes `workouts | body | nutrition | all`

- [ ] **Step 1: Write failing round-trip tests containing one workout, measurement, target, custom food, and diary entry**
- [ ] **Step 2: Write failing tests proving an invalid import does not overwrite current data**
- [ ] **Step 3: Implement import preview counts and require confirmation before replacement**
- [ ] **Step 4: Implement scoped reset using explicit reconstructed objects, never broad storage clearing**
- [ ] **Step 5: Run tests and commit with `git commit -m "feat: add body and nutrition data controls"`**

### Task 10: Offline readiness, accessibility, and release verification

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.webmanifest`
- Create: `public/icons/` assets
- Create: `tests/e2e/body-nutrition.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Verifies all prior tasks; introduces no new domain contracts

- [ ] **Step 1: Add a failing browser test for logging weight, creating a target, logging chicken by grams, reloading, and retaining all values**
- [ ] **Step 2: Add install metadata and offline caching for the application shell plus bundled common-food catalog**
- [ ] **Step 3: Test keyboard-only dialogs, form errors, chart tables, focus restoration, and reduced motion**
- [ ] **Step 4: Check no horizontal overflow at 320 and 390 px and ensure the active-workout experience remains one tap from the mobile bar**
- [ ] **Step 5: Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e`**
- [ ] **Step 6: Search the production bundle and repository for `USDA_FDC_API_KEY`; expected result is no matches outside documentation**
- [ ] **Step 7: Document privacy, formula limitations, data sources, export format, and recovery instructions**
- [ ] **Step 8: Commit with `git commit -m "feat: prepare body and nutrition release"`**

## Delivery sequence

Release 1 (Tasks 1–4): body profile, measurements, weight trends, and transparent calorie/macro targets.

Release 2 (Tasks 5–7): offline common-food catalog, custom foods, and daily diary.

Release 3 (Tasks 8–10): dashboard/navigation integration, data portability, PWA readiness, and full quality pass.

Do not begin live food search, barcodes, recipes, adaptive calories, or health-platform integrations until all acceptance criteria in the spec pass.

export const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, veryActive: 1.725 } as const;

export interface EnergyEstimateInput {
  age: number;
  weightKg: number;
  heightCm: number;
  equationSex: 'female' | 'male';
  activityLevel: keyof typeof activityFactors;
  goal: 'lose' | 'maintain' | 'gain';
  eligibleAdult: boolean;
}

export type EnergyEstimateResult =
  | { status: 'manual-only'; reason: 'adult-only' | 'ineligible' | 'invalid-input' }
  | { status: 'estimated'; reeKcal: number; maintenanceKcal: number; targetLowKcal: number; targetHighKcal: number; midpointKcal: number; formulaVersion: 'mifflin-st-jeor-1990-v1' };

function roundTo50(value: number): number { return Math.round(value / 50) * 50; }

export function estimateNutritionTarget(input: EnergyEstimateInput): EnergyEstimateResult {
  if (input.age < 18) return { status: 'manual-only', reason: 'adult-only' };
  if (!input.eligibleAdult) return { status: 'manual-only', reason: 'ineligible' };
  if (!Number.isFinite(input.age) || !Number.isFinite(input.weightKg) || !Number.isFinite(input.heightCm) || input.age > 120 || input.weightKg < 20 || input.weightKg > 500 || input.heightCm < 100 || input.heightCm > 250) return { status: 'manual-only', reason: 'invalid-input' };
  const adjustment = input.equationSex === 'male' ? 5 : -161;
  const reeKcal = Math.round(10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + adjustment);
  const maintenanceKcal = Math.round(reeKcal * activityFactors[input.activityLevel]);
  const goalFactor = { lose: 0.9, maintain: 1, gain: 1.1 }[input.goal];
  const goalCalories = maintenanceKcal * goalFactor;
  return {
    status: 'estimated', reeKcal, maintenanceKcal,
    targetLowKcal: roundTo50(goalCalories * 0.9), targetHighKcal: roundTo50(goalCalories * 1.1), midpointKcal: roundTo50(goalCalories),
    formulaVersion: 'mifflin-st-jeor-1990-v1',
  };
}

export function calculateMacroGrams(caloriesKcal: number, percentages: { protein: number; carbs: number; fat: number }): { proteinG: number; carbsG: number; fatG: number } {
  const valid = percentages.protein >= 10 && percentages.protein <= 35 && percentages.carbs >= 45 && percentages.carbs <= 65 && percentages.fat >= 20 && percentages.fat <= 35 && percentages.protein + percentages.carbs + percentages.fat === 100;
  if (!valid) throw new Error('Macro percentages must total 100 and stay within supported adult ranges.');
  if (!Number.isFinite(caloriesKcal) || caloriesKcal <= 0) throw new Error('Calories must be a positive number.');
  return { proteinG: Math.round(caloriesKcal * percentages.protein / 100 / 4), carbsG: Math.round(caloriesKcal * percentages.carbs / 100 / 4), fatG: Math.round(caloriesKcal * percentages.fat / 100 / 9) };
}

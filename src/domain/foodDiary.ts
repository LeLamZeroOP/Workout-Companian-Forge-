import type { FoodLogEntry, NutritionTarget, Nutrients } from './models';
import { sumNutrients } from './nutrition';

export const mealOrder: FoodLogEntry['meal'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function entriesForDate(entries: FoodLogEntry[], localDate: string): FoodLogEntry[] {
  return entries.filter((entry) => entry.localDate === localDate);
}

export function groupEntriesByMeal(entries: FoodLogEntry[]): Record<FoodLogEntry['meal'], FoodLogEntry[]> {
  return { breakfast: entries.filter((entry) => entry.meal === 'breakfast'), lunch: entries.filter((entry) => entry.meal === 'lunch'), dinner: entries.filter((entry) => entry.meal === 'dinner'), snack: entries.filter((entry) => entry.meal === 'snack') };
}

export function getEffectiveTarget(targets: NutritionTarget[], localDate: string): NutritionTarget | null {
  return [...targets].filter((target) => target.effectiveFrom <= localDate).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? null;
}

export function upsertNutritionTarget(targets: NutritionTarget[], target: NutritionTarget): NutritionTarget[] {
  return [...targets.filter((item) => item.id !== target.id && item.effectiveFrom !== target.effectiveFrom), target];
}

export function getDiaryTotal(entries: FoodLogEntry[]): Nutrients {
  return sumNutrients(entries.map((entry) => entry.nutrients));
}

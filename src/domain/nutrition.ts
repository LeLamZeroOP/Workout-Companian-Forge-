import type { FoodDefinition, FoodLogEntry, Nutrients } from './models';
import { isCalendarDate } from './calendar';

const round = (value: number) => Math.round(value * 10) / 10;

export function storableNutrients(values: Nutrients): boolean {
  return Object.values(values).every(value => value === null || (Number.isFinite(value) && value >= 0 && value <= 1_000_000));
}

function checkedNutrients(values: Nutrients): Nutrients {
  if (!storableNutrients(values)) throw new Error('This amount exceeds the supported nutrient range. Use a smaller amount.');
  return values;
}

export function scaleNutrients(nutrients: Nutrients, grams: number): Nutrients {
  const factor = grams / 100;
  return {
    caloriesKcal: round(nutrients.caloriesKcal * factor),
    proteinG: nutrients.proteinG === null ? null : round(nutrients.proteinG * factor),
    carbsG: nutrients.carbsG === null ? null : round(nutrients.carbsG * factor),
    fatG: nutrients.fatG === null ? null : round(nutrients.fatG * factor),
    fiberG: nutrients.fiberG === null ? null : round(nutrients.fiberG * factor),
    sodiumMg: nutrients.sodiumMg === null ? null : round(nutrients.sodiumMg * factor),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  const optionalTotal = (key: 'proteinG' | 'carbsG' | 'fatG' | 'fiberG' | 'sodiumMg') => {
    const known = items.map((item) => item[key]).filter((value): value is number => value !== null);
    return known.length ? round(known.reduce((total, value) => total + value, 0)) : null;
  };
  return {
    caloriesKcal: round(items.reduce((total, item) => total + item.caloriesKcal, 0)),
    proteinG: items.length ? optionalTotal('proteinG') : 0,
    carbsG: items.length ? optionalTotal('carbsG') : 0,
    fatG: items.length ? optionalTotal('fatG') : 0,
    fiberG: optionalTotal('fiberG'),
    sodiumMg: optionalTotal('sodiumMg'),
  };
}

export function searchFoods(foods: FoodDefinition[], query: string): FoodDefinition[] {
  foods = foods.filter((food) => !food.archived).sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || Number(b.source === 'custom') - Number(a.source === 'custom'));
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return foods;
  return foods.filter((food) => {
    const haystack = [food.name, food.brand, food.category, food.preparation].filter(Boolean).join(' ').toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function validateFood(food: FoodDefinition): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!food.name.trim()) errors.push('Enter a food name.');
  if (!food.category.trim()) errors.push('Enter a category.');
  if (!food.portion && (!food.servings.length || food.servings.some((serving) => !Number.isFinite(serving.grams) || serving.grams < 0.001 || serving.grams > 100000))) errors.push('Serving weight must be greater than zero (0.001–100,000 g).');
  if (food.portion && !food.portion.name.trim()) errors.push('Enter a portion name.');
  const values = food.nutrientsPer100g ?? food.portion?.nutrients;
  if (!values) errors.push('Choose a nutrient basis.');
  else {
    if (!Number.isFinite(values.caloriesKcal) || values.caloriesKcal < 0 || Object.values(values).some((value) => value !== null && (!Number.isFinite(value) || value < 0 || value > 1_000_000))) errors.push('Nutrients must be finite values from zero to 1,000,000.');
    if (values.proteinG !== null && values.carbsG !== null && values.fatG !== null) {
      const macroCalories = values.proteinG * 4 + values.carbsG * 4 + values.fatG * 9;
      if (values.caloriesKcal > 0 && Math.abs(macroCalories - values.caloriesKcal) / values.caloriesKcal > 0.2) warnings.push('Listed calories differ noticeably from the calories estimated from macros. Check the label values.');
    }
  }
  return { errors, warnings };
}

export function createFoodLogEntry(food: FoodDefinition, grams: number, meal: FoodLogEntry['meal'], localDate: string, id: string = crypto.randomUUID(), servingDescription = `${grams} g`): FoodLogEntry {
  if (!Number.isFinite(grams) || grams < 0.001 || grams > 100000) throw new Error('Enter a positive amount from 0.001 to 100,000.');
  if (!isCalendarDate(localDate)) throw new Error('Choose a valid calendar date.');
  if (!food.nutrientsPer100g) {
    if (!food.portion) throw new Error('Food has no nutrient basis.');
    return { id, localDate, meal, foodId: food.id, foodName: food.name, grams: null, portionQuantity: grams, preparation: food.preparation, servingDescription: `${grams} × ${food.portion.name}`, nutrients: checkedNutrients(scaleNutrients(food.portion.nutrients, grams * 100)), source: food.source, sourceId: food.sourceId };
  }
  return { id, localDate, meal, foodId: food.id, foodName: food.name, grams, preparation: food.preparation, servingDescription, nutrients: checkedNutrients(scaleNutrients(food.nutrientsPer100g, grams)), source: food.source, sourceId: food.sourceId };
}

export function formatMacro(value: number | null): string { return value === null ? 'Unknown' : `${Math.round(value)}g`; }

export function incompleteMacros(entries: FoodLogEntry[]): Array<'proteinG' | 'carbsG' | 'fatG'> {
  return (['proteinG', 'carbsG', 'fatG'] as const).filter((key) => entries.some((entry) => entry.nutrients[key] === null));
}

/** Rescale the immutable diary snapshot; never consult the current catalog. */
export function resizeFoodEntry(entry: FoodLogEntry, amount: number): FoodLogEntry {
  const original = entry.grams ?? entry.portionQuantity;
  if (!original || !Number.isFinite(amount) || amount < 0.001 || amount > 100000) throw new Error('Enter an amount from 0.001 to 100,000.');
  const portionName = entry.servingDescription.replace(/^[\d.]+\s*×\s*/, '');
  return { ...entry, ...(entry.grams !== null ? { grams: amount } : { portionQuantity: amount }), servingDescription: entry.grams !== null ? `${amount} g` : `${amount} × ${portionName}`, nutrients: checkedNutrients(scaleNutrients(entry.nutrients, amount / original * 100)) };
}

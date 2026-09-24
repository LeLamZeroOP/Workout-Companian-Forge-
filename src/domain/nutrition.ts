import type { FoodDefinition, FoodLogEntry, Nutrients } from './models';

const round = (value: number) => Math.round(value * 10) / 10;

export function scaleNutrients(nutrients: Nutrients, grams: number): Nutrients {
  const factor = grams / 100;
  return {
    caloriesKcal: round(nutrients.caloriesKcal * factor),
    proteinG: round(nutrients.proteinG * factor),
    carbsG: round(nutrients.carbsG * factor),
    fatG: round(nutrients.fatG * factor),
    fiberG: nutrients.fiberG === null ? null : round(nutrients.fiberG * factor),
    sodiumMg: nutrients.sodiumMg === null ? null : round(nutrients.sodiumMg * factor),
  };
}

export function sumNutrients(items: Nutrients[]): Nutrients {
  const optionalTotal = (key: 'fiberG' | 'sodiumMg') => {
    const known = items.map((item) => item[key]).filter((value): value is number => value !== null);
    return known.length ? round(known.reduce((total, value) => total + value, 0)) : null;
  };
  return {
    caloriesKcal: round(items.reduce((total, item) => total + item.caloriesKcal, 0)),
    proteinG: round(items.reduce((total, item) => total + item.proteinG, 0)),
    carbsG: round(items.reduce((total, item) => total + item.carbsG, 0)),
    fatG: round(items.reduce((total, item) => total + item.fatG, 0)),
    fiberG: optionalTotal('fiberG'),
    sodiumMg: optionalTotal('sodiumMg'),
  };
}

export function searchFoods(foods: FoodDefinition[], query: string): FoodDefinition[] {
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
  if (!food.servings.length || food.servings.some((serving) => !Number.isFinite(serving.grams) || serving.grams <= 0)) errors.push('Serving weight must be greater than zero.');
  const core = [food.nutrientsPer100g.caloriesKcal, food.nutrientsPer100g.proteinG, food.nutrientsPer100g.carbsG, food.nutrientsPer100g.fatG];
  if (core.some((value) => !Number.isFinite(value) || value < 0)) errors.push('Nutrients must be zero or greater.');
  const macroCalories = food.nutrientsPer100g.proteinG * 4 + food.nutrientsPer100g.carbsG * 4 + food.nutrientsPer100g.fatG * 9;
  if (food.nutrientsPer100g.caloriesKcal > 0 && Math.abs(macroCalories - food.nutrientsPer100g.caloriesKcal) / food.nutrientsPer100g.caloriesKcal > 0.2) warnings.push('Listed calories differ noticeably from the calories estimated from macros. Check the label values.');
  return { errors, warnings };
}

export function createFoodLogEntry(food: FoodDefinition, grams: number, meal: FoodLogEntry['meal'], localDate: string, id = crypto.randomUUID(), servingDescription = `${grams} g`): FoodLogEntry {
  return { id, localDate, meal, foodId: food.id, foodName: food.name, grams, servingDescription, nutrients: scaleNutrients(food.nutrientsPer100g, grams), source: food.source, sourceId: food.sourceId };
}

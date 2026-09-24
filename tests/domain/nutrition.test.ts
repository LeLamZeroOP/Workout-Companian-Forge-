import { describe, expect, it } from 'vitest';
import type { FoodDefinition, Nutrients } from '../../src/domain/models';
import { createFoodLogEntry, scaleNutrients, searchFoods, sumNutrients, validateFood } from '../../src/domain/nutrition';

const nutrients: Nutrients = { caloriesKcal: 200, proteinG: 20, carbsG: 10, fatG: 8, fiberG: null, sodiumMg: 120 };
const chicken: FoodDefinition = { id: 'chicken', name: 'Chicken breast', brand: null, category: 'Meat', preparation: 'Roasted skinless', source: 'usda', sourceId: '123', dataVersion: 'test', nutrientsPer100g: nutrients, servings: [{ name: '1 breast', grams: 174 }] };

describe('nutrition calculations', () => {
  it('scales per-100g nutrients and preserves unavailable values', () => {
    expect(scaleNutrients(nutrients, 150)).toEqual({ caloriesKcal: 300, proteinG: 30, carbsG: 15, fatG: 12, fiberG: null, sodiumMg: 180 });
  });

  it('sums known values without pretending missing optional nutrients are known', () => {
    expect(sumNutrients([nutrients, { ...nutrients, fiberG: 4, sodiumMg: null }])).toEqual({ caloriesKcal: 400, proteinG: 40, carbsG: 20, fatG: 16, fiberG: 4, sodiumMg: 120 });
    expect(sumNutrients([{ ...nutrients, sodiumMg: null }]).sodiumMg).toBeNull();
  });

  it('searches names, categories, brands, and preparation case-insensitively', () => {
    expect(searchFoods([chicken], 'ROASTED')).toEqual([chicken]);
    expect(searchFoods([chicken], 'meat')).toEqual([chicken]);
  });

  it('validates foods and warns when listed calories differ substantially from macros', () => {
    expect(validateFood({ ...chicken, nutrientsPer100g: { ...nutrients, caloriesKcal: 800 } })).toMatchObject({ errors: [], warnings: [expect.stringMatching(/calories/i)] });
    expect(validateFood({ ...chicken, name: '', servings: [] }).errors.length).toBeGreaterThan(0);
  });

  it('creates an immutable diary snapshot for the selected amount', () => {
    const entry = createFoodLogEntry(chicken, 150, 'lunch', '2026-09-24', 'entry-1', '150 g');
    expect(entry).toMatchObject({ id: 'entry-1', foodId: 'chicken', meal: 'lunch', grams: 150, nutrients: { proteinG: 30 }, sourceId: '123' });
  });
});

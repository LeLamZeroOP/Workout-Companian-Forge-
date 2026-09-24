import { describe, expect, it } from 'vitest';
import { commonFoods } from '../../src/data/foods/catalog';

describe('common food catalog', () => {
  it('contains a useful offline starter catalog with stable source data', () => {
    expect(commonFoods.length).toBeGreaterThanOrEqual(20);
    expect(new Set(commonFoods.map((food) => food.id)).size).toBe(commonFoods.length);

    for (const food of commonFoods) {
      expect(food.source).toBe('usda');
      expect(food.sourceId).toBeTruthy();
      expect(food.preparation.trim()).not.toBe('');
      expect(food.servings.length).toBeGreaterThan(0);
      expect(food.servings.every((serving) => serving.grams > 0)).toBe(true);
      expect(food.nutrientsPer100g.caloriesKcal).toBeGreaterThanOrEqual(0);
      expect(food.nutrientsPer100g.proteinG).toBeGreaterThanOrEqual(0);
      expect(food.nutrientsPer100g.carbsG).toBeGreaterThanOrEqual(0);
      expect(food.nutrientsPer100g.fatG).toBeGreaterThanOrEqual(0);
      expect(food.nutrientsPer100g.fiberG ?? 0).toBeGreaterThanOrEqual(0);
      expect(food.nutrientsPer100g.sodiumMg ?? 0).toBeGreaterThanOrEqual(0);
    }
  });
});

import { describe, expect, it } from 'vitest';
import type { FoodLogEntry, NutritionTarget } from '../../src/domain/models';
import { entriesForDate, getEffectiveTarget, groupEntriesByMeal, upsertNutritionTarget } from '../../src/domain/foodDiary';

const entry = (id: string, date: string, meal: FoodLogEntry['meal']): FoodLogEntry => ({ id, localDate: date, meal, foodId: null, foodName: id, grams: 100, servingDescription: '100 g', nutrients: { caloriesKcal: 100, proteinG: 10, carbsG: 10, fatG: 2, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null });
const target = (id: string, date: string): NutritionTarget => ({ id, effectiveFrom: date, mode: 'manual', caloriesKcal: 2000, proteinG: 140, carbsG: 220, fatG: 60, formulaVersion: null });

describe('food diary', () => {
  it('filters by local date and groups entries by meal', () => {
    const entries = [entry('eggs', '2026-09-24', 'breakfast'), entry('rice', '2026-09-24', 'dinner'), entry('old', '2026-09-23', 'lunch')];
    expect(entriesForDate(entries, '2026-09-24').map((item) => item.id)).toEqual(['eggs', 'rice']);
    expect(groupEntriesByMeal(entriesForDate(entries, '2026-09-24')).dinner[0]?.id).toBe('rice');
  });

  it('uses the latest target effective on or before the diary date', () => {
    expect(getEffectiveTarget([target('old', '2026-01-01'), target('new', '2026-09-01'), target('future', '2026-10-01')], '2026-09-24')?.id).toBe('new');
    expect(getEffectiveTarget([target('future', '2026-10-01')], '2026-09-24')).toBeNull();
  });

  it('replaces a target on the same effective date while preserving earlier history', () => {
    const old = target('old', '2026-09-01');
    const sameDay = target('calculated', '2026-09-24');
    const manual = { ...target('manual', '2026-09-24'), caloriesKcal: 2300 };

    const result = upsertNutritionTarget([old, sameDay], manual);

    expect(result).toHaveLength(2);
    expect(getEffectiveTarget(result, '2026-09-23')).toEqual(old);
    expect(getEffectiveTarget(result, '2026-09-24')).toEqual(manual);
  });
});

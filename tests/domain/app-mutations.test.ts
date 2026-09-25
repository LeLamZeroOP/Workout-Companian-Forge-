import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { applyMutation, getConflictScope, readConflictValue } from '../../src/domain/appMutations';

describe('app mutations', () => {
  it('replays a food entry idempotently', () => {
    const initial = createDefaultData();
    const entry = { id: 'entry-1', localDate: '2026-09-25', meal: 'lunch' as const, foodId: null, foodName: 'Rice', grams: 100, servingDescription: '100 g', nutrients: { caloriesKcal: 100, proteinG: 2, carbsG: 20, fatG: 1, fiberG: null, sodiumMg: null }, source: 'custom' as const, sourceId: null };
    const mutation = { kind: 'addFoodEntry' as const, entry };
    expect(applyMutation(applyMutation(initial, mutation), mutation).nutrition.diary).toHaveLength(1);
  });

  it('scopes a workout edit to its session for conflict checks', () => {
    const initial = createDefaultData();
    const session = { id: 'session-1' } as never;
    const mutation = { kind: 'updateSession' as const, session };
    expect(getConflictScope(mutation)).toBe('session:session-1');
    expect(readConflictValue(initial, getConflictScope(mutation))).toBeNull();
  });

  it('updates different records without replacing the whole document', () => {
    const initial = createDefaultData();
    const measurement = { id: 'm1', recordedAt: '2026-09-25T08:00:00.000Z', weightKg: 70, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
    const next = applyMutation(initial, { kind: 'saveBodyMeasurement', measurement });
    expect(next.body.measurements).toEqual([measurement]);
    expect(next.programs).toEqual(initial.programs);
  });
});

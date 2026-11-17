import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { applyMutation, getConflictScope, readConflictValue } from '../../src/domain/appMutations';
import { createSession } from '../../src/domain/workout';
import { addSessionExercise } from '../../src/domain/sessionEditing';

describe('app mutations', () => {
  it('saves a newly created exercise and its workout in one replayable mutation', () => {
    const data = createDefaultData();
    const original = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
    data.sessions = [original];
    const newExercise = { id: 'custom-workout', name: 'My cable row', equipment: 'cable' as const, muscleContribution: { upperBack: 1 }, isCustom: true };
    const session = addSessionExercise(original, newExercise);
    const mutation = { kind: 'updateSession' as const, session, newExercises: [newExercise] };
    const next = applyMutation(data, mutation);
    expect(next.exercises.find(item => item.id === newExercise.id)).toEqual(newExercise);
    expect(next.sessions).toEqual([session]);
    expect(next.programs).toEqual(data.programs);
    expect(applyMutation(next, mutation)).toEqual(next);
  });

  it('rejects custom exercise creation that would overwrite another library entry', () => {
    const data = createDefaultData();
    const original = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
    const newExercise = { ...data.exercises[0]!, name: 'Conflicting name', isCustom: true };
    const mutation = { kind: 'updateSession' as const, session: addSessionExercise(original, newExercise), newExercises: [newExercise] };
    expect(() => applyMutation(data, mutation)).toThrow(/already exists/i);
  });
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

import type { AppDataV1 } from '../domain/models';

const seed: AppDataV1 = {
  version: 1,
  exercises: [
    { id: 'db-chest-press', name: 'Dumbbell Chest Press', equipment: 'dumbbell', muscleContribution: { chest: 1, triceps: 0.5, frontDelts: 0.5 }, isCustom: false },
    { id: 'lat-pulldown', name: 'Lat Pulldown', equipment: 'cable', muscleContribution: { lats: 1, biceps: 0.5, upperBack: 0.25 }, isCustom: false },
    { id: 'leg-press', name: 'Leg Press', equipment: 'machine', muscleContribution: { quads: 1, glutes: 0.5, hamstrings: 0.25 }, isCustom: false },
  ],
  programs: [{
    id: 'starter-program', name: 'Starter Strength', notes: 'A simple three-day foundation.',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    workouts: [
      { id: 'starter-push', name: 'Push', notes: '', exercises: [{ id: 'starter-push-press', exerciseId: 'db-chest-press', targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' }] },
      { id: 'starter-pull', name: 'Pull', notes: '', exercises: [{ id: 'starter-pull-lat', exerciseId: 'lat-pulldown', targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' }] },
      { id: 'starter-legs', name: 'Legs', notes: '', exercises: [{ id: 'starter-legs-press', exerciseId: 'leg-press', targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 120, notes: '' }] },
    ],
  }],
  sessions: [],
  settings: { weightUnit: 'kg', lastSelectedProgramId: 'starter-program', restAlertSound: true, restAlertVibration: true, keepScreenAwake: true },
};

export function createDefaultData(): AppDataV1 {
  return structuredClone(seed);
}

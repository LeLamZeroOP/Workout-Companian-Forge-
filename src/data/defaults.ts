import { commonExercises } from '../domain/exerciseCatalog';
import type { AppDataV1, AppDataV2 } from '../domain/models';

const seed: AppDataV1 = {
  version: 1,
  exercises: commonExercises,
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

export function createDefaultDataV1(): AppDataV1 {
  return structuredClone(seed);
}

export function createDefaultData(): AppDataV2 {
  return { ...createDefaultDataV1(), version: 4, body: { profile: null, measurements: [] }, nutrition: { targets: [], customFoods: [], diary: [] } };
}

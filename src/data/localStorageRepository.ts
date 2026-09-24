import type { AppDataV2 } from '../domain/models';
import { createDefaultData } from './defaults';
import { parseAppData } from './migrations';
import type { WorkoutRepository } from './repository';

const STORAGE_KEY = 'workout-tracker:data';
export type DataResetScope = 'workouts' | 'body' | 'nutrition' | 'all';

export function resetDataScope(data: AppDataV2, scope: DataResetScope): AppDataV2 {
  const resetWorkouts = scope === 'workouts' || scope === 'all';
  const resetBody = scope === 'body' || scope === 'all';
  const resetNutrition = scope === 'nutrition' || scope === 'all';
  return {
    ...data,
    exercises: resetWorkouts ? data.exercises.filter((exercise) => !exercise.isCustom) : data.exercises,
    programs: resetWorkouts ? [] : data.programs,
    sessions: resetWorkouts ? [] : data.sessions,
    settings: resetWorkouts ? { ...data.settings, lastSelectedProgramId: null } : data.settings,
    body: resetBody ? { profile: null, measurements: [] } : data.body,
    nutrition: resetNutrition ? { targets: [], customFoods: [], diary: [] } : data.nutrition,
  };
}

export class StorageDataError extends Error {
  constructor(message: string, options?: ErrorOptions) { super(message, options); this.name = 'StorageDataError'; }
}

export class LocalStorageWorkoutRepository implements WorkoutRepository {
  constructor(private readonly storage: Storage) {}
  load(): AppDataV2 {
    const stored = this.storage.getItem(STORAGE_KEY);
    if (stored === null) return createDefaultData();
    return this.importJson(stored);
  }
  save(data: AppDataV2): void { this.storage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  exportJson(): string { return JSON.stringify(this.load(), null, 2); }
  importJson(json: string): AppDataV2 {
    try { return parseAppData(JSON.parse(json)); }
    catch (error) { throw new StorageDataError(error instanceof Error ? error.message : 'Could not read workout data.', { cause: error }); }
  }
  replaceFromJson(json: string): AppDataV2 {
    const data = this.importJson(json);
    this.save(data);
    return data;
  }
  clear(): void { this.storage.removeItem(STORAGE_KEY); }
}

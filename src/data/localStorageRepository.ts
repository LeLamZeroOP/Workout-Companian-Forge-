import type { AppDataV2 } from '../domain/models';
import { createDefaultData } from './defaults';
import { parseAppData } from './migrations';
import type { WorkoutRepository } from './repository';

const STORAGE_KEY = 'workout-tracker:data';

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
  clear(): void { this.storage.removeItem(STORAGE_KEY); }
}

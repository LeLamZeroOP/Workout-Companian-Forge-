import type { AppDataV1 } from '../domain/models';

export interface WorkoutRepository {
  load(): AppDataV1;
  save(data: AppDataV1): void;
  exportJson(): string;
  importJson(json: string): AppDataV1;
  clear(): void;
}

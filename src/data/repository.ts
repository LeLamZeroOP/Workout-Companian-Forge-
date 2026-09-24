import type { AppDataV2 } from '../domain/models';

export interface WorkoutRepository {
  load(): AppDataV2;
  save(data: AppDataV2): void;
  exportJson(): string;
  importJson(json: string): AppDataV2;
  replaceFromJson(json: string): AppDataV2;
  clear(): void;
}

import type { AppDataV1 } from '../domain/models';

export function parseAppData(value: unknown): AppDataV1 {
  if (!value || typeof value !== 'object') throw new Error('Workout data must be an object.');
  const candidate = value as Partial<AppDataV1>;
  if (candidate.version !== 1) throw new Error(`Unsupported workout data version: ${String(candidate.version)}`);
  if (!Array.isArray(candidate.exercises) || !Array.isArray(candidate.programs) || !Array.isArray(candidate.sessions) || !candidate.settings) {
    throw new Error('Workout data is missing required collections.');
  }
  return candidate as AppDataV1;
}

import type { AppDataV1, AppDataV2 } from '../domain/models';
import { validateAppData } from './validateAppData';

function hasWorkoutCollections(candidate: Record<string, unknown>): boolean {
  return Array.isArray(candidate.exercises) && Array.isArray(candidate.programs) && Array.isArray(candidate.sessions) && Boolean(candidate.settings);
}

export function parseAppData(value: unknown): AppDataV2 {
  if (!value || typeof value !== 'object') throw new Error('Workout data must be an object.');
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 && candidate.version !== 2 && candidate.version !== 3 && candidate.version !== 4) throw new Error(`Unsupported workout data version: ${String(candidate.version)}`);
  if (!hasWorkoutCollections(candidate)) throw new Error('Workout data is missing required collections.');
  if (candidate.version === 1) {
    const version1 = candidate as unknown as AppDataV1;
    return validateAppData({ ...version1, version: 4, body: { profile: null, measurements: [] }, nutrition: { targets: [], customFoods: [], diary: [] } });
  }
  const body = candidate.body as Record<string, unknown> | undefined;
  const nutrition = candidate.nutrition as Record<string, unknown> | undefined;
  if (!body || !Array.isArray(body.measurements) || !nutrition || !Array.isArray(nutrition.targets) || !Array.isArray(nutrition.customFoods) || !Array.isArray(nutrition.diary)) {
    throw new Error('Workout data is missing body or nutrition collections.');
  }
  return validateAppData({ ...candidate, version: 4 });
}

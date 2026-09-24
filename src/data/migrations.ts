import type { AppDataV1, AppDataV2 } from '../domain/models';

function hasWorkoutCollections(candidate: Record<string, unknown>): boolean {
  return Array.isArray(candidate.exercises) && Array.isArray(candidate.programs) && Array.isArray(candidate.sessions) && Boolean(candidate.settings);
}

export function parseAppData(value: unknown): AppDataV2 {
  if (!value || typeof value !== 'object') throw new Error('Workout data must be an object.');
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 && candidate.version !== 2) throw new Error(`Unsupported workout data version: ${String(candidate.version)}`);
  if (!hasWorkoutCollections(candidate)) throw new Error('Workout data is missing required collections.');
  if (candidate.version === 1) {
    const version1 = candidate as unknown as AppDataV1;
    return { ...version1, version: 2, body: { profile: null, measurements: [] }, nutrition: { targets: [], customFoods: [], diary: [] } };
  }
  const body = candidate.body as Record<string, unknown> | undefined;
  const nutrition = candidate.nutrition as Record<string, unknown> | undefined;
  if (!body || !Array.isArray(body.measurements) || !nutrition || !Array.isArray(nutrition.targets) || !Array.isArray(nutrition.customFoods) || !Array.isArray(nutrition.diary)) {
    throw new Error('Workout data is missing body or nutrition collections.');
  }
  return candidate as unknown as AppDataV2;
}

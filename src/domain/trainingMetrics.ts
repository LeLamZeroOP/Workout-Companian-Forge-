import type { WorkoutSet } from './models';
export function validSetValues(set: Pick<WorkoutSet, 'weightKg' | 'reps'>): set is { weightKg: number; reps: number } {
  return set.weightKg !== null && Number.isFinite(set.weightKg) && set.weightKg >= 0 && set.weightKg <= 100000 && set.reps !== null && Number.isInteger(set.reps) && set.reps > 0 && set.reps <= 10000;
}
export function countedSet(set: WorkoutSet, includeWarmups = false): set is WorkoutSet & { weightKg: number; reps: number } {
  return set.completed && validSetValues(set) && (includeWarmups || set.kind === 'working');
}

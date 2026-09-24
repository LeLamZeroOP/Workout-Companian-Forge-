import type { MuscleContribution, MuscleGroup, WorkoutSession, WorkoutSet } from './models';

export const muscleLabels: Record<MuscleGroup, string> = {
  chest: 'Chest', lats: 'Lats', upperBack: 'Upper back', frontDelts: 'Front delts', sideDelts: 'Side delts', rearDelts: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs',
};

export const muscleGroups = Object.keys(muscleLabels) as MuscleGroup[];

function validWorkingSet(set: WorkoutSet): boolean {
  return set.kind === 'working' && set.completed && set.weightKg !== null && set.reps !== null && set.weightKg >= 0 && set.reps >= 0;
}

function localDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function add(target: MuscleContribution, source: MuscleContribution, multiplier = 1) {
  for (const muscle of muscleGroups) {
    const value = source[muscle];
    if (value) target[muscle] = (target[muscle] ?? 0) + value * multiplier;
  }
}

export function getSessionMuscleSets(session: WorkoutSession): MuscleContribution {
  const result: MuscleContribution = {};
  for (const exercise of session.exercises) {
    const completedWorkingSets = exercise.sets.filter(validWorkingSet).length;
    add(result, exercise.muscleContribution, completedWorkingSets);
  }
  return result;
}

export function getMuscleSetsByDate(sessions: WorkoutSession[]): Array<{ date: string; muscleSets: MuscleContribution }> {
  const dates = new Map<string, MuscleContribution>();
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const date = localDateKey(session.completedAt);
    const values = dates.get(date) ?? {};
    add(values, getSessionMuscleSets(session));
    dates.set(date, values);
  }
  return [...dates.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, muscleSets]) => ({ date, muscleSets }));
}

export function getMuscleSetTotals(sessions: WorkoutSession[], from: Date, to: Date): MuscleContribution {
  const result: MuscleContribution = {};
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const completed = new Date(session.completedAt);
    if (completed < from || completed > to) continue;
    add(result, getSessionMuscleSets(session));
  }
  return result;
}

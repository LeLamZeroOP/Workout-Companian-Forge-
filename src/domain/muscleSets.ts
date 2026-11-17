import { countedSet } from './trainingMetrics';
import type { MuscleContribution, MuscleGroup, WorkoutSession } from './models';
import type { VolumeSummary } from './programMuscleVolume';

export const muscleLabels: Record<MuscleGroup, string> = {
  chest: 'Chest', lats: 'Lats', upperBack: 'Upper back', frontDelts: 'Front delts', sideDelts: 'Side delts', rearDelts: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs',
};

export const muscleGroups = Object.keys(muscleLabels) as MuscleGroup[];

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
    const completedWorkingSets = exercise.sets.filter(set => countedSet(set)).length;
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
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) return result;
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const completed = new Date(session.completedAt);
    if (completed < from || completed > to) continue;
    add(result, getSessionMuscleSets(session));
  }
  return result;
}

export function summarizeCompletedMuscleVolume(sessions: WorkoutSession[]): VolumeSummary {
  const rows = muscleGroups.map(muscle => ({ muscle, directSets: 0 as number | null, indirectSets: 0 as number | null, weightedSets: 0, directSessions: 0 as number | null }));
  const unknown = new Set<string>();
  let performedSets = 0;
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const directlyTrained = new Set<MuscleGroup>();
    for (const exercise of session.exercises) {
      const sets = exercise.sets.filter(set => countedSet(set)).length;
      if (!sets) continue;
      performedSets += sets;
      for (const muscle of muscleGroups) rows.find(row => row.muscle === muscle)!.weightedSets += sets * (exercise.muscleContribution[muscle] ?? 0);
      if (!exercise.muscleRoles) { unknown.add(exercise.exerciseId); continue; }
      for (const muscle of exercise.muscleRoles.direct) { rows.find(row => row.muscle === muscle)!.directSets! += sets; directlyTrained.add(muscle); }
      for (const muscle of exercise.muscleRoles.indirect) rows.find(row => row.muscle === muscle)!.indirectSets! += sets;
    }
    for (const muscle of directlyTrained) rows.find(row => row.muscle === muscle)!.directSessions! += 1;
  }
  if (unknown.size) for (const row of rows) { row.directSets = null; row.indirectSets = null; row.directSessions = null; }
  return { periodDays: null, performedSets, rows, workouts: [], unknownExerciseIds: [...unknown], missingDefinitionIds: [] };
}

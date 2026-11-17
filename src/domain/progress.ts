import { countedSet } from './trainingMetrics';
import type { WorkoutSession, WorkoutSet } from './models';

function localDateKey(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getExercisePersonalBest(sessions: WorkoutSession[], exerciseId: string, includeWarmups = false): WorkoutSet | null {
  let best: WorkoutSet | null = null;
  for (const session of [...sessions].sort((a,b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? '') || a.id.localeCompare(b.id))) {
    if (!session.completedAt) continue;
    for (const exercise of session.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (countedSet(set, includeWarmups) && (!best || set.weightKg > (best.weightKg ?? -1) || (set.weightKg === best.weightKg && set.reps > (best.reps ?? -1)))) best = set;
      }
    }
  }
  return best;
}

export type ExerciseTrendPoint = {
  date: string;
  maxWeightKg: number;
  volumeKg: number;
  totalReps: number;
  completedSets: number;
};

export function getExerciseTrend(sessions: WorkoutSession[], exerciseId: string, includeWarmups = false): ExerciseTrendPoint[] {
  const dates = new Map<string, Omit<ExerciseTrendPoint, 'date'>>();
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const date = localDateKey(session.completedAt);
    for (const exercise of session.exercises) {
      if (exercise.exerciseId !== exerciseId) continue;
      for (const set of exercise.sets) {
        if (!countedSet(set, includeWarmups)) continue;
        const current = dates.get(date) ?? { maxWeightKg: 0, volumeKg: 0, totalReps: 0, completedSets: 0 };
        current.maxWeightKg = Math.max(current.maxWeightKg, set.weightKg);
        current.volumeKg += set.weightKg * set.reps;
        current.totalReps += set.reps;
        current.completedSets += 1;
        dates.set(date, current);
      }
    }
  }
  return [...dates.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, ...values }));
}

export function getDailyVolumeTrend(sessions: WorkoutSession[], includeWarmups = false): Array<{ date: string; volumeKg: number }> {
  const dates = new Map<string, number>();
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const date = localDateKey(session.completedAt);
    dates.set(date, (dates.get(date) ?? 0) + getSessionSummary(session, includeWarmups).volumeKg);
  }
  return [...dates.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, volumeKg]) => ({ date, volumeKg }));
}

export function getSessionSummary(session: WorkoutSession, includeWarmups = false): { completedSets: number; volumeKg: number; durationSeconds: number } {
  let completedSets = 0;
  let volumeKg = 0;
  for (const set of session.exercises.flatMap((exercise) => exercise.sets)) {
    if (!countedSet(set, includeWarmups)) continue;
    completedSets += 1;
    volumeKg += set.weightKg * set.reps;
  }
  const end = session.completedAt ? new Date(session.completedAt).getTime() : new Date(session.startedAt).getTime();
  const durationSeconds = Math.max(0, Math.round((end - new Date(session.startedAt).getTime()) / 1000));
  return { completedSets, volumeKg, durationSeconds };
}

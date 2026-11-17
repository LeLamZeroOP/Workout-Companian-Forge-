import type { WorkoutExercise, WorkoutSession, WorkoutSet } from './models';
import { validSetValues } from './trainingMetrics';

export function previousSetAt(exercise: WorkoutExercise | undefined, kind: WorkoutSet['kind'] | undefined, index: number) {
  const set = exercise?.sets.filter(item => item.kind === kind)[index];
  return set?.completed && validSetValues(set) ? set : undefined;
}

// Repeated movements match their position among occurrences of that movement,
// so a second press block never borrows the first block's loads.
export function previousPerformance(session: WorkoutSession, exercise: WorkoutExercise | undefined, history: WorkoutSession[], kind?: WorkoutSet['kind']) {
  if (!exercise) return undefined;
  const occurrence = session.exercises.filter(item => item.exerciseId === exercise.exerciseId).findIndex(item => item.id === exercise.id);
  return previousPerformanceForOccurrence(session.id, session.startedAt, exercise.exerciseId, occurrence, history, kind);
}

export function previousPerformanceForOccurrence(sessionId: string, startedAt: string, exerciseId: string | undefined, occurrence: number, history: WorkoutSession[], kind?: WorkoutSet['kind']) {
  if (!exerciseId || occurrence < 0) return undefined;
  const started = Date.parse(startedAt);
  const candidates = history.filter(item => item.id !== sessionId && item.completedAt && Date.parse(item.completedAt) <= started)
    .sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!));
  for (const previous of candidates) {
    const match = previous.exercises.filter(item => item.exerciseId === exerciseId)[occurrence];
    if (match?.sets.some(set => set.completed && validSetValues(set) && (!kind || set.kind === kind))) return { session: previous, exercise: match };
  }
  return undefined;
}

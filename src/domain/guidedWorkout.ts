import { validSetValues } from './trainingMetrics';
import type { Id, RestTimerState, WorkoutSession } from './models';

export function getNextIncompleteSet(session: WorkoutSession, fromExerciseId?: Id, fromSetId?: Id): { exerciseId: Id; setId: Id } | null {
  const flat = session.exercises.flatMap((exercise) => exercise.sets.map((set) => ({ exerciseId: exercise.id, setId: set.id, completed: set.completed })));
  const startIndex = fromExerciseId && fromSetId ? flat.findIndex((item) => item.exerciseId === fromExerciseId && item.setId === fromSetId) + 1 : 0;
  const match = [...flat.slice(Math.max(0, startIndex)), ...flat.slice(0, Math.max(0, startIndex))].find((item) => !item.completed);
  return match ? { exerciseId: match.exerciseId, setId: match.setId } : null;
}

export function completeGuidedSet(session: WorkoutSession, exerciseId: Id, setId: Id, now: string): WorkoutSession {
  const next = structuredClone(session);
  const exercise = next.exercises.find((item) => item.id === exerciseId);
  const set = exercise?.sets.find((item) => item.id === setId);
  if (!exercise || !set || !validSetValues(set)) return session;
  set.completed = true;
  const following = getNextIncompleteSet(next, exerciseId, setId);
  if (!following) {
    next.guide = { currentExerciseId: null, currentSetId: null, restTimer: null };
  } else if (exercise.restSeconds === 0) {
    next.guide = { currentExerciseId: following.exerciseId, currentSetId: following.setId, restTimer: null };
  } else {
    const started = new Date(now);
    next.guide = {
      currentExerciseId: exerciseId,
      currentSetId: setId,
      restTimer: {
        exerciseId,
        afterSetId: setId,
        startedAt: started.toISOString(),
        endsAt: new Date(started.getTime() + exercise.restSeconds * 1000).toISOString(),
        durationSeconds: exercise.restSeconds,
      },
    };
  }
  return next;
}

export function skipRest(session: WorkoutSession): WorkoutSession {
  if (!session.guide.restTimer) return session;
  const next = structuredClone(session);
  const following = getNextIncompleteSet(next, next.guide.restTimer!.exerciseId, next.guide.restTimer!.afterSetId);
  next.guide = { currentExerciseId: following?.exerciseId ?? null, currentSetId: following?.setId ?? null, restTimer: null };
  return next;
}

export function extendRest(session: WorkoutSession, seconds: 30): WorkoutSession {
  if (!session.guide.restTimer) return session;
  const next = structuredClone(session);
  const rest = next.guide.restTimer!;
  rest.endsAt = new Date(new Date(rest.endsAt).getTime() + seconds * 1000).toISOString();
  rest.durationSeconds += seconds;
  return next;
}

export function getRemainingRestSeconds(rest: RestTimerState, now: string): number {
  return Math.max(0, Math.ceil((new Date(rest.endsAt).getTime() - new Date(now).getTime()) / 1000));
}

export function selectGuidedSet(session: WorkoutSession, exerciseId: Id, setId: Id): WorkoutSession {
  const exists = session.exercises.some((exercise) => exercise.id === exerciseId && exercise.sets.some((set) => set.id === setId));
  if (!exists) return session;
  const next = structuredClone(session);
  next.guide = { currentExerciseId: exerciseId, currentSetId: setId, restTimer: null };
  return next;
}

export function undoGuidedSet(session: WorkoutSession, exerciseId: Id, setId: Id): WorkoutSession {
  const next = selectGuidedSet(session, exerciseId, setId);
  if (next === session) return session;
  next.exercises.find(exercise => exercise.id === exerciseId)!.sets.find(set => set.id === setId)!.completed = false;
  return next;
}

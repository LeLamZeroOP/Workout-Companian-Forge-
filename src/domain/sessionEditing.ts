import { getNextIncompleteSet } from './guidedWorkout';
import type { ExerciseDefinition, Program, WorkoutExercise, WorkoutSession } from './models';

export type ExerciseDetails = Pick<WorkoutExercise, 'targetRepMin' | 'targetRepMax' | 'restSeconds' | 'notes'>;
export type SessionDetails = Pick<WorkoutSession, 'workoutName' | 'notes'>;

export function validateExerciseDetails(details: ExerciseDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  const { targetRepMin: min, targetRepMax: max, restSeconds, notes } = details;
  if ((min !== undefined || max !== undefined) &&
    (!Number.isInteger(min) || !Number.isInteger(max) || min! < 1 || max! > 100 || min! > max!)) {
    errors.targets = 'Use a whole-number repetition range from 1 to 100, or leave both targets blank.';
  }
  if (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600) errors.restSeconds = 'Rest must be a whole number from 0 to 600 seconds.';
  if (notes.length > 2000) errors.notes = 'Notes must be 2,000 characters or fewer.';
  return errors;
}

export function validateSessionDetails(details: SessionDetails): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!details.workoutName.trim() || details.workoutName.trim().length > 60) errors.workoutName = 'Workout name must be 1–60 characters.';
  if (details.notes.length > 2000) errors.notes = 'Notes must be 2,000 characters or fewer.';
  return errors;
}

export function editSessionExercise(session: WorkoutSession, exerciseId: string, details: ExerciseDetails): WorkoutSession {
  if (session.completedAt || Object.keys(validateExerciseDetails(details)).length || !session.exercises.some(e => e.id === exerciseId)) return session;
  return { ...session, exercises: session.exercises.map(e => e.id === exerciseId ? { ...e, ...details, targetRepMin: details.targetRepMin, targetRepMax: details.targetRepMax } : e) };
}

export function editSessionDetails(session: WorkoutSession, details: SessionDetails): WorkoutSession {
  if (session.completedAt || Object.keys(validateSessionDetails(details)).length) return session;
  return { ...session, ...details, workoutName: details.workoutName.trim() };
}

function clearGuide(session: WorkoutSession) {
  session.guide = { currentExerciseId: null, currentSetId: null, restTimer: null };
}

/** Where a new movement goes: first, after a given session exercise, or at the end. */
export type AddExercisePosition = 'start' | 'end' | { afterExerciseId: string };
export type AddExerciseOptions = { targetSets: number; targetRepMin: number; targetRepMax: number; restSeconds: number; position: AddExercisePosition };
export const defaultAddExerciseOptions: AddExerciseOptions = { targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, position: 'end' };

export function validateAddExerciseOptions(options: AddExerciseOptions): Record<string, string> {
  const errors: Record<string, string> = {};
  const { targetSets, targetRepMin: min, targetRepMax: max, restSeconds } = options;
  if (!Number.isInteger(targetSets) || targetSets < 1 || targetSets > 10) errors.targetSets = 'Sets must be a whole number from 1 to 10.';
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 100 || min > max) errors.targets = 'Use a whole-number repetition range from 1 to 100.';
  if (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 600) errors.restSeconds = 'Rest must be a whole number from 0 to 600 seconds.';
  return errors;
}

export function addSessionExercise(session: WorkoutSession, definition: ExerciseDefinition, choices: Partial<AddExerciseOptions> = {}): WorkoutSession {
  const options = { ...defaultAddExerciseOptions, ...choices };
  if (session.completedAt || session.exercises.length >= 200 || Object.keys(validateAddExerciseOptions(options)).length) return session;
  const added: WorkoutExercise = {
    id: `workout-exercise-${crypto.randomUUID()}`, exerciseId: definition.id, exerciseName: definition.name,
    muscleContribution: structuredClone(definition.muscleContribution),
    ...(definition.muscleRoles ? { muscleRoles: structuredClone(definition.muscleRoles) } : {}),
    ...(definition.chestEmphasis ? { chestEmphasis: definition.chestEmphasis } : {}),
    targetRepMin: options.targetRepMin, targetRepMax: options.targetRepMax, restSeconds: options.restSeconds, notes: definition.setupNotes ?? '',
    sets: Array.from({ length: options.targetSets }, () => ({ id: `set-${crypto.randomUUID()}`, kind: 'working', weightKg: null, reps: null, completed: false })),
  };
  // An unknown anchor (for example, an exercise removed meanwhile) falls back to the end.
  const anchor = typeof options.position === 'object' ? session.exercises.findIndex(item => item.id === (options.position as { afterExerciseId: string }).afterExerciseId) : -1;
  const index = options.position === 'start' ? 0 : anchor >= 0 ? anchor + 1 : session.exercises.length;
  const exercises = [...session.exercises.slice(0, index), added, ...session.exercises.slice(index)];
  const hasRemaining = Boolean(getNextIncompleteSet(session));
  return { ...session, exercises,
    guide: hasRemaining ? session.guide : { currentExerciseId: added.id, currentSetId: added.sets[0]!.id, restTimer: null } };
}

/**
 * Add the same movement to the program workout a session was started from.
 * It follows the template entry matching the session exercise it was placed after;
 * otherwise it goes first or last. Returns null when the workout is missing or full.
 */
export function addExerciseToProgramWorkout(program: Program, workoutTemplateId: string, definition: ExerciseDefinition, choices: Partial<AddExerciseOptions>, afterExerciseDefinitionId: string | null, now: string): Program | null {
  const options = { ...defaultAddExerciseOptions, ...choices };
  const workoutIndex = program.workouts.findIndex(workout => workout.id === workoutTemplateId);
  const workout = program.workouts[workoutIndex];
  if (!workout || workout.exercises.length >= 20 || Object.keys(validateAddExerciseOptions(options)).length) return null;
  const anchor = afterExerciseDefinitionId === null ? -1 : workout.exercises.findIndex(item => item.exerciseId === afterExerciseDefinitionId);
  const index = options.position === 'start' ? 0 : anchor >= 0 ? anchor + 1 : workout.exercises.length;
  const entry = { id: `template-exercise-${crypto.randomUUID()}`, exerciseId: definition.id, targetSets: options.targetSets, targetRepMin: options.targetRepMin, targetRepMax: options.targetRepMax, restSeconds: options.restSeconds, notes: '' };
  const workouts = [...program.workouts];
  workouts[workoutIndex] = { ...workout, exercises: [...workout.exercises.slice(0, index), entry, ...workout.exercises.slice(index)] };
  return { ...program, workouts, updatedAt: now };
}

export function replaceSessionExercise(session: WorkoutSession, exerciseId: string, replacement: ExerciseDefinition): WorkoutSession {
  const index = session.exercises.findIndex(e => e.id === exerciseId);
  const original = session.exercises[index];
  if (session.completedAt || !original || original.exerciseId === replacement.id || original.sets.every(s => s.completed)) return session;
  const next = structuredClone(session);
  const completed = original.sets.filter(s => s.completed);
  const changed: WorkoutExercise = {
    id: completed.length ? `workout-exercise-${crypto.randomUUID()}` : original.id,
    exerciseId: replacement.id,
    exerciseName: replacement.name,
    muscleContribution: structuredClone(replacement.muscleContribution),
    ...(replacement.muscleRoles ? { muscleRoles: structuredClone(replacement.muscleRoles) } : {}),
    ...(replacement.chestEmphasis ? { chestEmphasis: replacement.chestEmphasis } : {}),
    targetRepMin: original.targetRepMin,
    targetRepMax: original.targetRepMax,
    restSeconds: original.restSeconds,
    notes: replacement.setupNotes ?? '',
    sets: original.sets.filter(s => !s.completed).map(s => ({
      id: `set-${crypto.randomUUID()}`, kind: s.kind, weightKg: null, reps: null, completed: false,
    })),
  };
  next.exercises.splice(index, 1, ...(completed.length ? [{ ...next.exercises[index]!, sets: structuredClone(completed) }, changed] : [changed]));
  if (session.guide.currentExerciseId === exerciseId || session.guide.restTimer?.exerciseId === exerciseId || !session.guide.currentExerciseId) {
    next.guide = { currentExerciseId: changed.id, currentSetId: changed.sets[0]!.id, restTimer: null };
  }
  return next;
}

export function removeSessionExercise(session: WorkoutSession, exerciseId: string): WorkoutSession {
  const index = session.exercises.findIndex(e => e.id === exerciseId);
  if (session.completedAt || index < 0) return session;
  const next = structuredClone(session);
  next.exercises.splice(index, 1);
  if (!getNextIncompleteSet(next)) clearGuide(next);
  else if (session.guide.currentExerciseId === exerciseId || session.guide.restTimer?.exerciseId === exerciseId || !session.guide.currentExerciseId) {
    // Begin at the removed exercise's former position, wrapping to earlier entries.
    const ordered = [...next.exercises.slice(index), ...next.exercises.slice(0, index)];
    const following = getNextIncompleteSet({ ...next, exercises: ordered });
    next.guide = { currentExerciseId: following!.exerciseId, currentSetId: following!.setId, restTimer: null };
  }
  return next;
}

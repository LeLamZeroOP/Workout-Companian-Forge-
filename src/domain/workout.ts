import { countedSet } from './trainingMetrics';
import type { ExerciseDefinition, Program, WorkoutSession, WorkoutTemplate } from './models';

function id(prefix: string): string {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

export function createSession(program: Program | null, workout: WorkoutTemplate, exercises: ExerciseDefinition[], now: string): WorkoutSession {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const sessionExercises = workout.exercises.map((item) => {
    const definition = exerciseMap.get(item.exerciseId);
    if (!definition) throw new Error(`Exercise ${item.exerciseId} does not exist`);
    return {
      id: id('workout-exercise'),
      exerciseId: definition.id,
      exerciseName: definition.name,
      muscleContribution: { ...definition.muscleContribution },
      ...(definition.muscleRoles ? { muscleRoles: structuredClone(definition.muscleRoles) } : {}),
      ...(definition.chestEmphasis ? { chestEmphasis: definition.chestEmphasis } : {}),
      restSeconds: item.restSeconds,
      targetRepMin: item.targetRepMin,
      targetRepMax: item.targetRepMax,
      notes: [definition.setupNotes, item.notes].filter(Boolean).join('\n'),
      sets: Array.from({ length: item.targetSets }, () => ({
        id: id('set'), weightKg: null, reps: null, kind: 'working' as const, completed: false,
      })),
    };
  });
  const firstExercise = sessionExercises[0];
  return {
    id: id('session'),
    programId: program?.id ?? null,
    programName: program?.name ?? 'Custom workout',
    workoutTemplateId: program ? workout.id : null,
    workoutName: workout.name,
    startedAt: now,
    completedAt: null,
    notes: workout.notes,
    exercises: sessionExercises,
    guide: {
      currentExerciseId: firstExercise?.id ?? null,
      currentSetId: firstExercise?.sets[0]?.id ?? null,
      restTimer: null,
    },
  };
}

export function calculateSessionVolume(session: WorkoutSession, includeWarmups = false): number {
  return session.exercises.flatMap((exercise) => exercise.sets).reduce((total, set) => {
    if (!countedSet(set, includeWarmups)) return total;
    return total + set.weightKg * set.reps;
  }, 0);
}

export function validateProgram(program: Program, exercises: ExerciseDefinition[]): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!program.name.trim() || program.name.trim().length > 60) errors.name = 'Program name must be 1-60 characters.';
  if (program.workouts.length < 1 || program.workouts.length > 14) errors.workouts = 'Add between 1 and 14 workouts.';
  program.workouts.forEach((workout, workoutIndex) => {
    const path = `workouts.${workoutIndex}`;
    for (const [key, message] of Object.entries(validateWorkoutTemplate(workout, exercises))) errors[path + '.' + key] = message;
  });
  const plan = program.volumePlan;
  if (plan?.cycle) {
    const slots = plan.cycle.slots;
    const validIds = new Set(program.workouts.map(workout => workout.id));
    if (slots.length < 1 || slots.length > 28 || slots.every(slot => slot === null)) errors.cycle = 'Use 1–28 days with at least one workout.';
    else if (slots.some(slot => slot !== null && !validIds.has(slot))) errors.cycle = 'Assign every scheduled day to a current workout or rest.';
  }
  if (plan) {
    const seen = new Set<string>();
    for (const target of plan.targets) {
      if (seen.has(target.muscle) || !Number.isFinite(target.lower) || !Number.isFinite(target.upper) || target.lower < 0 || target.upper > 1000 || target.lower > target.upper || (target.period === 'sevenDayAverage' && !plan.cycle)) errors.targets = 'Review target ranges, duplicates, and schedule basis.';
      seen.add(target.muscle);
    }
  }
  return errors;
}

export function canFinishSession(session: WorkoutSession): boolean {
  return session.completedAt === null && session.exercises.some(exercise => exercise.sets.some(set => countedSet(set, true)));
}

export function validateWorkoutTemplate(workout: WorkoutTemplate, exercises: ExerciseDefinition[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const catalog = new Map(exercises.map(exercise => [exercise.id, exercise]));
  if (!workout.name.trim() || workout.name.trim().length > 60) errors.name = 'Workout name must be 1-60 characters.';
  if (workout.exercises.length < 1 || workout.exercises.length > 20) errors.exercises = 'Add between 1 and 20 exercises.';
  workout.exercises.forEach((item, exerciseIndex) => {
    const exercisePath = `exercises.${exerciseIndex}`;
    if (!catalog.has(item.exerciseId)) errors[`${exercisePath}.exerciseId`] = 'Choose an exercise from the catalog.';
    if (!Number.isInteger(item.targetSets) || item.targetSets < 1 || item.targetSets > 10) errors[`${exercisePath}.targetSets`] = 'Sets must be from 1 to 10.';
    if (!Number.isInteger(item.targetRepMin) || !Number.isInteger(item.targetRepMax) || item.targetRepMin < 1 || item.targetRepMax > 100 || item.targetRepMin > item.targetRepMax) errors[`${exercisePath}.targetRepRange`] = 'Use a valid repetition range from 1 to 100.';
    if (!Number.isInteger(item.restSeconds) || item.restSeconds < 0 || item.restSeconds > 600) errors[`${exercisePath}.restSeconds`] = 'Rest must be from 0 to 600 seconds.';
  });
  return errors;
}

export function createCustomSession(workout: WorkoutTemplate, exercises: ExerciseDefinition[], now: string): WorkoutSession {
  const errors = validateWorkoutTemplate(workout, exercises);
  if (workout.notes.length > 2000) errors.notes = 'Notes must be 2,000 characters or fewer.';
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);
  return createSession(null, { ...workout, name: workout.name.trim() }, exercises, now);
}

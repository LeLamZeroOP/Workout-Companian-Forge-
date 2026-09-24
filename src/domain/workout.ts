import type { ExerciseDefinition, Program, WorkoutSession, WorkoutTemplate } from './models';

function id(prefix: string): string {
  const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value}`;
}

export function createSession(program: Program, workout: WorkoutTemplate, exercises: ExerciseDefinition[], now: string): WorkoutSession {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const sessionExercises = workout.exercises.map((item) => {
    const definition = exerciseMap.get(item.exerciseId);
    if (!definition) throw new Error(`Exercise ${item.exerciseId} does not exist`);
    return {
      id: id('workout-exercise'),
      exerciseId: definition.id,
      exerciseName: definition.name,
      muscleContribution: { ...definition.muscleContribution },
      restSeconds: item.restSeconds,
      notes: item.notes,
      sets: Array.from({ length: item.targetSets }, () => ({
        id: id('set'), weightKg: null, reps: null, kind: 'working' as const, completed: false,
      })),
    };
  });
  const firstExercise = sessionExercises[0];
  return {
    id: id('session'),
    programId: program.id,
    programName: program.name,
    workoutTemplateId: workout.id,
    workoutName: workout.name,
    startedAt: now,
    completedAt: null,
    notes: '',
    exercises: sessionExercises,
    guide: {
      currentExerciseId: firstExercise?.id ?? null,
      currentSetId: firstExercise?.sets[0]?.id ?? null,
      restTimer: null,
    },
  };
}

export function calculateSessionVolume(session: WorkoutSession): number {
  return session.exercises.flatMap((exercise) => exercise.sets).reduce((total, set) => {
    if (!set.completed || set.weightKg === null || set.reps === null || set.weightKg < 0 || set.reps < 0) return total;
    return total + set.weightKg * set.reps;
  }, 0);
}

export function validateProgram(program: Program, exercises: ExerciseDefinition[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const catalog = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  if (!program.name.trim() || program.name.trim().length > 60) errors.name = 'Program name must be 1-60 characters.';
  if (program.workouts.length < 1 || program.workouts.length > 14) errors.workouts = 'Add between 1 and 14 workouts.';
  program.workouts.forEach((workout, workoutIndex) => {
    const path = `workouts.${workoutIndex}`;
    if (!workout.name.trim() || workout.name.trim().length > 60) errors[`${path}.name`] = 'Workout name must be 1-60 characters.';
    if (workout.exercises.length < 1 || workout.exercises.length > 20) errors[`${path}.exercises`] = 'Add between 1 and 20 exercises.';
    workout.exercises.forEach((item, exerciseIndex) => {
      const exercisePath = `${path}.exercises.${exerciseIndex}`;
      if (!catalog.has(item.exerciseId)) errors[`${exercisePath}.exerciseId`] = 'Choose an exercise from the catalog.';
      if (!Number.isInteger(item.targetSets) || item.targetSets < 1 || item.targetSets > 10) errors[`${exercisePath}.targetSets`] = 'Sets must be from 1 to 10.';
      if (!Number.isInteger(item.targetRepMin) || !Number.isInteger(item.targetRepMax) || item.targetRepMin < 1 || item.targetRepMax > 100 || item.targetRepMin > item.targetRepMax) errors[`${exercisePath}.targetRepRange`] = 'Use a valid repetition range from 1 to 100.';
      if (!Number.isInteger(item.restSeconds) || item.restSeconds < 0 || item.restSeconds > 600) errors[`${exercisePath}.restSeconds`] = 'Rest must be from 0 to 600 seconds.';
    });
  });
  return errors;
}

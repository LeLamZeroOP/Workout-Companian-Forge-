import { exercisesForProgram } from './exerciseCatalog';
import { canonical } from './canonical';
import type { AppDataV2, BodyMeasurement, BodyProfile, ExerciseDefinition, FoodDefinition, FoodLogEntry, NutritionTarget, Program, WorkoutSession } from './models';
import { upsertNutritionTarget } from './foodDiary';
import { canFinishSession } from './workout';
import type { WorkoutPreferences } from './models';

export type AppMutation =
  | { kind: 'saveProgram'; program: Program }
  | { kind: 'deleteProgram'; programId: string }
  | { kind: 'saveExercise'; exercise: ExerciseDefinition }
  | { kind: 'startWorkout'; session: WorkoutSession; programId: string | null }
  | { kind: 'updateSession'; session: WorkoutSession; newExercises?: ExerciseDefinition[] }
  | { kind: 'finishWorkout'; sessionId: string; completedAt: string }
  | { kind: 'discardWorkout'; sessionId: string }
  | { kind: 'deleteSession'; sessionId: string }
  | { kind: 'saveWorkoutPreferences'; preferences: WorkoutPreferences }
  | { kind: 'saveBodyProfile'; profile: BodyProfile }
  | { kind: 'saveBodyMeasurement'; measurement: BodyMeasurement }
  | { kind: 'deleteBodyMeasurement'; measurementId: string }
  | { kind: 'saveNutritionTarget'; target: NutritionTarget }
  | { kind: 'saveCustomFood'; food: FoodDefinition }
  | { kind: 'copyFoodEntries'; entries: FoodLogEntry[] }
  | { kind: 'addFoodEntry'; entry: FoodLogEntry }
  | { kind: 'deleteFoodEntry'; entryId: string };

export function getConflictScope(mutation: AppMutation): string {
  switch (mutation.kind) {
    case 'saveProgram': return `program:${mutation.program.id}`;
    case 'saveWorkoutPreferences': return 'settings:workoutPreferences';
    case 'deleteProgram': return `program:${mutation.programId}`;
    case 'saveExercise': return `exercise:${mutation.exercise.id}`;
    case 'startWorkout': return `session:${mutation.session.id}`;
    case 'updateSession': return `session:${mutation.session.id}`;
    case 'finishWorkout':
    case 'deleteSession':
    case 'discardWorkout': return `session:${mutation.sessionId}`;
    case 'saveBodyProfile': return 'body:profile';
    case 'saveBodyMeasurement': return `measurement:${mutation.measurement.id}`;
    case 'deleteBodyMeasurement': return `measurement:${mutation.measurementId}`;
    case 'saveNutritionTarget': return `target:${mutation.target.effectiveFrom}`;
    case 'saveCustomFood': return `food:${mutation.food.id}`;
    case 'copyFoodEntries': return 'diary:all';
    case 'addFoodEntry': return `entry:${mutation.entry.id}`;
    case 'deleteFoodEntry': return `entry:${mutation.entryId}`;
  }
}

export function readConflictValue(data: AppDataV2, scope: string): unknown {
  const separator = scope.indexOf(':');
  const type = scope.slice(0, separator);
  const id = scope.slice(separator + 1);
  switch (type) {
    case 'program': return data.programs.find((item) => item.id === id) ?? null;
    case 'exercise': return data.exercises.find((item) => item.id === id) ?? null;
    case 'session': return data.sessions.find((item) => item.id === id) ?? null;
    case 'body': return data.body.profile;
    case 'settings': return { restAlertSound: data.settings.restAlertSound, restAlertVibration: data.settings.restAlertVibration, keepScreenAwake: data.settings.keepScreenAwake };
    case 'measurement': return data.body.measurements.find((item) => item.id === id) ?? null;
    case 'target': return data.nutrition.targets.find((item) => item.effectiveFrom === id) ?? null;
    case 'food': return data.nutrition.customFoods.find((item) => item.id === id) ?? null;
    case 'diary': return data.nutrition.diary;
    case 'entry': return data.nutrition.diary.find((item) => item.id === id) ?? null;
    default: throw new Error(`Unknown conflict scope: ${scope}`);
  }
}

function upsert<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => existing.id === item.id ? item : existing)
    : [...items, item];
}

export function applyMutation(data: AppDataV2, mutation: AppMutation): AppDataV2 {
  switch (mutation.kind) {
    case 'saveProgram': return { ...data, exercises: exercisesForProgram(data.exercises, mutation.program), programs: upsert(data.programs, mutation.program) };
    case 'saveWorkoutPreferences': return { ...data, settings: { ...data.settings, ...mutation.preferences } };
    case 'deleteProgram': return { ...data, programs: data.programs.filter((item) => item.id !== mutation.programId) };
    case 'saveExercise': return { ...data, exercises: upsert(data.exercises, mutation.exercise) };
    case 'startWorkout': return data.sessions.some((item) => item.id === mutation.session.id || item.completedAt === null)
      ? data
      : { ...data, sessions: [...data.sessions, mutation.session], settings: { ...data.settings, lastSelectedProgramId: mutation.programId ?? data.settings.lastSelectedProgramId } };
    case 'updateSession': {
      let exercises = data.exercises;
      for (const definition of mutation.newExercises ?? []) {
        if (!definition.isCustom || mutation.session.completedAt) throw new Error('Custom exercises can only be created during an active workout.');
        const existing = exercises.find(item => item.id === definition.id);
        if (existing && canonical(existing) !== canonical(definition)) throw new Error('This exercise already exists with different details.');
        exercises = upsert(exercises, definition);
      }
      return { ...data, exercises, sessions: upsert(data.sessions, mutation.session) };
    }
    case 'finishWorkout': return { ...data, sessions: data.sessions.map((session) => session.id === mutation.sessionId && canFinishSession(session)
      ? { ...session, completedAt: mutation.completedAt, guide: { ...session.guide, restTimer: null } } : session) };
    case 'discardWorkout': return { ...data, sessions: data.sessions.filter((session) => session.id !== mutation.sessionId || session.completedAt !== null) };
    case 'deleteSession': return { ...data, sessions: data.sessions.filter((session) => session.id !== mutation.sessionId || session.completedAt === null) };
    case 'saveBodyProfile': return { ...data, body: { ...data.body, profile: mutation.profile } };
    case 'saveBodyMeasurement': return { ...data, body: { ...data.body, measurements: upsert(data.body.measurements, mutation.measurement) } };
    case 'deleteBodyMeasurement': return { ...data, body: { ...data.body, measurements: data.body.measurements.filter((item) => item.id !== mutation.measurementId) } };
    case 'saveNutritionTarget': return { ...data, nutrition: { ...data.nutrition, targets: upsertNutritionTarget(data.nutrition.targets, mutation.target) } };
    case 'saveCustomFood': return { ...data, nutrition: { ...data.nutrition, customFoods: upsert(data.nutrition.customFoods, mutation.food) } };
    case 'copyFoodEntries': return { ...data, nutrition: { ...data.nutrition, diary: mutation.entries.reduce((diary, entry) => upsert(diary, entry), data.nutrition.diary) } };
    case 'addFoodEntry': return { ...data, nutrition: { ...data.nutrition, diary: upsert(data.nutrition.diary, mutation.entry) } };
    case 'deleteFoodEntry': return { ...data, nutrition: { ...data.nutrition, diary: data.nutrition.diary.filter((item) => item.id !== mutation.entryId) } };
  }
}

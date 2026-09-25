import type { AppDataV2, BodyMeasurement, BodyProfile, ExerciseDefinition, FoodDefinition, FoodLogEntry, NutritionTarget, Program, WorkoutSession } from './models';
import { upsertNutritionTarget } from './foodDiary';

export type AppMutation =
  | { kind: 'saveProgram'; program: Program }
  | { kind: 'deleteProgram'; programId: string }
  | { kind: 'saveExercise'; exercise: ExerciseDefinition }
  | { kind: 'startWorkout'; session: WorkoutSession; programId: string }
  | { kind: 'updateSession'; session: WorkoutSession }
  | { kind: 'finishWorkout'; sessionId: string; completedAt: string }
  | { kind: 'discardWorkout'; sessionId: string }
  | { kind: 'saveBodyProfile'; profile: BodyProfile }
  | { kind: 'saveBodyMeasurement'; measurement: BodyMeasurement }
  | { kind: 'deleteBodyMeasurement'; measurementId: string }
  | { kind: 'saveNutritionTarget'; target: NutritionTarget }
  | { kind: 'saveCustomFood'; food: FoodDefinition }
  | { kind: 'addFoodEntry'; entry: FoodLogEntry }
  | { kind: 'deleteFoodEntry'; entryId: string };

export function getConflictScope(mutation: AppMutation): string {
  switch (mutation.kind) {
    case 'saveProgram': return `program:${mutation.program.id}`;
    case 'deleteProgram': return `program:${mutation.programId}`;
    case 'saveExercise': return `exercise:${mutation.exercise.id}`;
    case 'startWorkout': return `session:${mutation.session.id}`;
    case 'updateSession': return `session:${mutation.session.id}`;
    case 'finishWorkout':
    case 'discardWorkout': return `session:${mutation.sessionId}`;
    case 'saveBodyProfile': return 'body:profile';
    case 'saveBodyMeasurement': return `measurement:${mutation.measurement.id}`;
    case 'deleteBodyMeasurement': return `measurement:${mutation.measurementId}`;
    case 'saveNutritionTarget': return `target:${mutation.target.effectiveFrom}`;
    case 'saveCustomFood': return `food:${mutation.food.id}`;
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
    case 'measurement': return data.body.measurements.find((item) => item.id === id) ?? null;
    case 'target': return data.nutrition.targets.find((item) => item.effectiveFrom === id) ?? null;
    case 'food': return data.nutrition.customFoods.find((item) => item.id === id) ?? null;
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
    case 'saveProgram': return { ...data, programs: upsert(data.programs, mutation.program) };
    case 'deleteProgram': return { ...data, programs: data.programs.filter((item) => item.id !== mutation.programId) };
    case 'saveExercise': return { ...data, exercises: upsert(data.exercises, mutation.exercise) };
    case 'startWorkout': return data.sessions.some((item) => item.id === mutation.session.id)
      ? data
      : { ...data, sessions: [...data.sessions, mutation.session], settings: { ...data.settings, lastSelectedProgramId: mutation.programId } };
    case 'updateSession': return { ...data, sessions: upsert(data.sessions, mutation.session) };
    case 'finishWorkout': return { ...data, sessions: data.sessions.map((session) => session.id === mutation.sessionId && session.completedAt === null
      ? { ...session, completedAt: mutation.completedAt, guide: { ...session.guide, restTimer: null } } : session) };
    case 'discardWorkout': return { ...data, sessions: data.sessions.filter((session) => session.id !== mutation.sessionId || session.completedAt !== null) };
    case 'saveBodyProfile': return { ...data, body: { ...data.body, profile: mutation.profile } };
    case 'saveBodyMeasurement': return { ...data, body: { ...data.body, measurements: upsert(data.body.measurements, mutation.measurement) } };
    case 'deleteBodyMeasurement': return { ...data, body: { ...data.body, measurements: data.body.measurements.filter((item) => item.id !== mutation.measurementId) } };
    case 'saveNutritionTarget': return { ...data, nutrition: { ...data.nutrition, targets: upsertNutritionTarget(data.nutrition.targets, mutation.target) } };
    case 'saveCustomFood': return { ...data, nutrition: { ...data.nutrition, customFoods: upsert(data.nutrition.customFoods, mutation.food) } };
    case 'addFoodEntry': return { ...data, nutrition: { ...data.nutrition, diary: upsert(data.nutrition.diary, mutation.entry) } };
    case 'deleteFoodEntry': return { ...data, nutrition: { ...data.nutrition, diary: data.nutrition.diary.filter((item) => item.id !== mutation.entryId) } };
  }
}

import type { AppDataV2 } from '../domain/models';

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const muscles = new Set(['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs']);

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
}

function array(value: unknown, path: string, max = 10000): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(`${path} must be an array with at most ${max} items.`);
  return value;
}

function string(value: unknown, path: string, max = 4096, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`${path} must be a valid string.`);
  return value;
}

function nullableString(value: unknown, path: string): void {
  if (value !== null) string(value, path);
}

function number(value: unknown, path: string, min = 0, max = 1_000_000): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) throw new Error(`${path} must be a valid number.`);
}

function nullableNumber(value: unknown, path: string, min = 0, max = 1_000_000): void {
  if (value !== null) number(value, path, min, max);
}

function boolean(value: unknown, path: string): void {
  if (typeof value !== 'boolean') throw new Error(`${path} must be a boolean.`);
}

function oneOf(value: unknown, path: string, options: readonly string[]): void {
  if (typeof value !== 'string' || !options.includes(value)) throw new Error(`${path} has an invalid value.`);
}

function date(value: unknown, path: string): void {
  string(value, path, 10, true);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`))) throw new Error(`${path} must be a date.`);
}

function timestamp(value: unknown, path: string): void {
  string(value, path, 40, true);
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) throw new Error(`${path} must be a timestamp.`);
}

function nullableTimestamp(value: unknown, path: string): void {
  if (value !== null) timestamp(value, path);
}

function uniqueIds(items: unknown[], path: string): void {
  const ids = new Set<string>();
  items.forEach((item, index) => {
    const id = string(record(item, `${path}[${index}]`).id, `${path}[${index}].id`, 200, true);
    if (ids.has(id)) throw new Error(`${path} has a duplicate ID.`);
    ids.add(id);
  });
}

function contributions(value: unknown, path: string): void {
  for (const [muscle, amount] of Object.entries(record(value, path))) {
    if (!muscles.has(muscle)) throw new Error(`${path}.${muscle} is not a muscle group.`);
    number(amount, `${path}.${muscle}`, 0, 1);
  }
}

function nutrients(value: unknown, path: string): void {
  const item = record(value, path);
  for (const field of ['caloriesKcal', 'proteinG', 'carbsG', 'fatG']) number(item[field], `${path}.${field}`);
  nullableNumber(item.fiberG, `${path}.fiberG`);
  nullableNumber(item.sodiumMg, `${path}.sodiumMg`);
}

function exercise(value: unknown, path: string): void {
  const item = record(value, path);
  string(item.id, `${path}.id`, 200, true);
  string(item.name, `${path}.name`, 200, true);
  oneOf(item.equipment, `${path}.equipment`, ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'other']);
  contributions(item.muscleContribution, `${path}.muscleContribution`);
  boolean(item.isCustom, `${path}.isCustom`);
}

function program(value: unknown, path: string): void {
  const item = record(value, path);
  string(item.id, `${path}.id`, 200, true);
  string(item.name, `${path}.name`, 200, true);
  string(item.notes, `${path}.notes`);
  timestamp(item.createdAt, `${path}.createdAt`);
  timestamp(item.updatedAt, `${path}.updatedAt`);
  const workouts = array(item.workouts, `${path}.workouts`, 200);
  uniqueIds(workouts, `${path}.workouts`);
  workouts.forEach((workoutValue, workoutIndex) => {
    const workoutPath = `${path}.workouts[${workoutIndex}]`;
    const workout = record(workoutValue, workoutPath);
    string(workout.name, `${workoutPath}.name`, 200, true);
    string(workout.notes, `${workoutPath}.notes`);
    const entries = array(workout.exercises, `${workoutPath}.exercises`, 200);
    uniqueIds(entries, `${workoutPath}.exercises`);
    entries.forEach((entryValue, index) => {
      const entryPath = `${workoutPath}.exercises[${index}]`;
      const entry = record(entryValue, entryPath);
      string(entry.exerciseId, `${entryPath}.exerciseId`, 200, true);
      for (const key of ['targetSets', 'targetRepMin', 'targetRepMax', 'restSeconds']) number(entry[key], `${entryPath}.${key}`, 0, 10000);
      string(entry.notes, `${entryPath}.notes`);
    });
  });
}

function session(value: unknown, path: string): void {
  const item = record(value, path);
  string(item.id, `${path}.id`, 200, true);
  nullableString(item.programId, `${path}.programId`);
  string(item.programName, `${path}.programName`, 200);
  nullableString(item.workoutTemplateId, `${path}.workoutTemplateId`);
  string(item.workoutName, `${path}.workoutName`, 200, true);
  timestamp(item.startedAt, `${path}.startedAt`);
  nullableTimestamp(item.completedAt, `${path}.completedAt`);
  string(item.notes, `${path}.notes`);
  const entries = array(item.exercises, `${path}.exercises`, 200);
  uniqueIds(entries, `${path}.exercises`);
  entries.forEach((entryValue, index) => {
    const entryPath = `${path}.exercises[${index}]`;
    const entry = record(entryValue, entryPath);
    string(entry.exerciseId, `${entryPath}.exerciseId`, 200, true);
    string(entry.exerciseName, `${entryPath}.exerciseName`, 200, true);
    contributions(entry.muscleContribution, `${entryPath}.muscleContribution`);
    number(entry.restSeconds, `${entryPath}.restSeconds`, 0, 10000);
    string(entry.notes, `${entryPath}.notes`);
    const sets = array(entry.sets, `${entryPath}.sets`, 1000);
    uniqueIds(sets, `${entryPath}.sets`);
    sets.forEach((setValue, setIndex) => {
      const setPath = `${entryPath}.sets[${setIndex}]`;
      const set = record(setValue, setPath);
      nullableNumber(set.weightKg, `${setPath}.weightKg`, 0, 100000);
      nullableNumber(set.reps, `${setPath}.reps`, 0, 10000);
      oneOf(set.kind, `${setPath}.kind`, ['working', 'warmup']);
      boolean(set.completed, `${setPath}.completed`);
    });
  });
  const guide = record(item.guide, `${path}.guide`);
  nullableString(guide.currentExerciseId, `${path}.guide.currentExerciseId`);
  nullableString(guide.currentSetId, `${path}.guide.currentSetId`);
  if (guide.restTimer !== null) {
    const timer = record(guide.restTimer, `${path}.guide.restTimer`);
    string(timer.exerciseId, `${path}.guide.restTimer.exerciseId`, 200, true);
    string(timer.afterSetId, `${path}.guide.restTimer.afterSetId`, 200, true);
    timestamp(timer.startedAt, `${path}.guide.restTimer.startedAt`);
    timestamp(timer.endsAt, `${path}.guide.restTimer.endsAt`);
    number(timer.durationSeconds, `${path}.guide.restTimer.durationSeconds`, 0, 10000);
  }
}

function food(value: unknown, path: string): void {
  const item = record(value, path);
  string(item.id, `${path}.id`, 200, true);
  string(item.name, `${path}.name`, 200, true);
  nullableString(item.brand, `${path}.brand`);
  string(item.category, `${path}.category`, 100, true);
  string(item.preparation, `${path}.preparation`, 200);
  oneOf(item.source, `${path}.source`, ['usda', 'custom']);
  nullableString(item.sourceId, `${path}.sourceId`);
  string(item.dataVersion, `${path}.dataVersion`, 100, true);
  nutrients(item.nutrientsPer100g, `${path}.nutrientsPer100g`);
  const servings = array(item.servings, `${path}.servings`, 100);
  servings.forEach((servingValue, index) => {
    const servingPath = `${path}.servings[${index}]`;
    const serving = record(servingValue, servingPath);
    string(serving.name, `${servingPath}.name`, 100, true);
    number(serving.grams, `${servingPath}.grams`, 0.001, 100000);
  });
}

export function validateAppData(value: unknown): AppDataV2 {
  const serialized = JSON.stringify(value);
  if (!serialized || new TextEncoder().encode(serialized).length > MAX_DOCUMENT_BYTES) throw new Error('Workout data exceeds the size limit.');
  const data = record(value, 'Workout data');
  if (data.version !== 2) throw new Error(`Unsupported workout data version: ${String(data.version)}`);
  const exercises = array(data.exercises, 'exercises');
  uniqueIds(exercises, 'exercises');
  exercises.forEach((item, index) => exercise(item, `exercises[${index}]`));
  const programs = array(data.programs, 'programs');
  uniqueIds(programs, 'programs');
  programs.forEach((item, index) => program(item, `programs[${index}]`));
  const sessions = array(data.sessions, 'sessions');
  uniqueIds(sessions, 'sessions');
  sessions.forEach((item, index) => session(item, `sessions[${index}]`));
  const settings = record(data.settings, 'settings');
  oneOf(settings.weightUnit, 'settings.weightUnit', ['kg']);
  nullableString(settings.lastSelectedProgramId, 'settings.lastSelectedProgramId');
  for (const field of ['restAlertSound', 'restAlertVibration', 'keepScreenAwake']) boolean(settings[field], `settings.${field}`);
  const body = record(data.body, 'body');
  if (body.profile !== null) {
    const profile = record(body.profile, 'body.profile');
    date(profile.birthDate, 'body.profile.birthDate');
    number(profile.heightCm, 'body.profile.heightCm', 1, 300);
    oneOf(profile.equationSex, 'body.profile.equationSex', ['female', 'male']);
    oneOf(profile.activityLevel, 'body.profile.activityLevel', ['sedentary', 'light', 'moderate', 'veryActive']);
    oneOf(profile.goal, 'body.profile.goal', ['lose', 'maintain', 'gain']);
    oneOf(profile.targetMode, 'body.profile.targetMode', ['calculated', 'manual']);
  }
  const measurements = array(body.measurements, 'body.measurements');
  uniqueIds(measurements, 'body.measurements');
  measurements.forEach((value, index) => {
    const path = `body.measurements[${index}]`;
    const item = record(value, path);
    timestamp(item.recordedAt, `${path}.recordedAt`);
    number(item.weightKg, `${path}.weightKg`, 0.001, 1000);
    nullableNumber(item.bodyFatPercent, `${path}.bodyFatPercent`, 0, 100);
    for (const field of ['waistCm', 'chestCm', 'hipsCm', 'upperArmCm', 'thighCm']) nullableNumber(item[field], `${path}.${field}`, 0, 1000);
    string(item.notes, `${path}.notes`);
  });
  const nutrition = record(data.nutrition, 'nutrition');
  const targets = array(nutrition.targets, 'nutrition.targets');
  uniqueIds(targets, 'nutrition.targets');
  targets.forEach((value, index) => {
    const path = `nutrition.targets[${index}]`;
    const item = record(value, path);
    date(item.effectiveFrom, `${path}.effectiveFrom`);
    oneOf(item.mode, `${path}.mode`, ['calculated', 'manual']);
    number(item.caloriesKcal, `${path}.caloriesKcal`, 0.001);
    for (const field of ['proteinG', 'carbsG', 'fatG']) number(item[field], `${path}.${field}`);
    nullableString(item.formulaVersion, `${path}.formulaVersion`);
  });
  const customFoods = array(nutrition.customFoods, 'nutrition.customFoods');
  uniqueIds(customFoods, 'nutrition.customFoods');
  customFoods.forEach((value, index) => food(value, `nutrition.customFoods[${index}]`));
  const diary = array(nutrition.diary, 'nutrition.diary');
  uniqueIds(diary, 'nutrition.diary');
  diary.forEach((value, index) => {
    const path = `nutrition.diary[${index}]`;
    const item = record(value, path);
    date(item.localDate, `${path}.localDate`);
    oneOf(item.meal, `${path}.meal`, ['breakfast', 'lunch', 'dinner', 'snack']);
    nullableString(item.foodId, `${path}.foodId`);
    string(item.foodName, `${path}.foodName`, 200, true);
    number(item.grams, `${path}.grams`);
    string(item.servingDescription, `${path}.servingDescription`, 200);
    nutrients(item.nutrients, `${path}.nutrients`);
    oneOf(item.source, `${path}.source`, ['usda', 'custom']);
    nullableString(item.sourceId, `${path}.sourceId`);
  });
  return value as AppDataV2;
}

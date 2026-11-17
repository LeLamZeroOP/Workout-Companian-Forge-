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
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error(`${path} must be a date.`);
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

function muscleRoles(value: unknown, path: string): void {
  const roles = record(value, path);
  const direct = array(roles.direct, `${path}.direct`, muscles.size);
  const indirect = array(roles.indirect, `${path}.indirect`, muscles.size);
  if (!direct.length && !indirect.length) throw new Error(`${path} needs at least one muscle.`);
  const seen = new Set<string>();
  for (const [index, muscle] of [...direct, ...indirect].entries()) {
    if (typeof muscle !== 'string' || !muscles.has(muscle) || seen.has(muscle)) throw new Error(`${path}[${index}] has an invalid or repeated muscle.`);
    seen.add(muscle);
  }
  date(roles.reviewedAt, `${path}.reviewedAt`);
  oneOf(roles.source, `${path}.source`, ['forge-reviewed', 'user']);
}

function exerciseMetadata(item: Record<string, unknown>, path: string): void {
  if (item.muscleRoles !== undefined) muscleRoles(item.muscleRoles, `${path}.muscleRoles`);
  if (item.chestEmphasis !== undefined) oneOf(item.chestEmphasis, `${path}.chestEmphasis`, ['upper', 'mid', 'mixed']);
  if (item.aliases !== undefined) {
    const aliases = array(item.aliases, `${path}.aliases`, 20);
    const names = new Set<string>();
    aliases.forEach((alias, index) => {
      const name = string(alias, `${path}.aliases[${index}]`, 100, true).trim().toLowerCase();
      if (names.has(name)) throw new Error(`${path}.aliases has a duplicate.`);
      names.add(name);
    });
  }
  if (item.setupNotes !== undefined) string(item.setupNotes, `${path}.setupNotes`, 2000);
  if (item.unilateral !== undefined) boolean(item.unilateral, `${path}.unilateral`);
}

function nutrients(value: unknown, path: string): void {
  const item = record(value, path);
  number(item.caloriesKcal, `${path}.caloriesKcal`);
  for (const field of ['proteinG', 'carbsG', 'fatG']) nullableNumber(item[field], `${path}.${field}`);
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
  exerciseMetadata(item, path);
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
  if (item.volumePlan !== undefined) {
    const plan = record(item.volumePlan, `${path}.volumePlan`);
    oneOf(plan.goal, `${path}.volumePlan.goal`, ['hypertrophy', 'strength', 'maintenance', 'custom']);
    if (plan.cycle !== undefined) {
      const cycle = record(plan.cycle, `${path}.volumePlan.cycle`);
      const slots = array(cycle.slots, `${path}.volumePlan.cycle.slots`, 28);
      if (!slots.length || slots.length > 28 || slots.every(slot => slot === null)) throw new Error(`${path}.volumePlan.cycle needs a training day.`);
      const workoutIds = new Set(workouts.map(workout => record(workout, path).id));
      slots.forEach((slot, index) => { if (slot !== null && (typeof slot !== 'string' || !workoutIds.has(slot))) throw new Error(`${path}.volumePlan.cycle.slots[${index}] must reference this program.`); });
    }
    const targets = array(plan.targets, `${path}.volumePlan.targets`, muscles.size);
    const targetMuscles = new Set<string>();
    targets.forEach((targetValue, index) => {
      const targetPath = `${path}.volumePlan.targets[${index}]`;
      const target = record(targetValue, targetPath);
      oneOf(target.muscle, `${targetPath}.muscle`, [...muscles]);
      if (targetMuscles.has(target.muscle as string)) throw new Error(`${targetPath}.muscle is repeated.`);
      targetMuscles.add(target.muscle as string);
      number(target.lower, `${targetPath}.lower`, 0, 1000);
      number(target.upper, `${targetPath}.upper`, 0, 1000);
      if ((target.lower as number) > (target.upper as number)) throw new Error(`${targetPath} lower exceeds upper.`);
      oneOf(target.basis, `${targetPath}.basis`, ['direct', 'weighted']);
      oneOf(target.period, `${targetPath}.period`, ['cycle', 'sevenDayAverage']);
      oneOf(target.priority, `${targetPath}.priority`, ['focus', 'maintain']);
      if (target.period === 'sevenDayAverage' && plan.cycle === undefined) throw new Error(`${targetPath} needs a cycle for a seven-day target.`);
    });
  }
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
    if (entry.muscleRoles !== undefined) muscleRoles(entry.muscleRoles, `${entryPath}.muscleRoles`);
    if (entry.chestEmphasis !== undefined) oneOf(entry.chestEmphasis, `${entryPath}.chestEmphasis`, ['upper', 'mid', 'mixed']);
    number(entry.restSeconds, `${entryPath}.restSeconds`, 0, 10000);
    for (const key of ['targetRepMin', 'targetRepMax']) if (entry[key] !== undefined) number(entry[key], `${entryPath}.${key}`, 1, 10000);
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
  if (item.nutrientsPer100g !== null) nutrients(item.nutrientsPer100g, `${path}.nutrientsPer100g`);
  else if (!item.portion) throw new Error(`${path} needs a portion basis.`);
  if (item.portion !== undefined) {
    const portion = record(item.portion, `${path}.portion`);
    string(portion.name, `${path}.portion.name`, 100, true);
    nutrients(portion.nutrients, `${path}.portion.nutrients`);
    if (item.nutrientsPer100g !== null) throw new Error(`${path} must have exactly one nutrient basis.`);
  }
  if (item.favorite !== undefined) boolean(item.favorite, `${path}.favorite`);
  if (item.archived !== undefined) boolean(item.archived, `${path}.archived`);
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
  if (data.version !== 2 && data.version !== 3 && data.version !== 4) throw new Error(`Unsupported workout data version: ${String(data.version)}`);
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
    if (profile.estimateEligibilityConfirmed !== undefined) boolean(profile.estimateEligibilityConfirmed, 'body.profile.estimateEligibilityConfirmed');
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
    if (item.localDate !== undefined) date(item.localDate, `${path}.localDate`);
    if (item.entryOrder !== undefined && (!Number.isSafeInteger(item.entryOrder) || (item.entryOrder as number) < 0)) throw new Error(`${path}.entryOrder must be a non-negative safe integer.`);
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
    nullableNumber(item.grams, `${path}.grams`);
    if (item.portionQuantity !== undefined) number(item.portionQuantity, `${path}.portionQuantity`, 0.001, 100000);
    if (item.grams === null && item.portionQuantity === undefined) throw new Error(`${path} needs a portion quantity.`);
    if (item.preparation !== undefined) string(item.preparation, `${path}.preparation`, 200);
    string(item.servingDescription, `${path}.servingDescription`, 200);
    nutrients(item.nutrients, `${path}.nutrients`);
    oneOf(item.source, `${path}.source`, ['usda', 'custom']);
    nullableString(item.sourceId, `${path}.sourceId`);
  });
  if (data.mergeLedger !== undefined) {
    const ledger = record(data.mergeLedger, 'mergeLedger');
    const mappings = array(ledger.mappings, 'mergeLedger.mappings');
    const keys = new Set<string>();
    mappings.forEach((value) => {
      const item = record(value, 'merge mapping');
      const key = string(item.key, 'merge mapping key', 240, true);
      if (!/^(exercises|programs|sessions|measurements|foods|diary):/.test(key) || keys.has(key)) throw new Error('Invalid or duplicate merge mapping.');
      keys.add(key);
      string(item.sourceContent, 'merge source content', MAX_DOCUMENT_BYTES, true);
      string(item.resultContent, 'merge result content', MAX_DOCUMENT_BYTES, true);
      string(item.destinationId, 'merge destination ID', 200, true);
    });
    const receipts = array(ledger.receipts, 'mergeLedger.receipts');
    uniqueIds(receipts, 'merge receipts');
    receipts.forEach((value) => {
      const receipt = record(value, 'merge receipt');
      timestamp(receipt.at, 'merge receipt date');
      const counts = record(receipt.counts, 'merge counts');
      for (const key of ['added', 'replaced', 'copied', 'skipped', 'linked']) {
        number(counts[key], `merge counts.${key}`, 0, 100000);
        if (!Number.isInteger(counts[key])) throw new Error('Invalid merge counts.');
      }
    });
  }
  return data as unknown as AppDataV2;
}

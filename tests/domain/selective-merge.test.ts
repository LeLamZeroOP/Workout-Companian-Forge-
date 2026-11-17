import { buildMergePlan, selectableRows, type MergeSelection } from '../../src/domain/selectiveMerge';
import { canonical } from '../../src/domain/canonical';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import type { BodyMeasurement, FoodDefinition } from '../../src/domain/models';
const select = (...keys: string[]): MergeSelection => ({ keys, choices: {} });
const measurement = (id: string, weightKg = 80): BodyMeasurement => ({ id, weightKg, recordedAt: '2026-09-27T12:00:00Z', notes: '', bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null });
const food = (id: string): FoodDefinition => ({ id, name: 'Pizza slice', brand: null, category: 'Meal', preparation: 'Cooked', source: 'custom', sourceId: null, dataVersion: 'v2', nutrientsPer100g: null, portion: { name: '1 slice', nutrients: { caloriesKcal: 300, proteinG: null, carbsG: null, fatG: null, fiberG: null, sodiumMg: null } }, servings: [] });

describe('selective merge planner', () => {
  it('compares content independently of property order', () => {
    expect(canonical({ b: 1, a: { d: 2, c: 3 } })).toBe(canonical({ a: { c: 3, d: 2 }, b: 1 }));
  });
  it('does not mutate either document and empty selection is a no-op', () => {
    const source = createDefaultData(); const account = createDefaultData();
    const before = canonical(account); const sourceBefore = canonical(source);
    expect(buildMergePlan(source, account, select(), 'op').data).toEqual(account);
    expect(canonical(source)).toBe(sourceBefore); expect(canonical(account)).toBe(before);
  });
  it('adds one measurement and preserves all unselected records and singleton settings', () => {
    const source = createDefaultData(); const account = createDefaultData();
    source.body.measurements = [measurement('a'), measurement('b', 100)];
    account.body.measurements = [measurement('account')];
    const plan = buildMergePlan(source, account, select('measurements:b'), 'op');
    expect(plan.data.body.measurements).toEqual([account.body.measurements[0], { ...source.body.measurements[1], entryOrder: 1 }]);
    expect(plan.data.programs).toEqual(account.programs); expect(plan.data.settings).toEqual(account.settings);
    expect(plan.data.body.profile).toEqual(account.body.profile); expect(plan.data.nutrition).toEqual(account.nutrition);
    expect(plan.counts).toEqual({ added: 1, replaced: 0, copied: 0, skipped: 0, linked: 0 });
  });
  it('skips exact duplicates including differently ordered properties', () => {
    const source = createDefaultData(); const account = createDefaultData();
    source.programs[0] = Object.fromEntries(Object.entries(source.programs[0]!).reverse()) as typeof source.programs[number];
    const plan = buildMergePlan(source, account, select(`programs:${source.programs[0]!.id}`), 'op');
    expect(plan.data).toEqual(account); expect(plan.counts.skipped).toBe(1);
  });
  it.each(['cloud', 'local', 'copy'] as const)('handles same-ID conflicts with %s', (choice) => {
    const source = createDefaultData(); const account = createDefaultData();
    source.body.measurements = [measurement('a', 100)]; account.body.measurements = [measurement('a', 80)];
    const plan = buildMergePlan(source, account, { keys: ['measurements:a'], choices: { 'measurements:a': choice } }, 'op');
    expect(plan.data.body.measurements.map((item) => item.weightKg)).toEqual(choice === 'cloud' ? [80] : choice === 'local' ? [100] : [80, 100]);
    if (choice === 'copy') expect(plan.data.body.measurements[1]!.id).not.toBe('a');
  });
  it('persists copy mappings, skips a repeat, and reviews a changed source', () => {
    const source = createDefaultData(); const account = createDefaultData();
    source.body.measurements = [measurement('a', 100)]; account.body.measurements = [measurement('a', 80)];
    const first = buildMergePlan(source, account, { keys: ['measurements:a'], choices: { 'measurements:a': 'copy' } }, 'first');
    const second = buildMergePlan(source, JSON.parse(JSON.stringify(first.data)), { keys: ['measurements:a'], choices: { 'measurements:a': 'copy' } }, 'second');
    expect(second.counts.skipped).toBe(1); expect(second.data.body.measurements).toHaveLength(2);
    source.body.measurements[0]!.weightKg = 90;
    const changed = buildMergePlan(source, first.data, select('measurements:a'), 'third');
    expect(changed.rows[0]!.conflict).toBe(true); expect(changed.rows[0]!.action).toBe('skip');
  });
  it('does not collapse same-name foods or same-day measurements with different IDs', () => {
    const source = createDefaultData(); const account = createDefaultData();
    source.nutrition.customFoods = [food('source')]; account.nutrition.customFoods = [food('account')];
    source.body.measurements = [measurement('source')]; account.body.measurements = [measurement('account')];
    const plan = buildMergePlan(source, account, select('foods:source', 'measurements:source'), 'op');
    expect(plan.data.nutrition.customFoods).toHaveLength(2); expect(plan.data.body.measurements).toHaveLength(2);
  });
  it('copies conflicting linked exercises without changing account templates or snapshots', () => {
    const source = createDefaultData(); const account = createDefaultData();
    const program = source.programs[0]!; program.id = 'imported-program';
    const exerciseId = program.workouts[0]!.exercises[0]!.exerciseId;
    source.exercises.find((item) => item.id === exerciseId)!.name = 'My different exercise';
    const original = structuredClone(account);
    const plan = buildMergePlan(source, account, select('programs:imported-program'), 'op');
    const imported = plan.data.programs.find((item) => item.id === 'imported-program')!;
    const remappedId = imported.workouts[0]!.exercises[0]!.exerciseId;
    expect(remappedId).not.toBe(exerciseId);
    expect(plan.data.exercises.find((item) => item.id === remappedId)?.name).toBe('My different exercise');
    expect(plan.data.programs[0]).toEqual(original.programs[0]); expect(plan.data.exercises.find((item) => item.id === exerciseId)).toEqual(original.exercises.find((item) => item.id === exerciseId));
    expect(plan.counts.linked).toBeGreaterThan(0);
  });
  it('copies a program with remapped template IDs and keeps history snapshots', () => {
    const source = createDefaultData(); const account = createDefaultData();
    const program = source.programs[0]!; program.name = 'Changed';
    program.volumePlan = { goal: 'hypertrophy', targets: [], cycle: { slots: [program.workouts[0]!.id, null, program.workouts[0]!.id, program.workouts[1]!.id] } };
    const session = createSession(program, program.workouts[0]!, source.exercises, '2026-09-27T10:00:00Z'); session.completedAt = '2026-09-27T11:00:00Z';
    source.sessions = [session]; const snapshots = structuredClone(session.exercises);
    const plan = buildMergePlan(source, account, { keys: [`programs:${program.id}`, `sessions:${session.id}`], choices: { [`programs:${program.id}`]: 'copy' } }, 'op');
    const imported = plan.data.programs[1]!;
    expect(imported.workouts[0]!.id).not.toBe(program.workouts[0]!.id);
    expect(imported.volumePlan?.cycle?.slots).toEqual([imported.workouts[0]!.id, null, imported.workouts[0]!.id, imported.workouts[1]!.id]);
    expect(plan.data.sessions[0]!.programId).toBe(imported.id);
    expect(plan.data.sessions[0]!.workoutTemplateId).toBe(imported.workouts[0]!.id);
    expect(plan.data.sessions[0]!.exercises).toEqual(snapshots);
  });
  it('excludes unfinished sessions and rejects selecting them directly', () => {
    const source = createDefaultData(); const program = source.programs[0]!;
    source.sessions = [createSession(program, program.workouts[0]!, source.exercises, '2026-09-27T10:00:00Z')];
    expect(selectableRows(source).some((item) => item.category === 'sessions')).toBe(false);
    expect(() => buildMergePlan(source, createDefaultData(), select(`sessions:${source.sessions[0]!.id}`), 'op')).toThrow(/unavailable/);
  });
  it('preserves diary snapshot nutrients when importing a linked food', () => {
    const source = createDefaultData(); const account = createDefaultData(); source.nutrition.customFoods = [food('pizza')]; account.nutrition.customFoods = [{ ...food('pizza'), name: 'Different pizza' }];
    source.nutrition.diary = [{ id: 'entry', localDate: '2026-09-27', meal: 'lunch', foodId: 'pizza', foodName: 'Original pizza name', grams: null, portionQuantity: 2, servingDescription: '2 slices', nutrients: { ...food('x').portion!.nutrients, caloriesKcal: 620 }, source: 'custom', sourceId: null }];
    const plan = buildMergePlan(source, account, select('diary:entry'), 'op');
    expect(plan.data.nutrition.diary[0]!.nutrients.caloriesKcal).toBe(620);
    expect(plan.data.nutrition.diary[0]!.foodName).toBe('Original pizza name');
    expect(plan.data.nutrition.diary[0]!.foodId).not.toBe('pizza');
  });
});

it('reviews changed linked exercise definitions on a repeated program import', () => {
  const source = createDefaultData(); const account = createDefaultData();
  source.programs[0]!.id = 'new-program';
  const first = buildMergePlan(source, account, select('programs:new-program'), 'first');
  const id = source.programs[0]!.workouts[0]!.exercises[0]!.exerciseId;
  source.exercises.find((exercise) => exercise.id === id)!.name = 'Changed linked definition';
  const review = buildMergePlan(source, first.data, select('programs:new-program'), 'second');
  expect(review.rows.find((row) => row.key === 'programs:new-program')).toMatchObject({ conflict: true, action: 'skip' });
  const accepted = buildMergePlan(source, first.data, { keys: ['programs:new-program'], choices: { 'programs:new-program': 'local' } }, 'third');
  expect(accepted.data.programs.find((program) => program.id === 'new-program')!.workouts[0]!.exercises[0]!.exerciseId).not.toBe(id);
  expect(accepted.data.programs[0]).toEqual(account.programs[0]);
});

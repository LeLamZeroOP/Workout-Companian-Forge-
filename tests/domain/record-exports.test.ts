import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { bodyMeasurementsCsv, foodDiaryCsv, workoutHistoryCsv, serializeCsv } from '../../src/domain/recordExports';
import type { BodyMeasurement, FoodLogEntry } from '../../src/domain/models';

it('escapes commas, quotes and newlines and protects text from spreadsheet formulas', () => {
  expect(serializeCsv(['Name', 'Value'], [['Beans, "cooked"\nnotes', 0], ['  =HYPERLINK("bad")', null], ['@SUM(1)', 10]])).toBe('"Name","Value"\r\n"Beans, ""cooked""\nnotes","0"\r\n"\'  =HYPERLINK(""bad"")",""\r\n"\'@SUM(1)","10"\r\n');
});

it('exports completed sessions and sets with original ordinals, warmups and missing values intact', () => {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
  session.completedAt = '2026-10-08T11:00:00Z';
  const sets = session.exercises[0]!.sets;
  Object.assign(sets[1]!, { completed: true, kind: 'warmup', weightKg: 0, reps: 10 });
  Object.assign(sets[2]!, { completed: true, weightKg: null, reps: null });
  session.notes = 'Session note';
  const active = { ...session, id: 'active', completedAt: null };
  const csv = workoutHistoryCsv([active, session]);
  expect(csv).toContain('"2","warmup","0","10","0","false"');
  expect(csv).toContain('"3","working","","","","false"');
  expect(csv).toContain('"Session note"');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(3);
  expect(csv).not.toContain('"active"');
});

it('exports measurement dates and notes without converting unknowns to zero', () => {
  const measurement: BodyMeasurement = { id: 'm', recordedAt: '2026-10-07T18:00:00Z', localDate: '2026-10-08', weightKg: 80, bodyFatPercent: null, waistCm: 85, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: 'Morning' };
  const csv = bodyMeasurementsCsv([measurement]);
  expect(csv).toContain('"2026-10-08","2026-10-07T18:00:00Z","80","","85"');
  expect(csv).toContain('"Morning"');
});

it('exports portions and food nutrient snapshots exactly as recorded', () => {
  const entry: FoodLogEntry = { id: 'f', localDate: '2026-10-08', meal: 'lunch', foodId: null, foodName: 'Saved bowl', grams: null, portionQuantity: 2, servingDescription: '2 × bowls', source: 'custom', sourceId: null, nutrients: { caloriesKcal: 500, proteinG: null, carbsG: 40, fatG: 10, fiberG: 0, sodiumMg: null } };
  const csv = foodDiaryCsv([entry]);
  expect(csv).toContain('"Saved bowl","","2","2 × bowls","500","","40","10","0",""');
});

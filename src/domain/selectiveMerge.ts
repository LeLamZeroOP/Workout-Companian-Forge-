import type { AppDataV2, BodyMeasurement, ExerciseDefinition, FoodDefinition, FoodLogEntry, MergeCategory, MergeCounts, MergeMapping, Program, WorkoutSession } from './models';
import { canonical } from './canonical';
import { validateAppData } from '../data/validateAppData';

export type MergeRecord = ExerciseDefinition | Program | WorkoutSession | BodyMeasurement | FoodDefinition | FoodLogEntry;
export type MergeChoice = 'cloud' | 'local' | 'copy';
export interface MergeSelection { keys: string[]; choices: Record<string, MergeChoice> }
export interface MergeRow { key: string; category: MergeCategory; label: string; detail: string; record: MergeRecord }
export interface MergeReviewRow extends MergeRow { linked: boolean; destination: MergeRecord | null; action: 'add' | 'replace' | 'copy' | 'skip'; conflict: boolean; copyOnly: boolean }
export interface MergePlan { data: AppDataV2; rows: MergeReviewRow[]; counts: MergeCounts; sourceContent: string; accountContent: string; selection: MergeSelection; operationId: string }
export const mergeCategories: MergeCategory[] = ['programs', 'sessions', 'measurements', 'diary', 'foods', 'exercises'];
export const categoryLabels: Record<MergeCategory, string> = { programs: 'Programs', sessions: 'Completed workouts', measurements: 'Body measurements', diary: 'Food diary', foods: 'My foods', exercises: 'Custom exercises' };
export const recordKey = (category: MergeCategory, id: string) => `${category}:${id}`;
export function collection(data: AppDataV2, category: MergeCategory): MergeRecord[] {
  switch (category) {
    case 'exercises': return data.exercises;
    case 'programs': return data.programs;
    case 'sessions': return data.sessions;
    case 'measurements': return data.body.measurements;
    case 'foods': return data.nutrition.customFoods;
    case 'diary': return data.nutrition.diary;
  }
}
export function describeRecord(category: MergeCategory, record: MergeRecord): MergeRow {
  let label = ''; let detail = '';
  if (category === 'programs') { const r = record as Program; label = r.name; detail = `${r.workouts.length} workouts · ${r.updatedAt}`; }
  if (category === 'exercises') { const r = record as ExerciseDefinition; label = r.name; detail = r.equipment; }
  if (category === 'sessions') { const r = record as WorkoutSession; label = r.workoutName; detail = `${r.startedAt} · ${r.programName}`; }
  if (category === 'measurements') { const r = record as BodyMeasurement; label = `${r.weightKg} kg`; detail = r.localDate ?? r.recordedAt; }
  if (category === 'foods') { const r = record as FoodDefinition; label = r.name; detail = `${r.portion ? r.portion.name : 'Per 100 g'} · ${r.preparation}`; }
  if (category === 'diary') { const r = record as FoodLogEntry; label = r.foodName; detail = `${r.localDate} · ${r.meal} · ${r.servingDescription}`; }
  return { key: recordKey(category, record.id), category, label, detail, record };
}
export function selectableRows(source: AppDataV2): MergeRow[] {
  return mergeCategories.flatMap((category) => collection(source, category)
    .filter((record) => category !== 'sessions' || (record as WorkoutSession).completedAt !== null)
    .filter((record) => category !== 'exercises' || (record as ExerciseDefinition).isCustom)
    .map((record) => describeRecord(category, record)));
}
function replaceRecord(data: AppDataV2, category: MergeCategory, record: MergeRecord) {
  const items = collection(data, category);
  const index = items.findIndex((item) => item.id === record.id);
  if (index < 0) items.push(record); else items[index] = record;
}
function copiedRecord(record: MergeRecord, category: MergeCategory, id: string): MergeRecord {
  const copy = structuredClone(record); copy.id = id;
  if (category === 'programs') {
    const program = copy as Program;
    const workoutIds = new Map<string, string>();
    program.workouts.forEach((workout, index) => { const newId = `${id}-w${index}`; workoutIds.set(workout.id, newId); workout.id = newId; workout.exercises.forEach((exercise, exerciseIndex) => { exercise.id = `${newId}-e${exerciseIndex}`; }); });
    if (program.volumePlan?.cycle) program.volumePlan.cycle.slots = program.volumePlan.cycle.slots.map(slot => slot === null ? null : workoutIds.get(slot) ?? slot);
  }
  if (category === 'exercises') (copy as ExerciseDefinition).isCustom = true;
  return copy;
}

/** Pure, deterministic preview. No storage or network writes. Copy IDs derive from this reviewed operation. */
export function buildMergePlan(sourceValue: AppDataV2, accountValue: AppDataV2, selection: MergeSelection, operationId: string): MergePlan {
  const source = validateAppData(sourceValue); const account = validateAppData(accountValue);
  const data = structuredClone(account);
  const rows: MergeReviewRow[] = [];
  const mappings = new Map((account.mergeLedger?.mappings ?? []).map((mapping) => [mapping.key, mapping]));
  const selected = new Set(selection.keys);
  const eligible = new Set(selectableRows(source).map((row) => row.key));
  for (const key of selected) if (!eligible.has(key)) throw new Error('A selected source record is unavailable. Review the selection again.');
  const remapped = new Map<string, string>();
  let nextCopy = 0;
  const visiting = new Set<string>();

  function importRecord(category: MergeCategory, sourceId: string, linked: boolean): string {
    const key = recordKey(category, sourceId);
    const resolved = remapped.get(key);
    if (resolved) return resolved;
    if (visiting.has(key)) throw new Error('Cyclic import reference.');
    visiting.add(key);
    const original = collection(source, category).find((record) => record.id === sourceId);
    if (!original) {
      const existing = collection(account, category).find((record) => record.id === sourceId);
      if (existing) { visiting.delete(key); remapped.set(key, sourceId); return sourceId; }
      throw new Error(`Missing linked ${categoryLabels[category].toLowerCase()} record. Import its definition in the same backup.`);
    }
    const dependencies = category === 'programs'
      ? [...new Set((original as Program).workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.exerciseId)))].sort().map((id) => source.exercises.find((exercise) => exercise.id === id) ?? null)
      : [];
    const sourceContent = dependencies.length ? canonical({ record: original, dependencies }) : canonical(original);
    const dependenciesEquivalent = dependencies.every((definition) => {
      if (!definition) return false;
      const mapping = mappings.get(recordKey('exercises', definition.id));
      const existing = account.exercises.find((exercise) => exercise.id === (mapping?.destinationId ?? definition.id));
      return existing && (canonical(existing) === canonical(definition) || (mapping?.sourceContent === canonical(definition) && mapping.resultContent === canonical(existing)));
    });
    const previous = mappings.get(key);
    const destinationId = previous?.destinationId ?? sourceId;
    const destination = collection(account, category).find((record) => record.id === destinationId) ?? null;
    const duplicate = destination !== null && dependenciesEquivalent && (canonical(destination) === canonical(original) || (previous?.sourceContent === sourceContent && previous.resultContent === canonical(destination)));
    const conflict = Boolean(destination && !duplicate);
    // A definition replacement could affect unselected account templates. Use an imported copy.
    const copyOnly = category === 'exercises' || category === 'foods';
    const choice = selection.choices[key] ?? (linked && conflict && copyOnly ? 'copy' : 'cloud');
    const action = duplicate ? 'skip' : !destination ? 'add' : choice === 'cloud' ? 'skip' : choice === 'copy' || copyOnly ? 'copy' : 'replace';
    let record = structuredClone(original);
    let id = destinationId;
    if (action === 'copy') { id = `merge-${operationId}-${nextCopy++}`; record = copiedRecord(record, category, id); }
    else record.id = id;
    remapped.set(key, id);
    if (action !== 'skip') {
      if (category === 'programs') {
        for (const workout of (record as Program).workouts) for (const exercise of workout.exercises) exercise.exerciseId = importRecord('exercises', exercise.exerciseId, !selected.has(recordKey('exercises', exercise.exerciseId)));
      }
      if (category === 'sessions') {
        const session = record as WorkoutSession;
        if (session.completedAt === null) throw new Error('Unfinished sessions cannot be merged.');
        // The history snapshot is complete. Definitions are linked when available; no snapshot fields are rewritten.
        for (const exercise of session.exercises) if (source.exercises.some((item) => item.id === exercise.exerciseId)) exercise.exerciseId = importRecord('exercises', exercise.exerciseId, !selected.has(recordKey('exercises', exercise.exerciseId)));
        if (session.programId && selected.has(recordKey('programs', session.programId))) {
          const originalProgram = source.programs.find((item) => item.id === session.programId);
          const workoutIndex = originalProgram?.workouts.findIndex((item) => item.id === session.workoutTemplateId) ?? -1;
          session.programId = importRecord('programs', session.programId, false);
          const mergedProgram = data.programs.find((item) => item.id === session.programId);
          const programDecision = rows.find((row) => row.key === recordKey('programs', originalProgram!.id));
          session.workoutTemplateId = programDecision?.action === 'skip' && programDecision.conflict
            ? mergedProgram?.workouts.find((workout) => workout.id === session.workoutTemplateId)?.id ?? null
            : workoutIndex >= 0 ? mergedProgram?.workouts[workoutIndex]?.id ?? null : null;
        } else if (session.programId && !account.programs.some((item) => item.id === session.programId)) { session.programId = null; session.workoutTemplateId = null; }
      }
      if (category === 'diary') {
        const entry = record as FoodLogEntry;
        if (entry.foodId && entry.source === 'custom' && source.nutrition.customFoods.some((food) => food.id === entry.foodId)) entry.foodId = importRecord('foods', entry.foodId, !selected.has(recordKey('foods', entry.foodId)));
      }
      if (category === 'measurements') {
        // Capture legacy ordinals before inserting alongside another document.
        (record as BodyMeasurement).entryOrder ??= source.body.measurements.findIndex((entry) => entry.id === sourceId);
      }
      replaceRecord(data, category, record);
      mappings.set(key, { key, sourceContent, destinationId: id, resultContent: canonical(record) } satisfies MergeMapping);
    }
    const description = describeRecord(category, original);
    if (destination && !dependenciesEquivalent) description.detail += ' · Linked exercise definitions differ; review the program before importing them.';
    rows.push({ ...description, linked, destination, action, conflict, copyOnly });
    visiting.delete(key);
    return id;
  }
  for (const category of ['exercises', 'foods', 'programs', 'sessions', 'measurements', 'diary'] as MergeCategory[]) {
    for (const record of collection(source, category)) if (selected.has(recordKey(category, record.id))) importRecord(category, record.id, false);
  }
  const counts: MergeCounts = { added: 0, replaced: 0, copied: 0, skipped: 0, linked: 0 };
  for (const row of rows) { if (row.linked) counts.linked++; counts[row.action === 'add' ? 'added' : row.action === 'copy' ? 'copied' : row.action === 'replace' ? 'replaced' : 'skipped']++; }
  if (counts.added + counts.replaced + counts.copied > 0) data.mergeLedger = { mappings: [...mappings.values()], receipts: account.mergeLedger?.receipts ?? [] };
  return { data: validateAppData(data), rows, counts, selection: structuredClone(selection), operationId, sourceContent: canonical(source), accountContent: canonical(account) };
}

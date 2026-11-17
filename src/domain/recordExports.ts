import type { BodyMeasurement, FoodLogEntry, WorkoutSession } from './models';
import { countedSet, validSetValues } from './trainingMetrics';
import { localDateString } from './calendar';

type CsvValue = string | number | boolean | null | undefined;

function csvCell(value: CsvValue): string {
  let text = value == null ? '' : String(value);
  // Spreadsheet readers may execute a formula even when the CSV field is quoted.
  if (typeof value === 'string' && (/^[\s\uFEFF]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export function serializeCsv(headers: string[], rows: CsvValue[][]): string {
  return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function workoutHistoryCsv(sessions: WorkoutSession[]): string {
  const rows: CsvValue[][] = [];
  for (const session of sessions) {
    if (!session.completedAt) continue;
    for (const exercise of session.exercises) {
      exercise.sets.forEach((set, index) => {
        if (!set.completed) return;
        rows.push([
          session.id, localDateString(new Date(session.completedAt!)), session.startedAt, session.completedAt,
          session.programName, session.workoutName, exercise.exerciseId, exercise.exerciseName,
          index + 1, set.kind, set.weightKg, set.reps, validSetValues(set) ? set.weightKg * set.reps : null,
          countedSet(set), exercise.id, set.id, session.notes, exercise.notes,
        ]);
      });
    }
  }
  return serializeCsv(['session_id', 'local_date', 'started_at', 'completed_at', 'program', 'workout', 'exercise_id', 'exercise', 'set_number', 'set_type', 'weight_kg', 'reps', 'volume_kg', 'counts_as_working_set', 'exercise_instance_id', 'set_id', 'session_notes', 'exercise_notes'], rows);
}

export function bodyMeasurementsCsv(entries: BodyMeasurement[]): string {
  return serializeCsv(['measurement_id', 'local_date', 'recorded_at', 'weight_kg', 'body_fat_percent', 'waist_cm', 'chest_cm', 'hips_cm', 'upper_arm_cm', 'thigh_cm', 'notes'], entries.map(entry => [
    entry.id, entry.localDate ?? localDateString(new Date(entry.recordedAt)), entry.recordedAt,
    entry.weightKg, entry.bodyFatPercent, entry.waistCm, entry.chestCm, entry.hipsCm, entry.upperArmCm, entry.thighCm, entry.notes,
  ]));
}

export function foodDiaryCsv(entries: FoodLogEntry[]): string {
  return serializeCsv(['entry_id', 'local_date', 'meal', 'food_id', 'food', 'grams', 'portion_quantity', 'serving', 'calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'sodium_mg', 'source', 'source_id'], entries.map(entry => [
    entry.id, entry.localDate, entry.meal, entry.foodId, entry.foodName, entry.grams, entry.portionQuantity, entry.servingDescription,
    entry.nutrients.caloriesKcal, entry.nutrients.proteinG, entry.nutrients.carbsG, entry.nutrients.fatG, entry.nutrients.fiberG, entry.nutrients.sodiumMg, entry.source, entry.sourceId,
  ]));
}

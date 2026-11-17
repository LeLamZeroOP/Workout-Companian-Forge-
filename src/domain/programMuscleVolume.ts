import type { ExerciseDefinition, MuscleGroup, MuscleSetTarget, Program } from './models';
import { muscleGroups } from './muscleSets';

export interface MuscleVolumeRow {
  muscle: MuscleGroup;
  directSets: number | null;
  indirectSets: number | null;
  weightedSets: number;
  directSessions: number | null;
}

export interface VolumeSummary {
  periodDays: number | null;
  performedSets: number;
  rows: MuscleVolumeRow[];
  workouts: Array<{ slot: number; workoutId: string; rows: MuscleVolumeRow[] }>;
  unknownExerciseIds: string[];
  missingDefinitionIds: string[];
}

function emptyRows(): MuscleVolumeRow[] {
  return muscleGroups.map(muscle => ({ muscle, directSets: 0, indirectSets: 0, weightedSets: 0, directSessions: 0 }));
}

export function summarizeProgramVolume(program: Program, exercises: ExerciseDefinition[]): VolumeSummary {
  const definitions = new Map(exercises.map(exercise => [exercise.id, exercise]));
  const workouts = new Map(program.workouts.map(workout => [workout.id, workout]));
  const slots = program.volumePlan?.cycle?.slots ?? program.workouts.map(workout => workout.id);
  const rows = emptyRows();
  const unknown = new Set<string>();
  const missing = new Set<string>();
  const detail: VolumeSummary['workouts'] = [];
  let performedSets = 0;
  for (const [slot, workoutId] of slots.entries()) {
    if (workoutId === null) continue;
    const workout = workouts.get(workoutId);
    if (!workout) continue;
    const slotRows = emptyRows();
    const directlyTrained = new Set<MuscleGroup>();
    for (const prescription of workout.exercises) {
      const sets = prescription.targetSets;
      performedSets += sets;
      const definition = definitions.get(prescription.exerciseId);
      if (!definition) { missing.add(prescription.exerciseId); unknown.add(prescription.exerciseId); continue; }
      for (const muscle of muscleGroups) {
        const contribution = definition.muscleContribution[muscle] ?? 0;
        rows.find(row => row.muscle === muscle)!.weightedSets += sets * contribution;
        slotRows.find(row => row.muscle === muscle)!.weightedSets += sets * contribution;
      }
      if (!definition.muscleRoles) { unknown.add(definition.id); continue; }
      for (const muscle of definition.muscleRoles.direct) {
        rows.find(row => row.muscle === muscle)!.directSets! += sets;
        slotRows.find(row => row.muscle === muscle)!.directSets! += sets;
        directlyTrained.add(muscle);
      }
      for (const muscle of definition.muscleRoles.indirect) {
        rows.find(row => row.muscle === muscle)!.indirectSets! += sets;
        slotRows.find(row => row.muscle === muscle)!.indirectSets! += sets;
      }
    }
    for (const muscle of directlyTrained) {
      rows.find(row => row.muscle === muscle)!.directSessions! += 1;
      slotRows.find(row => row.muscle === muscle)!.directSessions! += 1;
    }
    detail.push({ slot, workoutId, rows: slotRows });
  }
  if (unknown.size) for (const row of rows) { row.directSets = null; row.indirectSets = null; row.directSessions = null; }
  return { periodDays: program.volumePlan?.cycle?.slots.length ?? null, performedSets, rows, workouts: detail, unknownExerciseIds: [...unknown], missingDefinitionIds: [...missing] };
}

export function normalizeVolume(summary: VolumeSummary): VolumeSummary | null {
  if (summary.periodDays === null) return null;
  const factor = 7 / summary.periodDays;
  return {
    ...summary,
    periodDays: 7,
    performedSets: summary.performedSets * factor,
    rows: summary.rows.map(row => ({
      ...row,
      directSets: row.directSets === null ? null : row.directSets * factor,
      indirectSets: row.indirectSets === null ? null : row.indirectSets * factor,
      weightedSets: row.weightedSets * factor,
      directSessions: row.directSessions === null ? null : row.directSessions * factor,
    })),
  };
}

export function compareMuscleTarget(value: number | null, target: MuscleSetTarget | undefined): 'no-target' | 'unknown' | 'below' | 'within' | 'above' {
  if (!target) return 'no-target';
  if (value === null || !Number.isFinite(value)) return 'unknown';
  if (value < target.lower) return 'below';
  if (value > target.upper) return 'above';
  return 'within';
}

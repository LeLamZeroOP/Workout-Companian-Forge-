import { createDefaultData } from '../data/defaults';
import { availableExercises } from './exerciseCatalog';
import type { AppDataV2, ExerciseDefinition, Program } from './models';

/**
 * A shareable Forge document holding one program and the exercise definitions it uses.
 * It has no history, body, or nutrition records and no account settings, so it can be
 * added to another account with Settings → Merge selected data.
 */
export function buildProgramExport(program: Program, savedExercises: ExerciseDefinition[]): AppDataV2 {
  const referenced = new Set(program.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.exerciseId)));
  const exercises = availableExercises(savedExercises).filter(exercise => referenced.has(exercise.id)).map(exercise => structuredClone(exercise));
  const missing = [...referenced].filter(id => !exercises.some(exercise => exercise.id === id));
  if (missing.length) throw new Error('This program uses an exercise that is no longer in your library. Edit the program before exporting.');
  const base = createDefaultData();
  return {
    version: 4, exercises, programs: [structuredClone(program)], sessions: [],
    settings: { ...base.settings, lastSelectedProgramId: program.id },
    body: { profile: null, measurements: [] },
    nutrition: { targets: [], customFoods: [], diary: [] },
  };
}

export function programExportFileName(program: Program, localDate: string): string {
  const slug = program.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'program';
  return `forge-split-${slug}-${localDate}.forge.json`;
}

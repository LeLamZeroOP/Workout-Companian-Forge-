import type { ExerciseDefinition, MuscleGroup, Program } from './models';
import { expandedExercises } from './expandedExercises';

// Effective-set weights are editable tracking estimates, not physiological measurements.
const baseExercises: ExerciseDefinition[] = [
  {
    "id": "db-chest-press",
    "name": "Dumbbell Chest Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "isCustom": false
  },
  {
    "id": "lat-pulldown",
    "name": "Lat Pulldown",
    "equipment": "cable",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.25
    },
    "isCustom": false
  },
  {
    "id": "leg-press",
    "name": "Leg Press",
    "equipment": "machine",
    "muscleContribution": {
      "quads": 1,
      "glutes": 0.5,
      "hamstrings": 0.25
    },
    "isCustom": false
  },
  {
    "id": "bench-press",
    "name": "Barbell Bench Press",
    "equipment": "barbell",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.5
    },
    "isCustom": false
  },
  {
    "id": "incline-db-press",
    "name": "Incline Dumbbell Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "chest": 1,
      "frontDelts": 0.5,
      "triceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "machine-chest-press",
    "name": "Machine Chest Press",
    "equipment": "machine",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.25
    },
    "isCustom": false
  },
  {
    "id": "cable-fly",
    "name": "Cable Fly",
    "equipment": "cable",
    "muscleContribution": {
      "chest": 1
    },
    "isCustom": false
  },
  {
    "id": "pec-deck",
    "name": "Pec Deck",
    "equipment": "machine",
    "muscleContribution": {
      "chest": 1
    },
    "isCustom": false
  },
  {
    "id": "push-up",
    "name": "Push-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "chest": 1,
      "triceps": 0.5,
      "frontDelts": 0.25
    },
    "isCustom": false
  },
  {
    "id": "pull-up",
    "name": "Pull-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.5,
      "upperBack": 0.25
    },
    "isCustom": false
  },
  {
    "id": "chin-up",
    "name": "Chin-up",
    "equipment": "bodyweight",
    "muscleContribution": {
      "lats": 1,
      "biceps": 0.75
    },
    "isCustom": false
  },
  {
    "id": "seated-cable-row",
    "name": "Seated Cable Row",
    "equipment": "cable",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 0.5,
      "biceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "db-row",
    "name": "One-arm Dumbbell Row",
    "equipment": "dumbbell",
    "muscleContribution": {
      "lats": 1,
      "upperBack": 0.5,
      "biceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "barbell-row",
    "name": "Barbell Row",
    "equipment": "barbell",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 0.5,
      "biceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "chest-supported-row",
    "name": "Chest-supported Dumbbell Row",
    "equipment": "dumbbell",
    "muscleContribution": {
      "upperBack": 1,
      "lats": 0.5,
      "biceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "straight-arm-pulldown",
    "name": "Straight-arm Pulldown",
    "equipment": "cable",
    "muscleContribution": {
      "lats": 1
    },
    "isCustom": false
  },
  {
    "id": "overhead-press",
    "name": "Barbell Overhead Press",
    "equipment": "barbell",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "db-shoulder-press",
    "name": "Dumbbell Shoulder Press",
    "equipment": "dumbbell",
    "muscleContribution": {
      "frontDelts": 1,
      "sideDelts": 0.5,
      "triceps": 0.5
    },
    "isCustom": false
  },
  {
    "id": "lateral-raise",
    "name": "Dumbbell Lateral Raise",
    "equipment": "dumbbell",
    "muscleContribution": {
      "sideDelts": 1
    },
    "isCustom": false
  },
  {
    "id": "cable-lateral-raise",
    "name": "Cable Lateral Raise",
    "equipment": "cable",
    "muscleContribution": {
      "sideDelts": 1
    },
    "isCustom": false
  },
  {
    "id": "reverse-pec-deck",
    "name": "Reverse Pec Deck",
    "equipment": "machine",
    "muscleContribution": {
      "rearDelts": 1,
      "upperBack": 0.5
    },
    "isCustom": false
  },
  {
    "id": "face-pull",
    "name": "Face Pull",
    "equipment": "cable",
    "muscleContribution": {
      "rearDelts": 1,
      "upperBack": 0.5
    },
    "isCustom": false
  },
  {
    "id": "db-curl",
    "name": "Dumbbell Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "isCustom": false
  },
  {
    "id": "hammer-curl",
    "name": "Hammer Curl",
    "equipment": "dumbbell",
    "muscleContribution": {
      "biceps": 1
    },
    "isCustom": false
  },
  {
    "id": "cable-curl",
    "name": "Cable Curl",
    "equipment": "cable",
    "muscleContribution": {
      "biceps": 1
    },
    "isCustom": false
  },
  {
    "id": "preacher-curl",
    "name": "Machine Preacher Curl",
    "equipment": "machine",
    "muscleContribution": {
      "biceps": 1
    },
    "isCustom": false
  },
  {
    "id": "triceps-pushdown",
    "name": "Triceps Pushdown",
    "equipment": "cable",
    "muscleContribution": {
      "triceps": 1
    },
    "isCustom": false
  },
  {
    "id": "overhead-triceps",
    "name": "Overhead Cable Triceps Extension",
    "equipment": "cable",
    "muscleContribution": {
      "triceps": 1
    },
    "isCustom": false
  },
  {
    "id": "squat",
    "name": "Barbell Back Squat",
    "equipment": "barbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 0.5
    },
    "isCustom": false
  },
  {
    "id": "goblet-squat",
    "name": "Goblet Squat",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 0.5
    },
    "isCustom": false
  },
  {
    "id": "hack-squat",
    "name": "Hack Squat",
    "equipment": "machine",
    "muscleContribution": {
      "quads": 1,
      "glutes": 0.5
    },
    "isCustom": false
  },
  {
    "id": "rdl",
    "name": "Romanian Deadlift",
    "equipment": "barbell",
    "muscleContribution": {
      "hamstrings": 1,
      "glutes": 0.75
    },
    "isCustom": false
  },
  {
    "id": "db-rdl",
    "name": "Dumbbell Romanian Deadlift",
    "equipment": "dumbbell",
    "muscleContribution": {
      "hamstrings": 1,
      "glutes": 0.75
    },
    "isCustom": false
  },
  {
    "id": "bulgarian-split-squat",
    "name": "Bulgarian Split Squat",
    "equipment": "dumbbell",
    "muscleContribution": {
      "quads": 1,
      "glutes": 0.75
    },
    "isCustom": false
  },
  {
    "id": "leg-extension",
    "name": "Leg Extension",
    "equipment": "machine",
    "muscleContribution": {
      "quads": 1
    },
    "isCustom": false
  },
  {
    "id": "seated-leg-curl",
    "name": "Seated Leg Curl",
    "equipment": "machine",
    "muscleContribution": {
      "hamstrings": 1
    },
    "isCustom": false
  },
  {
    "id": "hip-thrust",
    "name": "Barbell Hip Thrust",
    "equipment": "barbell",
    "muscleContribution": {
      "glutes": 1
    },
    "isCustom": false
  },
  {
    "id": "calf-raise",
    "name": "Standing Calf Raise",
    "equipment": "machine",
    "muscleContribution": {
      "calves": 1
    },
    "isCustom": false
  },
  {
    "id": "cable-crunch",
    "name": "Cable Crunch",
    "equipment": "cable",
    "muscleContribution": {
      "abs": 1
    },
    "isCustom": false
  },
  {
    "id": "hanging-knee-raise",
    "name": "Hanging Knee Raise",
    "equipment": "bodyweight",
    "muscleContribution": {
      "abs": 1
    },
    "isCustom": false
  }
];

// Independently reviewed movement roles. These are classifications, not a conversion
// from effective-set coefficients; saved user definitions are never backfilled.
const reviewedRoles: Record<string, { direct: MuscleGroup[]; indirect: MuscleGroup[] }> = {
  'db-chest-press': { direct: ['chest'], indirect: ['triceps', 'frontDelts'] },
  'lat-pulldown': { direct: ['lats'], indirect: ['biceps', 'upperBack'] },
  'leg-press': { direct: ['quads'], indirect: ['glutes'] },
  'bench-press': { direct: ['chest'], indirect: ['triceps', 'frontDelts'] },
  'incline-db-press': { direct: ['chest'], indirect: ['frontDelts', 'triceps'] },
  'machine-chest-press': { direct: ['chest'], indirect: ['triceps', 'frontDelts'] },
  'cable-fly': { direct: ['chest'], indirect: [] },
  'pec-deck': { direct: ['chest'], indirect: [] },
  'push-up': { direct: ['chest'], indirect: ['triceps', 'frontDelts'] },
  'pull-up': { direct: ['lats'], indirect: ['biceps', 'upperBack'] },
  'chin-up': { direct: ['lats'], indirect: ['biceps'] },
  'seated-cable-row': { direct: ['upperBack'], indirect: ['lats', 'biceps'] },
  'db-row': { direct: ['lats'], indirect: ['upperBack', 'biceps'] },
  'barbell-row': { direct: ['upperBack'], indirect: ['lats', 'biceps'] },
  'chest-supported-row': { direct: ['upperBack'], indirect: ['lats', 'biceps'] },
  'straight-arm-pulldown': { direct: ['lats'], indirect: [] },
  'overhead-press': { direct: ['frontDelts'], indirect: ['sideDelts', 'triceps'] },
  'db-shoulder-press': { direct: ['frontDelts'], indirect: ['sideDelts', 'triceps'] },
  'lateral-raise': { direct: ['sideDelts'], indirect: [] },
  'cable-lateral-raise': { direct: ['sideDelts'], indirect: [] },
  'reverse-pec-deck': { direct: ['rearDelts'], indirect: ['upperBack'] },
  'face-pull': { direct: ['rearDelts'], indirect: ['upperBack'] },
  'db-curl': { direct: ['biceps'], indirect: [] },
  'hammer-curl': { direct: ['biceps'], indirect: [] },
  'cable-curl': { direct: ['biceps'], indirect: [] },
  'preacher-curl': { direct: ['biceps'], indirect: [] },
  'triceps-pushdown': { direct: ['triceps'], indirect: [] },
  'overhead-triceps': { direct: ['triceps'], indirect: [] },
  'squat': { direct: ['quads'], indirect: ['glutes'] },
  'goblet-squat': { direct: ['quads'], indirect: ['glutes'] },
  'hack-squat': { direct: ['quads'], indirect: ['glutes'] },
  'rdl': { direct: ['hamstrings'], indirect: ['glutes'] },
  'db-rdl': { direct: ['hamstrings'], indirect: ['glutes'] },
  'bulgarian-split-squat': { direct: ['quads'], indirect: ['glutes'] },
  'leg-extension': { direct: ['quads'], indirect: [] },
  'seated-leg-curl': { direct: ['hamstrings'], indirect: [] },
  'hip-thrust': { direct: ['glutes'], indirect: [] },
  'calf-raise': { direct: ['calves'], indirect: [] },
  'cable-crunch': { direct: ['abs'], indirect: [] },
  'hanging-knee-raise': { direct: ['abs'], indirect: [] },
};

const chestEmphasisById: Record<string, 'upper' | 'mid' | 'mixed'> = {
  'db-chest-press': 'mid', 'bench-press': 'mid', 'incline-db-press': 'upper',
  'machine-chest-press': 'mixed', 'cable-fly': 'mixed', 'pec-deck': 'mid', 'push-up': 'mixed',
};

function extra(id: string, name: string, equipment: ExerciseDefinition['equipment'], direct: MuscleGroup[], indirect: MuscleGroup[], muscleContribution: ExerciseDefinition['muscleContribution'], chestEmphasis?: ExerciseDefinition['chestEmphasis'], setupNotes = '', unilateral = false): ExerciseDefinition {
  return { id, name, equipment, muscleContribution, isCustom: false,
    muscleRoles: { direct, indirect, reviewedAt: '2026-09-30', source: 'forge-reviewed' },
    ...(chestEmphasis ? { chestEmphasis } : {}), ...(setupNotes ? { setupNotes } : {}), ...(unilateral ? { unilateral } : {}) };
}

const additionalExercises: ExerciseDefinition[] = [
  extra('db-press-15', '15-degree Dumbbell Chest Press', 'dumbbell', ['chest'], ['frontDelts', 'triceps'], { chest: 1, frontDelts: 0.5, triceps: 0.5 }, 'upper', 'Set bench to about 15 degrees; record the angle you actually use.'),
  extra('db-press-30', '30-degree Dumbbell Incline Press', 'dumbbell', ['chest'], ['frontDelts', 'triceps'], { chest: 1, frontDelts: 0.5, triceps: 0.5 }, 'upper'),
  extra('incline-barbell-press', 'Incline Barbell Bench Press', 'barbell', ['chest'], ['frontDelts', 'triceps'], { chest: 1, frontDelts: 0.5, triceps: 0.5 }, 'upper'),
  extra('smith-incline-press', 'Smith Machine Incline Press', 'machine', ['chest'], ['frontDelts', 'triceps'], { chest: 1, frontDelts: 0.5, triceps: 0.5 }, 'upper', 'Record bench angle and Smith machine load convention.'),
  extra('incline-converging-press', 'Incline Converging Machine Press', 'machine', ['chest'], ['frontDelts', 'triceps'], { chest: 1, frontDelts: 0.5, triceps: 0.5 }, 'upper'),
  extra('low-high-cable-fly', 'Low-to-high Cable Fly', 'cable', ['chest'], [], { chest: 1 }, 'upper'),
  extra('smith-flat-press', 'Flat Smith Machine Chest Press', 'machine', ['chest'], ['triceps', 'frontDelts'], { chest: 1, triceps: 0.5, frontDelts: 0.5 }, 'mid'),
  extra('flat-db-fly', 'Flat Dumbbell Fly', 'dumbbell', ['chest'], [], { chest: 1 }, 'mid'),
  extra('standing-cable-chest-press', 'Standing Cable Chest Press', 'cable', ['chest'], ['triceps', 'frontDelts'], { chest: 1, triceps: 0.5, frontDelts: 0.25 }, 'mixed'),
  extra('single-arm-cable-chest-press', 'Single-arm Cable Chest Press', 'cable', ['chest'], ['triceps', 'frontDelts'], { chest: 1, triceps: 0.5, frontDelts: 0.25 }, 'mixed', 'Log reps and load per side; do not double set counts.', true),
  extra('chest-dip', 'Chest-focused Dip', 'bodyweight', ['chest'], ['triceps', 'frontDelts'], { chest: 1, triceps: 0.5, frontDelts: 0.25 }, 'mixed', 'Log added external weight only; use 0 kg for bodyweight.'),
  extra('feet-elevated-push-up', 'Feet-elevated Push-up', 'bodyweight', ['chest'], ['triceps', 'frontDelts'], { chest: 1, triceps: 0.5, frontDelts: 0.25 }, 'mixed', 'Log added external weight only; record foot height.'),
  extra('neutral-grip-lat-pulldown', 'Neutral-grip Lat Pulldown', 'cable', ['lats'], ['biceps', 'upperBack'], { lats: 1, biceps: 0.5, upperBack: 0.25 }),
  extra('machine-shoulder-press', 'Machine Shoulder Press', 'machine', ['frontDelts'], ['sideDelts', 'triceps'], { frontDelts: 1, sideDelts: 0.5, triceps: 0.5 }),
  extra('machine-row', 'Machine Row', 'machine', ['upperBack'], ['lats', 'biceps'], { upperBack: 1, lats: 0.5, biceps: 0.5 }),
  extra('smith-jm-press', 'Smith JM Press', 'machine', ['triceps'], ['chest', 'frontDelts'], { triceps: 1, chest: 0.25, frontDelts: 0.25 }, undefined, 'Record bar path and load convention.'),
  extra('lying-leg-curl', 'Lying Leg Curl', 'machine', ['hamstrings'], [], { hamstrings: 1 }),
];

export const commonExercises: ExerciseDefinition[] = [...baseExercises.map(exercise => ({
  ...exercise,
  muscleRoles: { ...reviewedRoles[exercise.id]!, reviewedAt: '2026-09-30', source: 'forge-reviewed' as const },
  ...(chestEmphasisById[exercise.id] ? { chestEmphasis: chestEmphasisById[exercise.id] } : {}),
})), ...additionalExercises, ...expandedExercises];

export function availableExercises(saved: ExerciseDefinition[]): ExerciseDefinition[] {
  const ids = new Set(saved.map(exercise => exercise.id));
  return [...saved, ...commonExercises.filter(exercise => !ids.has(exercise.id)).map(exercise => structuredClone(exercise))];
}

// Add only referenced built-ins in the same mutation as the program. Saved overrides win.
export function exercisesForProgram(saved: ExerciseDefinition[], program: Program): ExerciseDefinition[] {
  const referenced = new Set(program.workouts.flatMap(workout => workout.exercises.map(exercise => exercise.exerciseId)));
  return availableExercises(saved).filter(exercise => saved.some(item => item.id === exercise.id) || referenced.has(exercise.id));
}

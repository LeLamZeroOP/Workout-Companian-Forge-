import { commonExercises, availableExercises } from '../../src/domain/exerciseCatalog';
import { trainingTemplates, createTemplateProgram } from '../../src/data/trainingTemplates';
import { createDefaultData } from '../../src/data/defaults';
import { applyMutation } from '../../src/domain/appMutations';
import { validateAppData } from '../../src/data/validateAppData';
import { validateProgram } from '../../src/domain/workout';

it('keeps all 200 definitions valid and independent of saved user data', () => {
  const data = createDefaultData();
  expect(() => validateAppData(data)).not.toThrow();
  expect(new Set(commonExercises.map(item => item.name.toLowerCase())).size).toBe(200);
  for (const exercise of commonExercises) {
    expect(exercise.isCustom).toBe(false);
    expect([...(exercise.muscleRoles?.direct ?? []), ...(exercise.muscleRoles?.indirect ?? [])].length).toBeGreaterThan(0);
    expect(Object.values(exercise.muscleContribution).some(amount => amount! > 0)).toBe(true);
  }
  const saved = structuredClone(commonExercises.find(item => item.id === 'dead-bug')!);
  saved.name = 'My dead bug'; saved.muscleContribution = { abs: 0.75 };
  const catalog = availableExercises([saved]);
  expect(catalog).toHaveLength(200);
  expect(catalog.find(item => item.id === saved.id)).toEqual(saved);
  catalog.find(item => item.id === 'front-squat')!.muscleContribution.quads = 0.1;
  expect(commonExercises.find(item => item.id === 'front-squat')!.muscleContribution.quads).toBe(1);
});

it('saves a newly added movement with a program for an existing account', () => {
  const data = createDefaultData(); data.exercises = data.exercises.slice(0, 3);
  const program = structuredClone(data.programs[0]!);
  program.workouts[0]!.exercises[0]!.exerciseId = 'dead-bug';
  const result = applyMutation(data, { kind: 'saveProgram', program });
  expect(result.exercises.find(item => item.id === 'dead-bug')).toEqual(commonExercises.find(item => item.id === 'dead-bug'));
  expect(validateProgram(program, result.exercises)).toEqual({});
  expect(result.sessions).toEqual(data.sessions);
  expect(data.exercises).toHaveLength(3);
});

it('provides valid, independent editable programs with resolved exercise references', () => {
  expect(commonExercises).toHaveLength(200);
  expect(new Set(commonExercises.map(item => item.id)).size).toBe(200);
  for (const template of trainingTemplates) {
    const program = createTemplateProgram(template); const second = createTemplateProgram(template);
    expect(validateProgram(program, commonExercises)).toEqual({});
    expect(program.id).not.toBe(second.id);
    expect(program.workouts[0]!.id).not.toBe(second.workouts[0]!.id);
    expect(program.workouts[0]!.exercises[0]!.id).not.toBe(second.workouts[0]!.exercises[0]!.id);
    program.workouts[0]!.exercises[0]!.targetSets = 9;
    expect(second.workouts[0]!.exercises[0]!.targetSets).not.toBe(9);
  }
});

it('adds required built-ins atomically for existing accounts without overwriting saved mappings', () => {
  const data = createDefaultData(); data.exercises = data.exercises.slice(0,3);
  data.exercises[0]!.muscleContribution = { chest: .75 };
  const original = structuredClone(data);
  const program = createTemplateProgram(trainingTemplates[0]!);
  const result = applyMutation(data, { kind: 'saveProgram', program });
  expect(() => validateAppData(result)).not.toThrow();
  expect(result.exercises.find(item => item.id === 'db-chest-press')!.muscleContribution).toEqual({ chest: .75 });
  for (const exercise of program.workouts.flatMap(day => day.exercises)) expect(result.exercises.some(item => item.id === exercise.exerciseId)).toBe(true);
  expect(applyMutation(result, { kind: 'saveProgram', program }).exercises).toEqual(result.exercises);
  expect(data).toEqual(original);
  expect(availableExercises(data.exercises)).toHaveLength(200);
});

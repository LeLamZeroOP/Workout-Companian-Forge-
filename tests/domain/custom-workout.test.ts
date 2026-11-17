import { createDefaultData } from '../../src/data/defaults';
import { validateAppData } from '../../src/data/validateAppData';
import { applyMutation } from '../../src/domain/appMutations';
import { createCustomSession, createSession } from '../../src/domain/workout';

it('creates a standalone snapshot and preserves programs and the selected program', () => {
  const data = createDefaultData();
  const workout = { ...data.programs[0]!.workouts[0]!, name: '  Lunch session  ' };
  const session = createCustomSession(workout, data.exercises, '2026-10-29T05:00:00Z');
  expect(session).toMatchObject({ programId: null, workoutTemplateId: null, programName: 'Custom workout', workoutName: 'Lunch session', completedAt: null });
  expect(session.guide.currentExerciseId).toBe(session.exercises[0]!.id);
  const mutation = { kind: 'startWorkout' as const, session, programId: null };
  const next = applyMutation(data, mutation);
  expect(next.programs).toEqual(data.programs);
  expect(next.settings).toEqual(data.settings);
  expect(next.sessions).toEqual([session]);
  expect(() => validateAppData(next)).not.toThrow();
  expect(applyMutation(next, mutation)).toEqual(next);
  workout.exercises[0]!.targetSets = 1;
  expect(session.exercises[0]!.sets).toHaveLength(3);
});

it('rejects invalid standalone workouts before creating a session', () => {
  const data = createDefaultData();
  const workout = data.programs[0]!.workouts[0]!;
  expect(() => createCustomSession({ ...workout, name: ' ' }, data.exercises, new Date().toISOString())).toThrow(/workout name/i);
  expect(() => createCustomSession({ ...workout, exercises: [] }, data.exercises, new Date().toISOString())).toThrow(/exercises/i);
  expect(() => createCustomSession({ ...workout, exercises: [{ ...workout.exercises[0]!, exerciseId: 'missing' }] }, data.exercises, new Date().toISOString())).toThrow(/catalog/i);
});

it('cannot create another active session over a program or custom workout', () => {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const active = createSession(program, program.workouts[0]!, data.exercises, new Date().toISOString());
  const custom = createCustomSession(program.workouts[0]!, data.exercises, new Date().toISOString());
  const next = applyMutation({ ...data, sessions: [active] }, { kind: 'startWorkout', session: custom, programId: null });
  expect(next.sessions).toEqual([active]);
});

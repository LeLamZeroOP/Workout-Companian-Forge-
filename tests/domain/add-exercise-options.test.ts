import { createDefaultData } from '../../src/data/defaults';
import { validateAppData } from '../../src/data/validateAppData';
import { createSession, validateProgram } from '../../src/domain/workout';
import { completeGuidedSet } from '../../src/domain/guidedWorkout';
import { addExerciseToProgramWorkout, addSessionExercise, validateAddExerciseOptions } from '../../src/domain/sessionEditing';

function fixture() {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const session = createSession(program, program.workouts[0]!, data.exercises, '2026-11-17T10:00:00.000Z');
  const original = session.exercises[0]!;
  session.exercises.push({ ...structuredClone(original), id: 'second-exercise', sets: original.sets.map((s, i) => ({ ...s, id: `second-set-${i}` })) });
  const added = data.exercises.find(e => e.id !== original.exerciseId)!;
  return { data, program, session, original, added };
}

describe('adding an exercise with chosen sets, targets and position', () => {
  it('uses the chosen sets, repetition range and rest', () => {
    const { session, added, data } = fixture();
    const next = addSessionExercise(session, added, { targetSets: 5, targetRepMin: 4, targetRepMax: 6, restSeconds: 180 });
    expect(next.exercises.at(-1)).toMatchObject({ exerciseId: added.id, targetRepMin: 4, targetRepMax: 6, restSeconds: 180 });
    expect(next.exercises.at(-1)!.sets).toHaveLength(5);
    expect(next.exercises.at(-1)!.sets.every(set => set.kind === 'working' && !set.completed && set.weightKg === null)).toBe(true);
    expect(() => validateAppData({ ...data, sessions: [next] })).not.toThrow();
  });

  it('inserts after a chosen exercise or first, without moving the current set or running rest', () => {
    const { session, original, added } = fixture();
    original.sets[0] = { ...original.sets[0]!, weightKg: 30, reps: 10 };
    const resting = completeGuidedSet(session, original.id, original.sets[0]!.id, session.startedAt);
    const after = addSessionExercise(resting, added, { position: { afterExerciseId: original.id } });
    expect(after.exercises.map(e => e.exerciseId)).toEqual([original.exerciseId, added.id, original.exerciseId]);
    expect(after.guide).toEqual(resting.guide);
    const first = addSessionExercise(resting, added, { position: 'start' });
    expect(first.exercises[0]!.exerciseId).toBe(added.id);
    expect(first.guide).toEqual(resting.guide);
    expect(resting.exercises).toHaveLength(2);
  });

  it('falls back to the end when the chosen neighbour no longer exists', () => {
    const { session, added } = fixture();
    const next = addSessionExercise(session, added, { position: { afterExerciseId: 'removed-meanwhile' } });
    expect(next.exercises.at(-1)!.exerciseId).toBe(added.id);
  });

  it('rejects invalid choices without changing the workout', () => {
    const { session, added } = fixture();
    expect(addSessionExercise(session, added, { targetSets: 0 })).toBe(session);
    expect(addSessionExercise(session, added, { targetSets: 11 })).toBe(session);
    expect(addSessionExercise(session, added, { targetRepMin: 12, targetRepMax: 8 })).toBe(session);
    expect(addSessionExercise(session, added, { restSeconds: 601 })).toBe(session);
    expect(addSessionExercise(session, added, { targetSets: Number.NaN })).toBe(session);
    expect(validateAddExerciseOptions({ targetSets: 2.5, targetRepMin: 0, targetRepMax: 101, restSeconds: -1, position: 'end' })).toEqual({
      targetSets: expect.any(String), targets: expect.any(String), restSeconds: expect.any(String),
    });
  });
});

describe('saving an added exercise to the program workout', () => {
  it('adds a valid template entry after the matching movement and leaves the original program untouched', () => {
    const { program, data, original, added } = fixture();
    const before = structuredClone(program);
    const updated = addExerciseToProgramWorkout(program, program.workouts[0]!.id, added, { targetSets: 4, targetRepMin: 6, targetRepMax: 10, restSeconds: 120, position: { afterExerciseId: original.id } }, original.exerciseId, '2026-11-17T11:00:00.000Z')!;
    expect(program).toEqual(before);
    expect(updated.updatedAt).toBe('2026-11-17T11:00:00.000Z');
    expect(updated.workouts[0]!.exercises.map(e => e.exerciseId)).toEqual([original.exerciseId, added.id]);
    expect(updated.workouts[0]!.exercises[1]).toMatchObject({ targetSets: 4, targetRepMin: 6, targetRepMax: 10, restSeconds: 120, notes: '' });
    expect(updated.workouts.slice(1)).toEqual(program.workouts.slice(1));
    expect(validateProgram(updated, data.exercises)).toEqual({});
  });

  it('places it first or last when asked, or when the neighbour is not in the template', () => {
    const { program, original, added } = fixture();
    const id = program.workouts[0]!.id;
    expect(addExerciseToProgramWorkout(program, id, added, { position: 'start' }, null, 'now')!.workouts[0]!.exercises[0]!.exerciseId).toBe(added.id);
    expect(addExerciseToProgramWorkout(program, id, added, { position: { afterExerciseId: 'x' } }, 'not-in-template', 'now')!.workouts[0]!.exercises.at(-1)!.exerciseId).toBe(added.id);
    expect(addExerciseToProgramWorkout(program, id, added, {}, null, 'now')!.workouts[0]!.exercises.map(e => e.exerciseId)).toEqual([original.exerciseId, added.id]);
  });

  it('returns null for a missing or full workout and for invalid choices', () => {
    const { program, added } = fixture();
    const id = program.workouts[0]!.id;
    expect(addExerciseToProgramWorkout(program, 'missing', added, {}, null, 'now')).toBeNull();
    expect(addExerciseToProgramWorkout(program, id, added, { targetSets: 0 }, null, 'now')).toBeNull();
    const full = structuredClone(program);
    full.workouts[0]!.exercises = Array.from({ length: 20 }, (_, index) => ({ ...program.workouts[0]!.exercises[0]!, id: `entry-${index}` }));
    expect(addExerciseToProgramWorkout(full, id, added, {}, null, 'now')).toBeNull();
  });
});

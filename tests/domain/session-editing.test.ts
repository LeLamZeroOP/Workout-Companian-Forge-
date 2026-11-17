import { createDefaultData } from '../../src/data/defaults';
import { validateAppData } from '../../src/data/validateAppData';
import { createSession } from '../../src/domain/workout';
import { completeGuidedSet } from '../../src/domain/guidedWorkout';
import { addSessionExercise, editSessionDetails, editSessionExercise, removeSessionExercise, replaceSessionExercise, validateExerciseDetails, validateSessionDetails } from '../../src/domain/sessionEditing';

function fixture() {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const session = createSession(program, program.workouts[0]!, data.exercises, '2026-10-04T10:00:00.000Z');
  const original = session.exercises[0]!;
  session.exercises.push({ ...structuredClone(original), id: 'second-exercise', sets: original.sets.map((s, i) => ({ ...s, id: `second-set-${i}` })) });
  const replacement = data.exercises.find(e => e.id !== original.exerciseId)!;
  return { data, session, original, replacement };
}

describe('active workout editing', () => {
  it('appends independent blank sets without changing current progress or rest', () => {
    const { session, original, replacement, data } = fixture();
    original.sets[0] = { ...original.sets[0]!, weightKg: 30, reps: 10 };
    const resting = completeGuidedSet(session, original.id, original.sets[0]!.id, session.startedAt);
    const added = addSessionExercise(resting, replacement);
    expect(added.guide).toEqual(resting.guide);
    expect(added.exercises.slice(0, -1)).toEqual(resting.exercises);
    expect(added.exercises.at(-1)).toMatchObject({ exerciseId: replacement.id, targetRepMin: 8, targetRepMax: 12, restSeconds: 90 });
    expect(added.exercises.at(-1)!.sets).toHaveLength(3);
    expect(session.exercises).toHaveLength(2);
    expect(() => validateAppData({ ...data, sessions: [added] })).not.toThrow();
  });
  it('selects the added exercise for an empty or fully completed workout and permits repeated movements', () => {
    const { session, replacement } = fixture();
    session.exercises = [];
    session.guide = { currentExerciseId: null, currentSetId: null, restTimer: null };
    const first = addSessionExercise(session, replacement);
    expect(first.guide.currentSetId).toBe(first.exercises[0]!.sets[0]!.id);
    first.exercises[0]!.sets.forEach(s => { s.completed = true; });
    const repeated = addSessionExercise(first, replacement);
    expect(repeated.guide.currentExerciseId).toBe(repeated.exercises[1]!.id);
    expect(repeated.exercises[0]!.id).not.toBe(repeated.exercises[1]!.id);
    repeated.completedAt = session.startedAt;
    expect(addSessionExercise(repeated, replacement)).toBe(repeated);
  });
  it('replaces an unstarted exercise in place with blank fresh sets and new metadata', () => {
    const { session, original, replacement } = fixture();
    original.sets[0]!.weightKg = 30;
    original.chestEmphasis = 'upper';
    const next = replaceSessionExercise(session, original.id, { ...replacement, chestEmphasis: undefined, muscleRoles: undefined });
    const changed = next.exercises[0]!;
    expect(changed.id).toBe(original.id);
    expect(changed.exerciseId).toBe(replacement.id);
    expect(changed.chestEmphasis).toBeUndefined();
    expect(changed.muscleRoles).toBeUndefined();
    expect(changed.sets).toHaveLength(original.sets.length);
    expect(changed.sets[0]).toMatchObject({ weightKg: null, reps: null, completed: false });
    expect(changed.sets[0]!.id).not.toBe(original.sets[0]!.id);
    expect(next.guide.currentSetId).toBe(changed.sets[0]!.id);
    expect(next.exercises.slice(1)).toEqual(session.exercises.slice(1));
    expect(original.sets[0]!.weightKg).toBe(30);
  });

  it('keeps completed results with their original movement and moves only unfinished sets', () => {
    const { data, session, original, replacement } = fixture();
    original.sets[0] = { ...original.sets[0]!, completed: true, weightKg: 30, reps: 10 };
    const resting = completeGuidedSet(session, original.id, original.sets[0]!.id, session.startedAt);
    const next = replaceSessionExercise(resting, original.id, replacement);
    expect(next.exercises[0]!.exerciseId).toBe(original.exerciseId);
    expect(next.exercises[0]!.sets).toEqual([original.sets[0]]);
    expect(next.exercises[1]!.exerciseId).toBe(replacement.id);
    expect(next.exercises[1]!.sets).toHaveLength(original.sets.length - 1);
    expect(next.exercises[1]!.sets.every(s => !s.completed && s.weightKg === null && s.reps === null)).toBe(true);
    expect(next.guide.restTimer).toBeNull();
    expect(next.guide.currentExerciseId).toBe(next.exercises[1]!.id);
    expect(session.exercises[0]!.sets).toHaveLength(original.sets.length);
    expect(() => validateAppData({ ...data, sessions: [next] })).not.toThrow();
  });

  it('ignores same-definition, missing, and fully completed replacements', () => {
    const { session, original, replacement, data } = fixture();
    expect(replaceSessionExercise(session, 'missing', replacement)).toBe(session);
    expect(replaceSessionExercise(session, original.id, data.exercises.find(e => e.id === original.exerciseId)!)).toBe(session);
    original.sets.forEach(s => { s.completed = true; });
    expect(replaceSessionExercise(session, original.id, replacement)).toBe(session);
  });

  it('preserves unrelated selection and rest when replacing or removing upcoming exercises', () => {
    const { session, original, replacement } = fixture();
    original.sets[0] = { ...original.sets[0]!, weightKg: 20, reps: 10 };
    const resting = completeGuidedSet(session, original.id, original.sets[0]!.id, session.startedAt);
    const other = session.exercises[1]!;
    expect(removeSessionExercise(resting, other.id).guide).toEqual(resting.guide);
    expect(replaceSessionExercise(resting, other.id, { ...replacement, id: 'another' }).guide).toEqual(resting.guide);
  });

  it('removes the current exercise and selects the next one without dangling timers', () => {
    const { session, original } = fixture();
    const next = removeSessionExercise(session, original.id);
    expect(next.exercises.some(e => e.id === original.id)).toBe(false);
    expect(next.guide).toEqual({ currentExerciseId: session.exercises[1]!.id, currentSetId: session.exercises[1]!.sets[0]!.id, restTimer: null });
  });

  it('wraps selection, clears completed-plan pointers, and permits an empty active session', () => {
    const { session, data } = fixture();
    const last = session.exercises.at(-1)!;
    session.guide = { currentExerciseId: last.id, currentSetId: last.sets[0]!.id, restTimer: null };
    const wrapped = removeSessionExercise(session, last.id);
    expect(wrapped.guide.currentExerciseId).toBe(session.exercises[0]!.id);
    wrapped.exercises.forEach(e => e.sets.forEach(s => { s.completed = true; s.weightKg = 10; s.reps = 8; }));
    const completed = removeSessionExercise(wrapped, wrapped.exercises[0]!.id);
    expect(completed.guide).toEqual({ currentExerciseId: null, currentSetId: null, restTimer: null });
    const empty = completed.exercises.reduce((current, e) => removeSessionExercise(current, e.id), completed);
    expect(empty.exercises).toEqual([]);
    expect(() => validateAppData({ ...data, sessions: [empty] })).not.toThrow();
  });

  it('edits details without changing a running timer or completed results', () => {
    const { session, original } = fixture();
    original.sets[0] = { ...original.sets[0]!, weightKg: 20, reps: 10 };
    const resting = completeGuidedSet(session, original.id, original.sets[0]!.id, session.startedAt);
    const edited = editSessionExercise(resting, original.id, { restSeconds: 45, notes: 'Slow tempo', targetRepMin: 6, targetRepMax: 8 });
    expect(edited.guide).toEqual(resting.guide);
    expect(edited.exercises[0]!.sets).toEqual(resting.exercises[0]!.sets);
    expect(editSessionDetails(edited, { workoutName: '  Test day  ', notes: 'Feeling good' }).workoutName).toBe('Test day');
    expect(editSessionExercise(edited, original.id, { restSeconds: -1, notes: '' })).toBe(edited);
  });

  it('validates paired targets, integer limits, notes, and trimmed names', () => {
    expect(validateExerciseDetails({ restSeconds: 0, notes: '' })).toEqual({});
    expect(validateExerciseDetails({ restSeconds: 600, notes: '', targetRepMin: 1, targetRepMax: 100 })).toEqual({});
    for (const details of [
      { restSeconds: 601, notes: '' }, { restSeconds: 1.5, notes: '' },
      { restSeconds: 60, notes: '', targetRepMin: 5 },
      { restSeconds: 60, notes: '', targetRepMin: 10, targetRepMax: 5 },
      { restSeconds: 60, notes: 'x'.repeat(2001) },
    ]) expect(Object.keys(validateExerciseDetails(details)).length).toBeGreaterThan(0);
    expect(validateSessionDetails({ workoutName: '   ', notes: '' })).toHaveProperty('workoutName');
  });
});

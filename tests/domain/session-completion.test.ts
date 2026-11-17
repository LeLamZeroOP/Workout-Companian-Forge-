import { createDefaultData } from '../../src/data/defaults';
import { applyMutation } from '../../src/domain/appMutations';
import { createSession } from '../../src/domain/workout';

describe('session completion', () => {
  it('deletes only completed sessions and keeps an active workout', () => {
    const data = createDefaultData();
    const program = data.programs[0]!;
    const active = createSession(program, program.workouts[0]!, data.exercises, '2026-10-08T09:00:00.000Z');
    const completed = { ...structuredClone(active), id: 'completed', completedAt: '2026-10-08T10:00:00.000Z' };
    data.sessions = [active, completed];
    expect(applyMutation(data, { kind: 'deleteSession', sessionId: active.id }).sessions).toHaveLength(2);
    const result = applyMutation(data, { kind: 'deleteSession', sessionId: completed.id });
    expect(result.sessions).toEqual([active]);
  });

  it('does not finish a session with only uncompleted or invalid sets', () => {
    const data = createDefaultData();
    const program = data.programs[0]!;
    const session = createSession(program, program.workouts[0]!, data.exercises, '2026-10-08T09:00:00.000Z');
    data.sessions = [session];
    const finish = { kind: 'finishWorkout' as const, sessionId: session.id, completedAt: '2026-10-08T10:00:00.000Z' };
    expect(applyMutation(data, finish).sessions[0]!.completedAt).toBeNull();
    session.exercises[0]!.sets[0] = { ...session.exercises[0]!.sets[0]!, completed: true, weightKg: 10, reps: 0 };
    expect(applyMutation(data, finish).sessions[0]!.completedAt).toBeNull();
  });

  it('finishes a partial session with a valid zero-load set and clears its rest', () => {
    const data = createDefaultData();
    const program = data.programs[0]!;
    const session = createSession(program, program.workouts[0]!, data.exercises, '2026-10-08T09:00:00.000Z');
    const exercise = session.exercises[0]!;
    exercise.sets[0] = { ...exercise.sets[0]!, completed: true, weightKg: 0, reps: 8 };
    session.guide.restTimer = { exerciseId: exercise.id, afterSetId: exercise.sets[0]!.id, startedAt: session.startedAt, endsAt: '2026-10-08T09:01:30.000Z', durationSeconds: 90 };
    data.sessions = [session];
    const result = applyMutation(data, { kind: 'finishWorkout', sessionId: session.id, completedAt: '2026-10-08T10:00:00.000Z' }).sessions[0]!;
    expect(result.completedAt).toBe('2026-10-08T10:00:00.000Z');
    expect(result.guide.restTimer).toBeNull();
    expect(result.exercises[0]!.sets[1]!.completed).toBe(false);
  });
});

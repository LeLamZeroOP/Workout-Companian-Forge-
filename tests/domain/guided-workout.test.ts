import { completeGuidedSet, extendRest, getNextIncompleteSet, getRemainingRestSeconds, selectGuidedSet, skipRest } from '../../src/domain/guidedWorkout';
import type { WorkoutSession } from '../../src/domain/models';

function session(restSeconds = 90): WorkoutSession {
  return {
    id: 'session', programId: 'program', programName: 'PPL', workoutTemplateId: 'push', workoutName: 'Push',
    startedAt: '2026-09-23T10:00:00.000Z', completedAt: null, notes: '',
    guide: { currentExerciseId: 'chest', currentSetId: 'chest-1', restTimer: null },
    exercises: [
      { id: 'chest', exerciseId: 'press', exerciseName: 'Chest Press', muscleContribution: { chest: 1 }, restSeconds, notes: '', sets: [
        { id: 'chest-1', weightKg: 30, reps: 10, kind: 'working', completed: false },
        { id: 'chest-2', weightKg: 30, reps: 10, kind: 'working', completed: false },
      ] },
      { id: 'triceps', exerciseId: 'pushdown', exerciseName: 'Pushdown', muscleContribution: { triceps: 1 }, restSeconds: 60, notes: '', sets: [
        { id: 'tri-1', weightKg: 20, reps: 12, kind: 'working', completed: false },
      ] },
    ],
  };
}

describe('guided workout progression', () => {
  it('finds the next set in exercise order', () => {
    const current = session();
    expect(getNextIncompleteSet(current)).toEqual({ exerciseId: 'chest', setId: 'chest-1' });
    current.exercises[0]!.sets[0]!.completed = true;
    expect(getNextIncompleteSet(current, 'chest', 'chest-1')).toEqual({ exerciseId: 'chest', setId: 'chest-2' });
    current.exercises[0]!.sets[1]!.completed = true;
    expect(getNextIncompleteSet(current, 'chest', 'chest-2')).toEqual({ exerciseId: 'triceps', setId: 'tri-1' });
  });

  it('completes a set and starts an absolute rest timer', () => {
    const updated = completeGuidedSet(session(), 'chest', 'chest-1', '2026-09-23T10:00:00.000Z');
    expect(updated.exercises[0]!.sets[0]!.completed).toBe(true);
    expect(updated.guide.restTimer).toMatchObject({
      startedAt: '2026-09-23T10:00:00.000Z',
      endsAt: '2026-09-23T10:01:30.000Z',
      durationSeconds: 90,
    });
  });

  it('advances immediately when rest is zero', () => {
    const updated = completeGuidedSet(session(0), 'chest', 'chest-1', '2026-09-23T10:00:00.000Z');
    expect(updated.guide).toMatchObject({ currentExerciseId: 'chest', currentSetId: 'chest-2', restTimer: null });
  });

  it('does not start rest after the final planned set', () => {
    const current = session();
    current.exercises[0]!.sets.forEach((set) => { set.completed = true; });
    const updated = completeGuidedSet(current, 'triceps', 'tri-1', '2026-09-23T10:00:00.000Z');
    expect(updated.guide).toEqual({ currentExerciseId: null, currentSetId: null, restTimer: null });
  });

  it('skips and extends rest without changing completion data', () => {
    const resting = completeGuidedSet(session(), 'chest', 'chest-1', '2026-09-23T10:00:00.000Z');
    const extended = extendRest(resting, 30);
    expect(extended.guide.restTimer?.endsAt).toBe('2026-09-23T10:02:00.000Z');
    const skipped = skipRest(extended);
    expect(skipped.guide).toMatchObject({ currentExerciseId: 'chest', currentSetId: 'chest-2', restTimer: null });
  });

  it('derives remaining time and clamps it at zero', () => {
    const rest = completeGuidedSet(session(), 'chest', 'chest-1', '2026-09-23T10:00:00.000Z').guide.restTimer!;
    expect(getRemainingRestSeconds(rest, '2026-09-23T10:00:30.100Z')).toBe(60);
    expect(getRemainingRestSeconds(rest, '2026-09-23T10:02:00.000Z')).toBe(0);
  });

  it('allows manual selection without completing skipped sets', () => {
    const updated = selectGuidedSet(session(), 'triceps', 'tri-1');
    expect(updated.guide.currentExerciseId).toBe('triceps');
    expect(updated.exercises[0]!.sets[0]!.completed).toBe(false);
  });
});

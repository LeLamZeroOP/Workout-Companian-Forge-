import { getDailyVolumeTrend, getExercisePersonalBest, getExerciseTrend, getSessionSummary } from '../../src/domain/progress';
import type { WorkoutSession } from '../../src/domain/models';

function session(id: string, startedAt: string, completedAt: string | null, weight: number, reps: number, completed = true): WorkoutSession {
  return {
    id, programId: 'program', programName: 'Strength', workoutTemplateId: 'push', workoutName: 'Push', startedAt, completedAt, notes: '',
    guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
    exercises: [{
      id: `${id}-exercise`, exerciseId: 'press', exerciseName: 'Chest Press', muscleContribution: { chest: 1 }, restSeconds: 90, notes: '',
      sets: [{ id: `${id}-set`, weightKg: weight, reps, kind: 'working', completed }],
    }],
  };
}

describe('progress analytics', () => {
  const sessions = [
    session('one', '2026-09-20T09:00:00.000Z', '2026-09-20T10:00:00.000Z', 30, 10),
    session('two', '2026-09-22T09:00:00.000Z', '2026-09-22T10:30:00.000Z', 35, 8),
    session('active', '2026-09-23T09:00:00.000Z', null, 50, 5),
  ];

  it('finds the heaviest valid completed set from finished sessions', () => {
    expect(getExercisePersonalBest(sessions, 'press')).toMatchObject({ weightKg: 35, reps: 8 });
  });

  it('builds exercise and daily volume trends in chronological order', () => {
    expect(getExerciseTrend(sessions, 'press')).toEqual([
      { date: '2026-09-20', maxWeightKg: 30, volumeKg: 300, totalReps: 10, completedSets: 1 },
      { date: '2026-09-22', maxWeightKg: 35, volumeKg: 280, totalReps: 8, completedSets: 1 },
    ]);
    expect(getDailyVolumeTrend(sessions)).toEqual([
      { date: '2026-09-20', volumeKg: 300 },
      { date: '2026-09-22', volumeKg: 280 },
    ]);
  });

  it('summarizes completed sets, volume, and elapsed duration', () => {
    expect(getSessionSummary(sessions[1]!)).toEqual({ completedSets: 1, volumeKg: 280, durationSeconds: 5400 });
  });
});

it('counts bodyweight reps across repeated movements and sessions without inventing volume', () => {
  const first = session('first', '2026-09-20T09:00:00Z', '2026-09-20T10:00:00Z', 0, 12);
  const second = session('second', '2026-09-20T12:00:00Z', '2026-09-20T13:00:00Z', 0, 8);
  first.exercises.push({ ...first.exercises[0]!, id: 'repeat', sets: [
    { id: 'extra', kind: 'working', weightKg: 0, reps: 10, completed: true },
    { id: 'warmup', kind: 'warmup', weightKg: 0, reps: 5, completed: true },
    { id: 'unfinished', kind: 'working', weightKg: 0, reps: 20, completed: false },
    { id: 'invalid', kind: 'working', weightKg: 0, reps: 2.5, completed: true },
  ] });
  expect(getExerciseTrend([second, first], 'press')).toEqual([
    { date: '2026-09-20', maxWeightKg: 0, volumeKg: 0, totalReps: 30, completedSets: 3 },
  ]);
  expect(getExerciseTrend([second, first], 'press', true)[0]).toMatchObject({ totalReps: 35, completedSets: 4 });
  expect(getExerciseTrend([first], 'another-movement')).toEqual([]);
});

it('excludes warm-ups by default and resolves tied loads by reps then earliest session', () => {
  const earlier = session('early', '2026-09-20T09:00:00Z', '2026-09-20T10:00:00Z', 30, 12);
  const later = session('later', '2026-09-21T09:00:00Z', '2026-09-21T10:00:00Z', 30, 10);
  const warmup = session('warm', '2026-09-22T09:00:00Z', '2026-09-22T10:00:00Z', 50, 5);
  warmup.exercises[0]!.sets[0]!.kind = 'warmup';
  expect(getExercisePersonalBest([later,warmup,earlier], 'press')?.id).toBe('early-set');
  expect(getSessionSummary(warmup).completedSets).toBe(0);
  expect(getSessionSummary(warmup,true).volumeKg).toBe(250);
  later.exercises[0]!.sets[0]!.reps = 12;
  expect(getExercisePersonalBest([later,earlier], 'press')?.id).toBe('early-set');
});

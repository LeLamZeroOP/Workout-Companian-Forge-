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
      { date: '2026-09-20', maxWeightKg: 30, volumeKg: 300 },
      { date: '2026-09-22', maxWeightKg: 35, volumeKg: 280 },
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

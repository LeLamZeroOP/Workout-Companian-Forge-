import { getMuscleSetsByDate, getMuscleSetTotals, getSessionMuscleSets, summarizeCompletedMuscleVolume } from '../../src/domain/muscleSets';
import type { WorkoutSession } from '../../src/domain/models';

const workout: WorkoutSession = {
  id: 'session', programId: 'program', programName: 'Strength', workoutTemplateId: 'push', workoutName: 'Push',
  startedAt: '2026-09-22T09:00:00.000Z', completedAt: '2026-09-22T10:00:00.000Z', notes: '',
  guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
  exercises: [{
    id: 'press', exerciseId: 'db-press', exerciseName: 'Dumbbell Chest Press', restSeconds: 90, notes: '',
    muscleContribution: { chest: 1, triceps: 0.5, frontDelts: 0.5 },
    sets: [
      { id: 'working', weightKg: 30, reps: 10, kind: 'working', completed: true },
      { id: 'warmup', weightKg: 15, reps: 10, kind: 'warmup', completed: true },
      { id: 'unfinished', weightKg: 30, reps: 10, kind: 'working', completed: false },
    ],
  }],
};

describe('muscle set analytics', () => {
  it('counts fractional contributions from valid working sets only', () => {
    expect(getSessionMuscleSets(workout)).toEqual({ chest: 1, triceps: 0.5, frontDelts: 0.5 });
  });

  it('groups contributions by local completion date', () => {
    expect(getMuscleSetsByDate([workout])).toEqual([{ date: '2026-09-22', muscleSets: { chest: 1, triceps: 0.5, frontDelts: 0.5 } }]);
  });

  it('totals only sessions within an inclusive date range', () => {
    expect(getMuscleSetTotals([workout], new Date('2026-09-22T00:00:00'), new Date('2026-09-22T23:59:59'))).toEqual({ chest: 1, triceps: 0.5, frontDelts: 0.5 });
    expect(getMuscleSetTotals([workout], new Date('2026-09-23T00:00:00'), new Date('2026-09-24T23:59:59'))).toEqual({});
  });

  it('uses saved roles and excludes warm-ups from completed direct sets', () => {
    const logged = structuredClone(workout);
    logged.exercises[0]!.muscleRoles = { direct: ['chest'], indirect: ['triceps'], reviewedAt: '2026-09-30', source: 'forge-reviewed' };
    const summary = summarizeCompletedMuscleVolume([logged]);
    expect(summary.performedSets).toBe(1);
    expect(summary.rows.find(row => row.muscle === 'chest')).toMatchObject({ directSets: 1, weightedSets: 1 });
    expect(summary.rows.find(row => row.muscle === 'triceps')).toMatchObject({ indirectSets: 1, weightedSets: 0.5 });
    expect(summarizeCompletedMuscleVolume([workout]).rows.find(row => row.muscle === 'chest')?.directSets).toBeNull();
  });
});

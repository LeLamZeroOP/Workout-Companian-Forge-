import { render, screen } from '@testing-library/react';
import { MuscleSummaryPage } from '../../src/features/muscles/MuscleSummaryPage';
import type { WorkoutSession } from '../../src/domain/models';

const completed: WorkoutSession = {
  id: 'done', programId: 'program', programName: 'Strength', workoutTemplateId: 'push', workoutName: 'Push',
  startedAt: '2026-09-22T09:00:00.000Z', completedAt: '2026-09-22T10:00:00.000Z', notes: '',
  guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
  exercises: [{ id: 'press', exerciseId: 'db-press', exerciseName: 'Chest Press', muscleContribution: { chest: 1, triceps: 0.5 }, restSeconds: 90, notes: '', sets: [{ id: 'set', weightKg: 30, reps: 10, kind: 'working', completed: true }] }],
};

describe('Muscle summary page', () => {
  it('shows weighted muscle sets for a selected period', () => {
    render(<MuscleSummaryPage sessions={[completed]} now={new Date('2026-09-22T12:00:00')} />);
    expect(screen.getByText('Chest')).toBeInTheDocument();
    expect(screen.getByText('Triceps')).toBeInTheDocument();
    expect(screen.getByText('0.5 sets')).toBeInTheDocument();
  });
});

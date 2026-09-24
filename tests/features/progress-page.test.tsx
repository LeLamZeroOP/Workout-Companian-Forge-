import { render, screen } from '@testing-library/react';
import { ProgressPage } from '../../src/features/progress/ProgressPage';
import type { WorkoutSession } from '../../src/domain/models';

const completed: WorkoutSession = {
  id: 'done', programId: 'program', programName: 'Strength', workoutTemplateId: 'push', workoutName: 'Push',
  startedAt: '2026-09-22T09:00:00.000Z', completedAt: '2026-09-22T10:00:00.000Z', notes: '',
  guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
  exercises: [{ id: 'press', exerciseId: 'db-press', exerciseName: 'Chest Press', muscleContribution: { chest: 1 }, restSeconds: 90, notes: '', sets: [{ id: 'set', weightKg: 30, reps: 10, kind: 'working', completed: true }] }],
};

describe('Progress page', () => {
  it('shows exercise progress with a personal best and accessible data table', () => {
    render(<ProgressPage sessions={[completed]} />);
    expect(screen.getAllByText('30 kg')).toHaveLength(2);
    expect(screen.getByRole('table', { name: /exercise trend data/i })).toBeInTheDocument();
    expect(screen.getByText('300 kg')).toBeInTheDocument();
  });
});

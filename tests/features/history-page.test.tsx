import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPage } from '../../src/features/history/HistoryPage';
import type { WorkoutSession } from '../../src/domain/models';

const completed: WorkoutSession = {
  id: 'done', programId: 'program', programName: 'Strength', workoutTemplateId: 'push', workoutName: 'Push day',
  startedAt: '2026-09-22T09:00:00.000Z', completedAt: '2026-09-22T10:00:00.000Z', notes: '',
  guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
  exercises: [{ id: 'press', exerciseId: 'db-press', exerciseName: 'Chest Press', muscleContribution: { chest: 1 }, restSeconds: 90, notes: '', sets: [{ id: 'set', weightKg: 30, reps: 10, kind: 'working', completed: true }] }],
};

describe('History page', () => {
  it('shows an empty state when no workouts have been completed', () => {
    render(<HistoryPage sessions={[]} />);
    expect(screen.getByText(/complete your first workout/i)).toBeInTheDocument();
  });

  it('opens a completed workout with its set and summary details', async () => {
    render(<HistoryPage sessions={[completed]} />);
    await userEvent.click(screen.getByRole('button', { name: /push day/i }));
    expect(screen.getByText('Chest Press')).toBeInTheDocument();
    expect(screen.getByText('300 kg')).toBeInTheDocument();
  });
});

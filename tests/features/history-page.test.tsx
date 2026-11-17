import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPage } from '../../src/features/history/HistoryPage';
import type { WorkoutSession } from '../../src/domain/models';
import { vi } from 'vitest';

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

  it('searches saved notes and clears all filters together', async () => {
    const user = userEvent.setup();
    render(<HistoryPage sessions={[{ ...completed, notes: 'Deload week' }]} />);
    await user.type(screen.getByLabelText('Search history'), '  deload  ');
    expect(screen.getByRole('button', { name: /Open Push day/ })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Search history'));
    await user.type(screen.getByLabelText('Search history'), 'unknown');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByLabelText('Search history')).toHaveValue('');
    expect(screen.getByRole('button', { name: /Open Push day/ })).toBeInTheDocument();
  });

  it('retains session and exercise notes in the detail view and rounds duration correctly', async () => {
    render(<HistoryPage sessions={[{ ...completed, completedAt: '2026-09-22T09:59:45.000Z', notes: 'Felt strong', exercises: [{ ...completed.exercises[0]!, notes: 'Slow eccentric' }] }]} />);
    await userEvent.click(screen.getByRole('button', { name: /Open Push day/ }));
    expect(screen.getByText('Felt strong')).toBeInTheDocument();
    expect(screen.getByText('Slow eccentric')).toBeInTheDocument();
    expect(screen.getByText('1h 0m')).toBeInTheDocument();
  });

  it('requires confirmation to delete a completed workout', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<HistoryPage sessions={[completed]} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /Open Push day/ }));
    await user.click(screen.getByRole('button', { name: 'Delete workout' }));
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Chest Press')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete workout' }));
    await user.click(screen.getByRole('button', { name: 'Delete from history' }));
    expect(onDelete).toHaveBeenCalledWith(completed.id);
  });

  it('does not transfer a removed session confirmation to another workout', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const other = { ...completed, id: 'other', workoutName: 'Pull day' };
    const view = render(<HistoryPage sessions={[completed, other]} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /Open Push day/ }));
    await user.click(screen.getByRole('button', { name: 'Delete workout' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    view.rerender(<HistoryPage sessions={[other]} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /Open Pull day/ }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Delete workout' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete Pull day?');
  });

  it('explains reversed date filters and disables the CSV export until corrected', async () => {
    render(<HistoryPage sessions={[completed]} />);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-09-23' } });
    fireEvent.change(screen.getByLabelText('Through'), { target: { value: '2026-09-22' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose valid dates with the start on or before the end');
    expect(screen.getByRole('button', { name: 'Export history CSV' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open Push day/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export history CSV' })).toBeEnabled();
  });
});

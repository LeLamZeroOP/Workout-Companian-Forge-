import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.queryByText('300 kg')).not.toBeInTheDocument();
  });

  it('keeps uncompleted movements out of exercise choices and adds warmups only when requested', async () => {
    const empty = { ...completed.exercises[0]!, id: 'unfinished', exerciseId: 'unfinished', exerciseName: 'Unfinished exercise', sets: [{ ...completed.exercises[0]!.sets[0]!, completed: false }] };
    const warmup = { ...completed.exercises[0]!, id: 'warmup', exerciseId: 'warmup', exerciseName: 'Warmup exercise', sets: [{ ...completed.exercises[0]!.sets[0]!, id: 'warmup-set', kind: 'warmup' as const }] };
    render(<ProgressPage sessions={[{ ...completed, exercises: [...completed.exercises, empty, warmup] }]} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Exercise', expanded: false }));
    expect(screen.queryByRole('option', { name: 'Unfinished exercise' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Warmup exercise' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByLabelText('Include warm-up sets'));
    await user.click(screen.getByRole('button', { name: 'Exercise', expanded: false }));
    expect(screen.getByRole('option', { name: 'Warmup exercise' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Unfinished exercise' })).not.toBeInTheDocument();
  });

  it('explains an empty date range and resets its filters', async () => {
    render(<ProgressPage sessions={[completed]} />);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
    expect(screen.getByText('No completed workouts match this date range.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear date filters' }));
    expect(screen.getByLabelText('From')).toHaveValue('');
    expect(screen.getByRole('table', { name: /exercise trend data/i })).toBeInTheDocument();
  });

  it('does not chart an inverted date range', () => {
    render(<ProgressPage sessions={[completed]} />);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Through'), { target: { value: '2026-09-01' } });
    expect(screen.getByRole('alert')).toHaveTextContent('Choose valid dates with the start on or before the end');
    expect(screen.queryByRole('table', { name: /exercise trend data/i })).not.toBeInTheDocument();
  });

  it('charts reps and completed sets for bodyweight work without adding a load', async () => {
    const movement = completed.exercises[0]!;
    render(<ProgressPage sessions={[{ ...completed, exercises: [{ ...movement, sets: [{ ...movement.sets[0]!, weightKg: 0, reps: 12 }] }] }]} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Reps' }));
    let table = screen.getByRole('table', { name: /exercise trend data/i });
    expect(within(table).getByRole('columnheader', { name: 'Repetitions' })).toBeInTheDocument();
    expect(within(table).getByText('12 reps')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sets' }));
    table = screen.getByRole('table', { name: /exercise trend data/i });
    expect(within(table).getByText('1 set')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sets' })).toHaveAttribute('aria-pressed', 'true');
  });
});

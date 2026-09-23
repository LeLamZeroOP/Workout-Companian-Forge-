import { render, screen } from '@testing-library/react';
import { TodayPage } from '../../src/features/today/TodayPage';
import type { Program, WorkoutSession } from '../../src/domain/models';

const program: Program = {
  id: 'starter', name: 'Starter Strength', notes: '', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  workouts: [{ id: 'push', name: 'Push', notes: '', exercises: [] }],
};

const session: WorkoutSession = {
  id: 'session', programId: 'starter', programName: 'Starter Strength', workoutTemplateId: 'push', workoutName: 'Push',
  startedAt: '2026-09-23T10:00:00.000Z', completedAt: null, notes: '', exercises: [],
  guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
};

describe('Today page', () => {
  it('guides a first-time user to create a program', () => {
    render(<TodayPage programs={[]} sessions={[]} onPrimaryAction={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Create first program' })).toBeInTheDocument();
    expect(screen.getByText(/build your first training plan/i)).toBeInTheDocument();
  });

  it('offers to start a workout when programs exist', () => {
    render(<TodayPage programs={[program]} sessions={[]} onPrimaryAction={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Start workout' })).toBeInTheDocument();
    expect(screen.getByText('Starter Strength')).toBeInTheDocument();
  });

  it('prioritizes resuming an active workout', () => {
    render(<TodayPage programs={[program]} sessions={[session]} onPrimaryAction={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Resume workout' })).toBeInTheDocument();
    expect(screen.getByText(/Push is in progress/i)).toBeInTheDocument();
  });

  it('shows the latest completed workout and weekly count', () => {
    const completed = { ...session, completedAt: '2026-09-23T11:00:00.000Z' };
    render(<TodayPage programs={[program]} sessions={[completed]} onPrimaryAction={() => undefined} now={new Date('2026-09-24T12:00:00.000Z')} />);
    expect(screen.getByText('Latest workout')).toBeInTheDocument();
    expect(screen.getByText('1 session this week')).toBeInTheDocument();
  });
});

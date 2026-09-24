import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TodayPage } from '../../src/features/today/TodayPage';
import type { BodyMeasurement, FoodLogEntry, NutritionTarget, Program, WorkoutSession } from '../../src/domain/models';

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

  it('shows clear body and nutrition empty states', () => {
    render(<TodayPage programs={[program]} sessions={[]} onPrimaryAction={() => undefined} bodyMeasurements={[]} nutritionEntries={[]} nutritionTargets={[]} onLogWeight={() => undefined} onAddFood={() => undefined} now={new Date('2026-09-24T12:00:00')} />);
    expect(screen.getByText(/no weight logged/i)).toBeInTheDocument();
    expect(screen.getByText(/no food logged today/i)).toBeInTheDocument();
  });

  it('summarizes latest weight and daily nutrition with direct actions', async () => {
    const measurement: BodyMeasurement = { id: 'weight', recordedAt: '2026-09-24T08:00:00', weightKg: 79.5, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
    const food: FoodLogEntry = { id: 'food', localDate: '2026-09-24', meal: 'lunch', foodId: null, foodName: 'Lunch', grams: 100, servingDescription: '1 bowl', nutrients: { caloriesKcal: 600, proteinG: 40, carbsG: 70, fatG: 18, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null };
    const target: NutritionTarget = { id: 'target', effectiveFrom: '2026-09-01', mode: 'manual', caloriesKcal: 2200, proteinG: 150, carbsG: 250, fatG: 70, formulaVersion: null };
    const onLogWeight = vi.fn(); const onAddFood = vi.fn();
    render(<TodayPage programs={[program]} sessions={[]} onPrimaryAction={() => undefined} bodyMeasurements={[measurement]} nutritionEntries={[food]} nutritionTargets={[target]} onLogWeight={onLogWeight} onAddFood={onAddFood} now={new Date('2026-09-24T12:00:00')} />);
    expect(screen.getByText('79.5 kg')).toBeInTheDocument();
    expect(screen.getByText(/600 of 2,200 kcal/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /log weight/i }));
    await userEvent.click(screen.getByRole('button', { name: /add food/i }));
    expect(onLogWeight).toHaveBeenCalledOnce(); expect(onAddFood).toHaveBeenCalledOnce();
  });
});

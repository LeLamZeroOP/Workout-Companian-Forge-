import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { HistoryPage } from '../../src/features/history/HistoryPage';
import { ProgressPage } from '../../src/features/progress/ProgressPage';
import { NutritionPage } from '../../src/features/nutrition/NutritionPage';
import { BodyPage } from '../../src/features/body/BodyPage';
import { formatDisplayDate } from '../../src/domain/calendar';
import type { BodyMeasurement, FoodLogEntry, WorkoutSession } from '../../src/domain/models';

const session = (id: string, startedAt: string, minutes: number): WorkoutSession => ({
  id, programId: 'program', programName: 'Strength', workoutTemplateId: 'push', workoutName: `Push ${id}`,
  startedAt, completedAt: new Date(new Date(startedAt).getTime() + minutes * 60_000).toISOString(), notes: '',
  guide: { currentExerciseId: null, currentSetId: null, restTimer: null },
  exercises: [{ id: `press-${id}`, exerciseId: 'db-press', exerciseName: 'Chest Press', muscleContribution: { chest: 1 }, restSeconds: 90, notes: '', sets: [{ id: `set-${id}`, weightKg: 30, reps: 10, kind: 'working', completed: true }] }],
});

describe('shared date format', () => {
  it('formats calendar dates and timestamps the same way', () => {
    expect(formatDisplayDate('2026-11-12')).toBe(new Date(2026, 10, 12).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    expect(formatDisplayDate('2026-11-12', { year: false })).toBe(new Date(2026, 10, 12).toLocaleDateString([], { month: 'short', day: 'numeric' }));
    expect(formatDisplayDate('not a date')).toBe('not a date');
  });
});

describe('History layout', () => {
  it('groups sessions by month with weekday and duration, and summarises the date range', () => {
    render(<HistoryPage sessions={[session('a', '2026-10-30T10:00:00', 50), session('b', '2026-11-03T10:00:00', 75), session('c', '2026-11-05T10:00:00', 45)]} />);
    const november = screen.getByRole('region', { name: /2 sessions$/ });
    expect(within(november).getAllByRole('button')).toHaveLength(2);
    expect(within(november).getByText('1 h 15 min')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /1 session$/ })).toHaveTextContent('50 min');
    expect(screen.getByText('All dates')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2026-11-01' } });
    expect(screen.getByText(`${formatDisplayDate('2026-11-01')} – today`)).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 3 sessions')).toBeInTheDocument();
  });
});

describe('Progress layout', () => {
  it('shows the section switch first and hides filters until a workout is completed', () => {
    const { rerender } = render(<ProgressPage sessions={[]} />);
    expect(screen.getByRole('group', { name: 'Progress section' })).toBeInTheDocument();
    expect(screen.queryByLabelText('From')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Include warm-up sets')).not.toBeInTheDocument();
    rerender(<ProgressPage sessions={[session('a', '2026-10-30T10:00:00', 50)]} />);
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('Include warm-up sets')).toBeInTheDocument();
  });
});

describe('Nutrition layout', () => {
  it('keeps target guidance in the totals card and day actions beside the meals heading', () => {
    const entry: FoodLogEntry = { id: 'oats', localDate: '2026-09-24', meal: 'breakfast', foodId: null, foodName: 'Oats', grams: 100, servingDescription: '1 bowl', nutrients: { caloriesKcal: 1415, proteinG: 20, carbsG: 60, fatG: 8, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null };
    render(<NutritionPage foods={[]} entries={[entry]} targets={[]} onAddEntry={vi.fn()} onCopyEntries={vi.fn()} onDeleteEntry={vi.fn()} onSaveCustomFood={vi.fn()} onSaveNutritionTarget={vi.fn()} date="2026-09-24" />);
    const totals = screen.getByRole('region', { name: 'Daily nutrition summary' });
    expect(within(totals).getByText(/No nutrition target is active/)).toBeInTheDocument();
    expect(within(totals).getByRole('button', { name: 'Set manual target' })).toBeInTheDocument();
    const meals = screen.getByRole('heading', { name: /Meals/ }).parentElement!;
    expect(within(meals).getByRole('button', { name: 'Copy day' })).toBeInTheDocument();
    expect(within(meals).getByRole('button', { name: 'Export day CSV' })).toBeInTheDocument();
    expect(screen.getByLabelText('Diary date')).toHaveValue('2026-09-24');
  });
});

describe('Body layout', () => {
  it('shows when the latest weight was recorded and a true minus for a drop', () => {
    const base = { bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
    const measurements: BodyMeasurement[] = [{ ...base, id: 'a', recordedAt: '2026-11-10T07:30:00', localDate: '2026-11-10', weightKg: 80.7 }, { ...base, id: 'b', recordedAt: '2026-11-12T07:30:00', localDate: '2026-11-12', weightKg: 80.3 }];
    render(<BodyPage profile={null} measurements={measurements} onSaveProfile={vi.fn()} onSaveMeasurement={vi.fn()} onDeleteMeasurement={vi.fn()} />);
    expect(screen.getByText((_, element) => element?.classList.contains('body-weight-date') === true && element.textContent === `Recorded ${formatDisplayDate('2026-11-12')}`)).toBeInTheDocument();
    expect(screen.getByText('−0.4 kg from previous entry')).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TodayPage } from '../../src/features/today/TodayPage';
import type { BodyMeasurement, FoodLogEntry, NutritionTarget, Program, WorkoutSession } from '../../src/domain/models';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

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

  it('starts with the last selected program', () => {
    const other = { ...program, id: 'other', name: 'Other plan' };
    render(<TodayPage programs={[program, other]} sessions={[]} lastSelectedProgramId="other" onStart={vi.fn()} onPrimaryAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Program' })).toHaveTextContent('Other plan');
  });

  it('keeps the next action ahead of activity and exposes a complete preview on demand', async () => {
    const data = createDefaultData(); const start = vi.fn(); const user = userEvent.setup();
    render(<TodayPage programs={data.programs} exercises={data.exercises} sessions={[]} onStart={start} onPrimaryAction={vi.fn()} />);
    const action = screen.getByRole('region', { name: 'Next training action' });
    const activity = screen.getByRole('region', { name: 'Weekly activity' });
    expect(action.compareDocumentPosition(activity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const preview = screen.getByText('Session preview').closest('details')!;
    expect(preview).not.toHaveAttribute('open');
    const workout = data.programs[0]!.workouts[0]!;
    const sets = workout.exercises.reduce((total, exercise) => total + exercise.targetSets, 0);
    expect(within(preview).getByText(`${workout.exercises.length} ${workout.exercises.length === 1 ? 'exercise' : 'exercises'} · ${sets} planned sets`)).toBeInTheDocument();
    await user.click(screen.getByText('Session preview'));
    expect(preview).toHaveAttribute('open');
    expect(within(preview).getAllByRole('listitem')).toHaveLength(workout.exercises.length);
    await user.click(screen.getByRole('button', { name: 'Start workout' }));
    expect(start).toHaveBeenCalledWith(data.programs[0]!.id, workout.id);
  });

  it('shows logged zero-calorie foods as a diary total', () => {
    const food: FoodLogEntry = { id: 'water', localDate: '2026-09-24', meal: 'lunch', foodId: null, foodName: 'Water', grams: 250, servingDescription: '250 g', nutrients: { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null };
    render(<TodayPage programs={[]} sessions={[]} onPrimaryAction={vi.fn()} nutritionEntries={[food]} now={new Date('2026-09-24T12:00:00')} />);
    expect(screen.getByText('0 kcal')).toBeInTheDocument();
    expect(screen.queryByText('No food logged today')).not.toBeInTheDocument();
  });

  it('shows the latest completed workout and weekly count', () => {
    const completed = { ...session, completedAt: '2026-09-23T11:00:00.000Z' };
    render(<TodayPage programs={[program]} sessions={[completed]} onPrimaryAction={() => undefined} now={new Date('2026-09-24T12:00:00.000Z')} />);
    expect(screen.getByText('Latest workout')).toBeInTheDocument();
    expect(screen.getByText('1 session · 1 active day this week')).toBeInTheDocument();
    const tile = screen.getByText('Sessions this week').closest('section')!;
    expect(tile).toHaveTextContent('1');
    expect(tile).toHaveTextContent(`Last on ${new Date('2026-09-23T11:00:00.000Z').toLocaleDateString([], { month: 'short', day: 'numeric' })}`);
  });

  it('suggests the next workout in program order while preserving an explicit selection', async () => {
    const data = createDefaultData(); const plan = data.programs[0]!;
    const last = createSession(plan, plan.workouts[0]!, data.exercises, '2026-10-07T10:00:00Z');
    last.completedAt = '2026-10-07T11:00:00Z';
    const start = vi.fn();
    render(<TodayPage programs={data.programs} exercises={data.exercises} sessions={[last]} onStart={start} onPrimaryAction={vi.fn()} now={new Date('2026-10-08T12:00:00Z')} />);
    expect(screen.getByRole('button', { name: 'Selected workout' })).toHaveTextContent('Pull');
    expect(screen.getByText(/Next in program order, after Push/)).toBeVisible();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Selected workout' }));
    await user.click(screen.getByRole('option', { name: /^Legs/ }));
    await user.click(screen.getByRole('button', { name: 'Start workout' }));
    expect(start).toHaveBeenCalledWith(plan.id, 'starter-legs');
    expect(screen.queryByText(/Next in program order/)).not.toBeInTheDocument();
  });

  it('shows accessible weekly activity and a resume summary for valid completed sets', () => {
    const data = createDefaultData(); const plan = data.programs[0]!;
    const active = createSession(plan, plan.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
    Object.assign(active.exercises[0]!.sets[0]!, { completed: true, weightKg: 0, reps: 10 });
    Object.assign(active.exercises[0]!.sets[1]!, { completed: true, weightKg: null, reps: null });
    const last = { ...structuredClone(active), id: 'last', completedAt: '2026-10-07T10:00:00Z' };
    render(<TodayPage programs={data.programs} sessions={[active, last]} onPrimaryAction={vi.fn()} now={new Date('2026-10-08T12:00:00Z')} />);
    expect(screen.getByRole('progressbar', { name: 'Active workout completion' })).toHaveAttribute('value', '1');
    expect(screen.getByRole('heading', { name: 'Dumbbell Chest Press' })).toBeVisible();
    const week = screen.getByRole('list', { name: 'Workouts this week' });
    expect(within(week).getAllByRole('listitem')).toHaveLength(7);
    expect(within(week).getByText(/Wednesday.*1 completed session/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume workout' })).toBeEnabled();
  });

  it('includes a new completion arriving on the same day without waiting for midnight or focus', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T09:00:00Z'));
    const view = render(<TodayPage programs={[program]} sessions={[]} onPrimaryAction={vi.fn()} />);
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    view.rerender(<TodayPage programs={[program]} sessions={[{ ...session, completedAt: '2026-10-08T09:30:00Z' }]} onPrimaryAction={vi.fn()} />);
    expect(screen.getByText('1 session · 1 active day this week')).toBeVisible();
    view.unmount(); vi.useRealTimers();
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
    expect(screen.getByRole('progressbar', { name: 'Recorded calories toward daily target' })).toHaveAttribute('value', '600');
    expect(screen.getByRole('progressbar', { name: 'Recorded calories toward daily target' })).toHaveAttribute('aria-valuetext', '600 of 2200 kcal recorded');
    expect(screen.getByText('1,600 kcal to your target')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /log weight/i }));
    await userEvent.click(screen.getByRole('button', { name: /add food/i }));
    expect(onLogWeight).toHaveBeenCalledOnce(); expect(onAddFood).toHaveBeenCalledOnce();
  });

  it('preserves unknown macros and the actual calorie total above a target', () => {
    const food: FoodLogEntry = { id: 'food', localDate: '2026-10-09', meal: 'lunch', foodId: null, foodName: 'Meal', grams: 100, servingDescription: '1 bowl', nutrients: { caloriesKcal: 2500, proteinG: null, carbsG: null, fatG: null, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null };
    const target: NutritionTarget = { id: 'target', effectiveFrom: '2026-10-01', mode: 'manual', caloriesKcal: 2200, proteinG: 150, carbsG: 250, fatG: 70, formulaVersion: null };
    render(<TodayPage programs={[program]} sessions={[]} onPrimaryAction={vi.fn()} nutritionEntries={[food]} nutritionTargets={[target]} now={new Date('2026-10-09T12:00:00')} />);
    const card = screen.getByRole('region', { name: 'Daily nutrition overview' });
    expect(card).toHaveTextContent('Unknown protein');
    expect(card).toHaveTextContent('Known totals, incomplete data');
    expect(card).toHaveTextContent('300 kcal above your target');
    expect(within(card).getByRole('progressbar')).toHaveAttribute('value', '2500');
    expect(within(card).getByRole('progressbar')).toHaveAttribute('aria-valuetext', '2500 of 2200 kcal recorded');
  });
});

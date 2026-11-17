import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartWorkoutDialog } from '../../src/features/workout/StartWorkoutDialog';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { WorkoutPage } from '../../src/features/workout/WorkoutPage';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { completeGuidedSet, selectGuidedSet } from '../../src/domain/guidedWorkout';

describe('workout flow', () => {
  it('keeps rest and its focused action when skipping cannot be saved, then advances on retry', async () => {
    const data = createDefaultData(); const startedAt = '2026-10-09T10:00:00Z';
    const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, startedAt);
    Object.assign(session.exercises[0]!.sets[0]!, { weightKg: 30, reps: 10 });
    const resting = completeGuidedSet(session, session.exercises[0]!.id, session.exercises[0]!.sets[0]!.id, startedAt);
    const save = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<GuidedWorkout session={resting} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} now={() => startedAt} />);
    await userEvent.click(screen.getByRole('button', { name: 'Skip rest' }));
    expect(screen.getByRole('region', { name: 'Rest timer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Skip rest' })).toHaveFocus();
    expect(screen.getByRole('status')).not.toHaveTextContent('Next set ready');
    await userEvent.click(screen.getByRole('button', { name: 'Skip rest' }));
    expect(screen.queryByRole('region', { name: 'Rest timer' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Weight in kilograms')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Next set ready');
  });
  it('gives an empty program library a direct path to creating its first plan', () => {
    render(<StartWorkoutDialog programs={[]} onStart={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Create your first program' })).toHaveAttribute('href', '#programs');
    expect(screen.queryByRole('button', { name: 'Begin guided workout' })).not.toBeInTheDocument();
  });
  it('requires a program and workout before starting', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const onStart = vi.fn();
    render(<StartWorkoutDialog programs={data.programs} onStart={onStart} />);
    expect(screen.getByRole('button', { name: 'Begin guided workout' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Program' })); await user.click(screen.getByRole('option', { name: /Starter Strength/ }));
    await user.click(screen.getByRole('radio', { name: /^Push/ }));
    await user.click(screen.getByRole('button', { name: 'Begin guided workout' }));
    expect(onStart).toHaveBeenCalledWith('starter-program', 'starter-push');
  });

  it('logs and completes the current set, then shows rest', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const program = data.programs[0]!;
    const current = createSession(program, program.workouts[0]!, data.exercises, '2026-09-23T10:00:00.000Z');
    const onChange = vi.fn();
    render(<GuidedWorkout session={current} onChange={onChange} onFinish={() => undefined} onDiscard={() => undefined} now={() => '2026-09-23T10:00:00.000Z'} />);
    expect(screen.getByRole('button', { name: /^1 dumbbell chest press/i })).toHaveAttribute('aria-current', 'step');
    await user.type(screen.getByLabelText('Weight in kilograms'), '30');
    await user.type(screen.getByLabelText('Repetitions'), '10');
    await user.click(screen.getByRole('button', { name: 'Complete set' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ guide: expect.objectContaining({ restTimer: expect.any(Object) }) }));
    expect(screen.getByRole('button', { name: 'Skip rest' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Skip rest' }));
    expect(screen.getByLabelText('Weight in kilograms')).toHaveFocus();
  });

  it('keeps the entered number text visible while typing', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const program = data.programs[0]!;
    const current = createSession(program, program.workouts[0]!, data.exercises, '2026-09-23T10:00:00.000Z');
    render(<GuidedWorkout session={current} onChange={vi.fn()} onFinish={() => undefined} onDiscard={() => undefined} />);
    const weight = screen.getByLabelText('Weight in kilograms');
    await user.type(weight, '30.');
    expect(weight).toHaveValue('30.');
    expect(screen.getByRole('button', { name: 'Complete set' })).toBeDisabled();
    await user.type(screen.getByLabelText('Repetitions'), '10');
    expect(screen.getByLabelText('Repetitions')).toHaveValue('10');
  });

  it('keeps skipped historical set positions blank instead of suggesting a later set load', () => {
    const data = createDefaultData(); const program = data.programs[0]!;
    const active = createSession(program, program.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
    const exercise = active.exercises[0]!;
    const previous = createSession(program, program.workouts[0]!, data.exercises, '2026-10-07T10:00:00Z');
    previous.completedAt = '2026-10-07T11:00:00Z';
    Object.assign(previous.exercises[0]!.sets[0]!, { completed: true, weightKg: 30, reps: 10 });
    Object.assign(previous.exercises[0]!.sets[2]!, { completed: true, weightKg: 40, reps: 8 });
    render(<GuidedWorkout session={selectGuidedSet(active, exercise.id, exercise.sets[1]!.id)} history={[previous]} onChange={vi.fn()} onFinish={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Use previous set' })).not.toBeInTheDocument();
    const rows = within(screen.getByRole('table', { name: `Sets for ${exercise.exerciseName}` })).getAllByRole('row');
    expect(within(rows[2]!).getAllByRole('cell')[0]).toHaveTextContent('—');
    expect(within(rows[3]!).getAllByRole('cell')[0]).toHaveTextContent('40 × 8');
  });

  it('uses the second previous exercise block when the current movement is repeated', async () => {
    const data = createDefaultData(); const program = data.programs[0]!;
    const active = createSession(program, program.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
    active.exercises.push({ ...structuredClone(active.exercises[0]!), id: 'second-block', sets: active.exercises[0]!.sets.map(set => ({ ...set, id: `second-${set.id}` })) });
    const previous = structuredClone(active); previous.id = 'previous'; previous.completedAt = '2026-10-07T11:00:00Z';
    Object.assign(previous.exercises[0]!.sets[0]!, { completed: true, weightKg: 30, reps: 10 });
    Object.assign(previous.exercises[1]!.sets[0]!, { completed: true, weightKg: 20, reps: 8 });
    const second = active.exercises[1]!;
    render(<GuidedWorkout session={selectGuidedSet(active, second.id, second.sets[0]!.id)} history={[previous]} onChange={vi.fn()} onFinish={vi.fn()} onDiscard={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Use previous set' }));
    expect(screen.getByLabelText('Weight in kilograms')).toHaveValue('20');
    expect(screen.getByLabelText('Repetitions')).toHaveValue('8');
  });

  it('retains inputs without starting rest or advancing progress when completing a set fails', async () => {
    const data = createDefaultData();
    const current = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
    current.exercises[0]!.sets[0]!.weightKg = 30;
    current.exercises[0]!.sets[0]!.reps = 10;
    const save = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<GuidedWorkout session={current} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} now={() => current.startedAt} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Complete set' }));
    expect(screen.getByRole('progressbar', { name: 'Workout completion' })).toHaveAttribute('value', '0');
    expect(screen.queryByRole('region', { name: 'Rest timer' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Weight in kilograms')).toHaveValue('30');
    expect(screen.getByRole('status')).not.toHaveTextContent('Set completed');
    await user.click(screen.getByRole('button', { name: 'Complete set' }));
    expect(screen.getByRole('progressbar', { name: 'Workout completion' })).toHaveAttribute('value', '1');
    expect(screen.getByRole('region', { name: 'Rest timer' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Undo set 1' }));
    expect(screen.getByRole('progressbar', { name: 'Workout completion' })).toHaveAttribute('value', '0');
  });

  it('keeps both fields when their changes arrive before a render', () => {
    const data = createDefaultData();
    const program = data.programs[0]!;
    const current = createSession(program, program.workouts[0]!, data.exercises, '2026-09-23T10:00:00.000Z');
    render(<GuidedWorkout session={current} onChange={vi.fn()} onFinish={() => undefined} onDiscard={() => undefined} />);
    const weight = screen.getByLabelText('Weight in kilograms');
    const reps = screen.getByLabelText('Repetitions');
    act(() => {
      fireEvent.change(weight, { target: { value: '70' } });
      fireEvent.change(reps, { target: { value: '12' } });
    });
    expect(weight).toHaveValue('70');
    expect(reps).toHaveValue('12');
    expect(screen.getByRole('button', { name: 'Complete set' })).toBeEnabled();
  });

  it('extends rest by 30 seconds and can skip to the next set', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const program = data.programs[0]!;
    const started = createSession(program, program.workouts[0]!, data.exercises, '2026-09-23T10:00:00.000Z');
    const firstExercise = started.exercises[0]!;
    const firstSet = firstExercise.sets[0]!;
    firstSet.weightKg = 30;
    firstSet.reps = 10;
    const resting = completeGuidedSet(started, firstExercise.id, firstSet.id, '2026-09-23T10:00:00.000Z');
    const onChange = vi.fn();
    render(<GuidedWorkout session={resting} onChange={onChange} onFinish={() => undefined} onDiscard={() => undefined} now={() => '2026-09-23T10:00:10.000Z'} />);
    await user.click(screen.getByRole('button', { name: '+30 sec' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ guide: expect.objectContaining({ restTimer: expect.objectContaining({ endsAt: '2026-09-23T10:02:00.000Z' }) }) }));
    await user.click(screen.getByRole('button', { name: 'Skip rest' }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ guide: expect.objectContaining({ currentSetId: firstExercise.sets[1]!.id, restTimer: null }) }));
  });

  it('shows rejected discard errors inside the confirmation and supports retry', async () => {
    const data = createDefaultData();
    const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
    const discard = vi.fn().mockImplementationOnce(() => { throw new Error('Storage unavailable'); }).mockReturnValueOnce(true);
    render(<WorkoutPage programs={data.programs} sessions={[session]} catalog={data.exercises} lastSelectedProgramId={null} keepScreenAwake={false} onStart={vi.fn()} onChange={vi.fn()} onFinish={vi.fn()} onDiscard={discard} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Discard workout' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Discard workout' }));
    expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('could not be discarded');
    expect(screen.getByLabelText('Weight in kilograms')).toBeInTheDocument();
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Discard workout' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(discard).toHaveBeenLastCalledWith(session.id);
  });
});

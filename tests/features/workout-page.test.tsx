import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StartWorkoutDialog } from '../../src/features/workout/StartWorkoutDialog';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { completeGuidedSet } from '../../src/domain/guidedWorkout';

describe('workout flow', () => {
  it('requires a program and workout before starting', async () => {
    const user = userEvent.setup();
    const data = createDefaultData();
    const onStart = vi.fn();
    render(<StartWorkoutDialog programs={data.programs} onStart={onStart} />);
    expect(screen.getByRole('button', { name: 'Begin guided workout' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Program'), 'starter-program');
    await user.selectOptions(screen.getByLabelText('Workout'), 'starter-push');
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
    expect(screen.getByRole('button', { name: /dumbbell chest press/i })).toHaveAttribute('aria-current', 'step');
    await user.type(screen.getByLabelText('Weight in kilograms'), '30');
    await user.type(screen.getByLabelText('Repetitions'), '10');
    await user.click(screen.getByRole('button', { name: 'Complete set' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ guide: expect.objectContaining({ restTimer: expect.any(Object) }) }));
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
});

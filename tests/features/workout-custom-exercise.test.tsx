import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

function setup(save = vi.fn().mockReturnValue(true)) {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
  const view = render(<GuidedWorkout session={session} catalog={data.exercises} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  return { save, session, data, view, user: userEvent.setup() };
}

async function openCreate(user: ReturnType<typeof userEvent.setup>, replacing = false) {
  await user.click(within(screen.getByRole('group', { name: 'Workout exercise controls' })).getByRole('button', { name: replacing ? 'Replace current exercise' : 'Add exercise' }));
  await user.click(screen.getByRole('button', { name: 'Create custom exercise' }));
}

async function enterExercise(user: ReturnType<typeof userEvent.setup>) {
  fireEvent.change(screen.getByLabelText('Exercise name'), { target: { value: 'My cable row' } });
  await user.click(screen.getByRole('button', { name: 'Equipment' }));
  await user.click(screen.getByRole('option', { name: 'Cable' }));
  await user.click(screen.getByRole('button', { name: 'Primary muscle' }));
  await user.click(screen.getByRole('option', { name: 'Upper back' }));
}

it('creates a custom exercise with the session while preserving entered set values', async () => {
  const { save, user } = setup();
  fireEvent.change(screen.getByLabelText('Weight in kilograms'), { target: { value: '25' } });
  await openCreate(user);
  await enterExercise(user);
  await user.click(screen.getByRole('button', { name: 'Create and add' }));
  const [next, [definition]] = save.mock.lastCall!;
  expect(definition).toMatchObject({ name: 'My cable row', equipment: 'cable', isCustom: true, muscleContribution: { upperBack: 1 } });
  expect(next.exercises.at(-1).exerciseId).toBe(definition.id);
  expect(next.exercises[0].sets[0].weightKg).toBe(25);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('validates custom exercise fields and cancels without writing', async () => {
  const { save, user } = setup();
  await openCreate(user);
  await user.click(screen.getByRole('button', { name: 'Create and add' }));
  expect(screen.getByLabelText('Exercise name')).toHaveFocus();
  expect(screen.getByText('Choose a primary muscle.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(save).not.toHaveBeenCalled();
});

it('retains custom details and the same ID after a rejected save for retry', async () => {
  const save = vi.fn().mockReturnValueOnce(false).mockReturnValue(true);
  const { user } = setup(save);
  await openCreate(user, true);
  await enterExercise(user);
  await user.click(screen.getByRole('button', { name: 'Create and replace' }));
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(screen.getByLabelText('Exercise name')).toHaveValue('My cable row');
  const firstId = save.mock.lastCall![1][0].id;
  await user.click(screen.getByRole('button', { name: 'Create and replace' }));
  expect(save.mock.lastCall![1][0].id).toBe(firstId);
  expect(screen.getByRole('heading', { name: 'My cable row' })).toBeVisible();
});

it('retains unacknowledged exercise definitions with the workout draft across reopening', async () => {
  const { save, user, view, session, data } = setup();
  await openCreate(user);
  await enterExercise(user);
  await user.click(screen.getByRole('button', { name: 'Create and add' }));
  const definition = save.mock.lastCall![1][0];
  view.unmount();
  const retry = vi.fn().mockReturnValue(true);
  const restored = render(<GuidedWorkout session={session} catalog={data.exercises} onChange={retry} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Add set' }));
  expect(retry.mock.lastCall![1]).toEqual([definition]);
  const next = retry.mock.lastCall![0];
  restored.rerender(<GuidedWorkout session={next} catalog={data.exercises} onChange={retry} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Add set' }));
  expect(retry.mock.lastCall![1]).toEqual([definition]);
  const acknowledged = retry.mock.lastCall![0];
  restored.rerender(<GuidedWorkout session={acknowledged} catalog={[...data.exercises, definition]} onChange={retry} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Add set' }));
  expect(retry.mock.lastCall).toHaveLength(1);
});

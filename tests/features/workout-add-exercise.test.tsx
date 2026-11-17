import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

function setup({ withProgram = true, saveProgram = vi.fn().mockReturnValue(true) } = {}) {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const session = createSession(program, program.workouts[0]!, data.exercises, '2026-11-17T10:00:00.000Z');
  const save = vi.fn().mockReturnValue(true);
  render(<GuidedWorkout session={session} catalog={data.exercises} program={withProgram ? program : undefined} onSaveProgram={saveProgram} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} now={() => session.startedAt} />);
  return { data, program, session, save, saveProgram, user: userEvent.setup() };
}

async function openAdd(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(screen.getByRole('group', { name: 'Workout exercise controls' })).getByRole('button', { name: 'Add exercise' }));
  return screen.getByRole('dialog');
}

async function chooseLatPulldown(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Exercise to add' }));
  await user.click(screen.getByRole('option', { name: /^Lat Pulldown cable$/i }));
}

it('adds an exercise with the chosen sets, repetitions, rest and position', async () => {
  const { user, save, saveProgram, session } = setup();
  const dialog = await openAdd(user);
  expect(screen.getByLabelText('Sets')).toHaveValue(3);
  expect(screen.getByLabelText('Rep minimum')).toHaveValue(8);
  expect(screen.getByLabelText('Rep maximum')).toHaveValue(12);
  expect(screen.getByLabelText('Rest seconds')).toHaveValue(90);
  await chooseLatPulldown(user);
  fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Rep minimum'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Rep maximum'), { target: { value: '8' } });
  fireEvent.change(screen.getByLabelText('Rest seconds'), { target: { value: '120' } });
  await user.click(screen.getByRole('button', { name: 'Position in workout' }));
  await user.click(screen.getByRole('option', { name: 'First in the workout' }));
  await user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  const next = save.mock.lastCall![0];
  expect(next.exercises).toHaveLength(2);
  expect(next.exercises[0]).toMatchObject({ exerciseId: 'lat-pulldown', targetRepMin: 5, targetRepMax: 8, restSeconds: 120 });
  expect(next.exercises[0].sets).toHaveLength(4);
  expect(next.exercises[1].id).toBe(session.exercises[0]!.id);
  expect(next.guide).toEqual(session.guide);
  expect(saveProgram).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('offers a position after each exercise and marks the current one', async () => {
  const { user, save, session } = setup();
  const dialog = await openAdd(user);
  await chooseLatPulldown(user);
  await user.click(screen.getByRole('button', { name: 'Position in workout' }));
  await user.click(screen.getByRole('option', { name: /^After 1\. Dumbbell Chest Press Current exercise/ }));
  await user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  expect(save.mock.lastCall![0].exercises.map((item: { exerciseId: string }) => item.exerciseId)).toEqual([session.exercises[0]!.exerciseId, 'lat-pulldown']);
});

it('blocks invalid sets and targets beside their fields without saving', async () => {
  const { user, save } = setup();
  const dialog = await openAdd(user);
  await chooseLatPulldown(user);
  fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '0' } });
  fireEvent.change(screen.getByLabelText('Rep minimum'), { target: { value: '15' } });
  await user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  expect(screen.getByLabelText('Sets')).toHaveFocus();
  expect(screen.getByLabelText('Sets')).toHaveAccessibleDescription(/from 1 to 10/);
  expect(screen.getByLabelText('Rep minimum')).toHaveAccessibleDescription(/repetition range/);
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Rep minimum'), { target: { value: '10' } });
  await user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  expect(save.mock.lastCall![0].exercises.at(-1).sets).toHaveLength(2);
});

it('also adds the exercise to the program workout when asked', async () => {
  const { user, save, saveProgram, program } = setup();
  const dialog = await openAdd(user);
  await chooseLatPulldown(user);
  fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '4' } });
  await user.click(screen.getByRole('checkbox', { name: 'Also add to Push in Starter Strength for next time' }));
  await user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  expect(save).toHaveBeenCalledOnce();
  expect(saveProgram).toHaveBeenCalledOnce();
  const updated = saveProgram.mock.lastCall![0];
  expect(updated.id).toBe(program.id);
  expect(updated.workouts[0].exercises).toHaveLength(2);
  expect(updated.workouts[0].exercises[1]).toMatchObject({ exerciseId: 'lat-pulldown', targetSets: 4, targetRepMin: 8, targetRepMax: 12, restSeconds: 90 });
  expect(updated.workouts.slice(1)).toEqual(program.workouts.slice(1));
});

it('keeps the workout change when the program save is rejected, and leaves the program alone when the workout save fails', async () => {
  const rejected = setup({ saveProgram: vi.fn().mockReturnValue(false) });
  let dialog = await openAdd(rejected.user);
  await chooseLatPulldown(rejected.user);
  await rejected.user.click(screen.getByRole('checkbox', { name: /Also add to Push/ }));
  await rejected.user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  expect(rejected.save.mock.lastCall![0].exercises).toHaveLength(2);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  document.body.innerHTML = '';

  const failing = setup();
  failing.save.mockReturnValue(false);
  dialog = await openAdd(failing.user);
  await chooseLatPulldown(failing.user);
  await failing.user.click(screen.getByRole('checkbox', { name: /Also add to Push/ }));
  await failing.user.click(within(dialog).getByRole('button', { name: 'Add exercise' }));
  expect(failing.saveProgram).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('does not offer the program option without a source program', async () => {
  const { user } = setup({ withProgram: false });
  await openAdd(user);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

it('carries the chosen settings into a new custom exercise', async () => {
  const { user, save, saveProgram } = setup();
  await openAdd(user);
  fireEvent.change(screen.getByLabelText('Sets'), { target: { value: '5' } });
  fireEvent.change(screen.getByLabelText('Rest seconds'), { target: { value: '60' } });
  await user.click(screen.getByRole('checkbox', { name: /Also add to Push/ }));
  await user.click(screen.getByRole('button', { name: 'Create custom exercise' }));
  expect(screen.getByLabelText('Sets')).toHaveValue(5);
  expect(screen.getByRole('checkbox', { name: /Also add to Push/ })).toBeChecked();
  fireEvent.change(screen.getByLabelText('Exercise name'), { target: { value: 'My cable row' } });
  await user.click(screen.getByRole('button', { name: 'Primary muscle' }));
  await user.click(screen.getByRole('option', { name: 'Upper back' }));
  await user.click(screen.getByRole('button', { name: 'Create and add' }));
  const [next, [definition]] = save.mock.lastCall!;
  expect(next.exercises.at(-1)).toMatchObject({ exerciseId: definition.id, restSeconds: 60 });
  expect(next.exercises.at(-1).sets).toHaveLength(5);
  expect(saveProgram.mock.lastCall![0].workouts[0].exercises.at(-1)).toMatchObject({ exerciseId: definition.id, targetSets: 5, restSeconds: 60 });
});

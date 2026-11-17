import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { completeGuidedSet } from '../../src/domain/guidedWorkout';

function setup(completed = false) {
  const data = createDefaultData();
  const program = data.programs[0]!;
  let session = createSession(program, program.workouts[0]!, data.exercises, '2026-10-04T10:00:00.000Z');
  if (completed) {
    session.exercises[0]!.sets[0] = { ...session.exercises[0]!.sets[0]!, weightKg: 30, reps: 10 };
    session = completeGuidedSet(session, session.exercises[0]!.id, session.exercises[0]!.sets[0]!.id, session.startedAt);
  }
  const save = vi.fn();
  render(<GuidedWorkout session={session} catalog={data.exercises} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} now={() => session.startedAt} />);
  return { data, session, save, user: userEvent.setup() };
}

it('edits targets, rest and notes during rest without changing the running timer', async () => {
  const { user, save, session } = setup(true);
  await user.click(screen.getByRole('button', { name: 'Exercise options' }));
  await user.click(screen.getByRole('button', { name: 'Edit details' }));
  await user.clear(screen.getByLabelText('Rep minimum')); await user.type(screen.getByLabelText('Rep minimum'), '6');
  await user.clear(screen.getByLabelText('Rest seconds')); await user.type(screen.getByLabelText('Rest seconds'), '45');
  await user.clear(screen.getByLabelText('Exercise notes')); await user.type(screen.getByLabelText('Exercise notes'), 'Slow tempo');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ guide: session.guide, exercises: [expect.objectContaining({ targetRepMin: 6, restSeconds: 45, notes: 'Slow tempo' })] }));
  expect(screen.getByRole('region', { name: 'Rest timer' })).toBeVisible();
});

it('blocks invalid targets and cancels without changing the workout', async () => {
  const { user, save } = setup();
  await user.click(screen.getByRole('button', { name: 'Exercise options' }));
  await user.click(screen.getByRole('button', { name: 'Edit details' }));
  await user.clear(screen.getByLabelText('Rep minimum')); await user.type(screen.getByLabelText('Rep minimum'), '99');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByRole('alert')).toHaveTextContent('whole-number repetition range');
  expect(screen.getByLabelText('Rep minimum')).toHaveFocus();
  expect(screen.getByLabelText('Rep minimum')).toHaveAccessibleDescription(/whole-number repetition range/);
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Exercise options' })).toHaveFocus();
});

it('replaces unfinished sets while preserving completed results under the original name', async () => {
  const { user, save, session, data } = setup(true);
  const replacement = data.exercises.find(e => e.id === 'lat-pulldown')!;
  await user.click(screen.getByRole('button', { name: 'Exercise options' }));
  await user.click(screen.getByRole('button', { name: 'Replace exercise' }));
  await user.click(screen.getByRole('button', { name: 'Replacement exercise' }));
  await user.click(screen.getByRole('option', { name: new RegExp('^' + replacement.name + ' cable$', 'i') }));
  expect(screen.getByText(/Completed sets stay with/)).toHaveTextContent(session.exercises[0]!.exerciseName);
  await user.click(screen.getByRole('button', { name: 'Replace exercise' }));
  const next = save.mock.lastCall![0];
  expect(next.exercises[0].exerciseId).toBe(session.exercises[0]!.exerciseId);
  expect(next.exercises[0].sets).toHaveLength(1);
  expect(next.exercises[1].exerciseId).toBe(replacement.id);
  expect(next.exercises[1].sets).toHaveLength(2);
  expect(screen.queryByRole('region', { name: 'Rest timer' })).not.toBeInTheDocument();
});

it('requires removal confirmation and shows an empty active workout after the last exercise', async () => {
  const { user, save } = setup();
  await user.click(screen.getByRole('button', { name: 'Exercise options' }));
  await user.click(screen.getByRole('button', { name: 'Remove exercise' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('logged results will be removed');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(save).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Exercise options' }));
  await user.click(screen.getByRole('button', { name: 'Remove exercise' }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove exercise' }));
  expect(screen.getByText('No exercises remain.')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Finish workout' })).not.toBeInTheDocument();
  expect(save.mock.lastCall![0].exercises).toEqual([]);
});

it('saves session-only name and notes while preserving entered set values', async () => {
  const { user, save } = setup();
  await user.type(screen.getByLabelText('Weight in kilograms'), '42');
  await user.click(screen.getByRole('button', { name: 'Edit workout details' }));
  await user.clear(screen.getByLabelText('Workout name')); await user.type(screen.getByLabelText('Workout name'), 'Test workout');
  await user.type(screen.getByLabelText('Session notes'), 'Good energy');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(save.mock.lastCall![0]).toMatchObject({ workoutName: 'Test workout', notes: 'Good energy' });
  expect(save.mock.lastCall![0].exercises[0].sets[0].weightKg).toBe(42);
  expect(screen.getByRole('heading', { name: 'Test workout' })).toBeVisible();
});

it('keeps workout details and their save error visible until retry succeeds', async () => {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const session = createSession(program, program.workouts[0]!, data.exercises, '2026-10-04T10:00:00Z');
  const save = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<GuidedWorkout session={session} catalog={data.exercises} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Edit workout details' }));
  fireEvent.change(screen.getByLabelText('Session notes'), { target: { value: 'Keep my workout note' } });
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('could not be saved');
  expect(screen.getByLabelText('Session notes')).toHaveValue('Keep my workout note');
  expect(screen.getByRole('status')).not.toHaveTextContent('Workout details saved');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ notes: 'Keep my workout note' }));
});

it('keeps a failed removal confirmation open without removing its exercise locally', async () => {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const session = createSession(program, program.workouts[0]!, data.exercises, '2026-10-04T10:00:00Z');
  const save = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<GuidedWorkout session={session} catalog={data.exercises} onChange={save} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Exercise options' }));
  await user.click(screen.getByRole('button', { name: 'Remove exercise' }));
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove exercise' }));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(screen.queryByText('No exercises remain.')).not.toBeInTheDocument();
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove exercise' }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(screen.getByText('No exercises remain.')).toBeInTheDocument();
});

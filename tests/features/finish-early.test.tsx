import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidedWorkout } from '../../src/features/workout/GuidedWorkout';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

function partialSession() {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
  Object.assign(session.exercises[0]!.sets[0]!, { completed: true, weightKg: 30, reps: 10 });
  session.guide.currentSetId = session.exercises[0]!.sets[1]!.id;
  return session;
}

it('saves a shortened workout only after review and retains unfinished sets', async () => {
  const user = userEvent.setup();
  const onFinish = vi.fn();
  const onChange = vi.fn();
  const session = partialSession();
  render(<GuidedWorkout session={session} onChange={onChange} onFinish={onFinish} onDiscard={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: 'Finish early' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('2 unfinished sets');
  expect(onFinish).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onFinish).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Finish early' }));
  await user.click(screen.getByRole('button', { name: 'Save and finish' }));
  expect(onFinish).toHaveBeenCalledOnce();
  expect(session.exercises[0]!.sets).toHaveLength(3);
});

it('requires a recorded set before finishing early', () => {
  const session = partialSession();
  session.exercises[0]!.sets[0]!.completed = false;
  render(<GuidedWorkout session={session} onChange={vi.fn()} onFinish={vi.fn()} onDiscard={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Finish early' })).toBeDisabled();
});

it('does not finish over an invalid device draft', async () => {
  const user = userEvent.setup();
  const onFinish = vi.fn();
  render(<GuidedWorkout session={partialSession()} onChange={vi.fn()} onFinish={onFinish} onDiscard={vi.fn()} />);
  await user.type(screen.getByLabelText('Repetitions'), '1.5');
  await user.click(screen.getByRole('button', { name: 'Finish early' }));
  await user.click(screen.getByRole('button', { name: 'Save and finish' }));
  expect(onFinish).not.toHaveBeenCalled();
  expect(screen.getByText(/Correct the invalid set values/)).toBeInTheDocument();
});

it('keeps a valid draft open and refuses to finish when its save fails', async () => {
  const user = userEvent.setup();
  const onFinish = vi.fn();
  const onChange = vi.fn(() => false);
  render(<GuidedWorkout session={partialSession()} onChange={onChange} onFinish={onFinish} onDiscard={vi.fn()} />);
  await user.type(screen.getByLabelText('Repetitions'), '10');
  await user.click(screen.getByRole('button', { name: 'Finish early' }));
  await user.click(screen.getByRole('button', { name: 'Save and finish' }));
  expect(onChange).toHaveBeenCalled();
  expect(onFinish).not.toHaveBeenCalled();
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('could not be saved');
  expect(screen.getByLabelText('Repetitions')).toHaveValue('10');
});

it('retains the finish review when saving the completion itself fails', async () => {
  const onFinish = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
  render(<GuidedWorkout session={partialSession()} onChange={vi.fn()} onFinish={onFinish} onDiscard={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Finish early' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  expect(onFinish).toHaveBeenCalledOnce();
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('could not be finished');
  await userEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(onFinish).toHaveBeenCalledTimes(2);
});

it('retains the finish review and shows recovery when completion throws', async () => {
  const onFinish = vi.fn(() => { throw new Error('Storage unavailable'); });
  render(<GuidedWorkout session={partialSession()} onChange={vi.fn()} onFinish={onFinish} onDiscard={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Finish early' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save and finish' }));
  expect(within(screen.getByRole('alertdialog')).getByRole('alert')).toHaveTextContent('could not be finished');
});

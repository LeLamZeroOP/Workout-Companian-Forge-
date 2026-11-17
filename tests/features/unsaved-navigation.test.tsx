import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnsavedChanges } from '../../src/components/UnsavedChanges';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { useAppRoute } from '../../src/hooks/useAppRoute';
import { createDefaultData } from '../../src/data/defaults';

function setup(save = vi.fn(() => true)) {
  const data = createDefaultData();
  const program = { ...data.programs[0]!, workouts: data.programs[0]!.workouts.slice(0, 1) };
  function Page({ guard }: { guard: (proceed: () => void) => void }) {
    const [route, navigate] = useAppRoute(guard);
    return <><button onClick={() => navigate('body')}>Body tab</button>{route === 'programs'
      ? <ProgramsPage programs={[program]} exerciseCatalog={data.exercises} onSave={save} onDelete={vi.fn()} onSaveExercise={vi.fn()} />
      : <h1>Body destination</h1>}</>;
  }
  window.history.replaceState(null, '', '#programs');
  render(<UnsavedChanges>{guard => <Page guard={guard} />}</UnsavedChanges>);
  return { save, program, user: userEvent.setup() };
}

it('keeps the draft on Cancel, then discards it only when requested', async () => {
  const { user, save } = setup();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Program name'), { target: { value: 'Unsaved name' } });
  await user.click(screen.getByRole('button', { name: 'Body tab' }));
  expect(window.location.hash).toBe('#programs');
  expect(screen.getByRole('alertdialog', { name: 'Save your changes?' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.getByLabelText('Program name')).toHaveValue('Unsaved name');
  await user.click(screen.getByRole('button', { name: 'Body tab' }));
  await user.click(screen.getByRole('button', { name: 'Discard changes' }));
  expect(screen.getByRole('heading', { name: 'Body destination' })).toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
});

it('saves the draft before navigating', async () => {
  const { user, save } = setup();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Program name'), { target: { value: 'Saved name' } });
  await user.click(screen.getByRole('button', { name: 'Body tab' }));
  await user.click(screen.getByRole('button', { name: 'Save and leave' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Saved name' }));
  expect(window.location.hash).toBe('#body');
  expect(screen.getByRole('heading', { name: 'Body destination' })).toBeInTheDocument();
});

it.each(['invalid', 'failed'] as const)('retains the editor when a save is %s', async reason => {
  const { user } = setup(vi.fn(() => reason !== 'failed'));
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Program name'), { target: { value: reason === 'invalid' ? '' : 'Draft' } });
  await user.click(screen.getByRole('button', { name: 'Body tab' }));
  await user.click(screen.getByRole('button', { name: 'Save and leave' }));
  expect(window.location.hash).toBe('#programs');
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Your changes have not been saved');
  await user.click(screen.getByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Program name')).toHaveValue(reason === 'invalid' ? '' : 'Draft');
});

it('does not prompt for unchanged or reverted edits', async () => {
  const { user, program } = setup();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  fireEvent.change(screen.getByLabelText('Program name'), { target: { value: 'Temporary' } });
  fireEvent.change(screen.getByLabelText('Program name'), { target: { value: program.name } });
  await user.click(screen.getByRole('button', { name: 'Body tab' }));
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  expect(window.location.hash).toBe('#body');
});

it('guards button-driven edits, browser navigation, and reload', async () => {
  const { user } = setup();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByRole('button', { name: 'Add workout' }));
  const unload = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(unload);
  expect(unload.defaultPrevented).toBe(true);
  act(() => { window.history.replaceState(null, '', '#body'); window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(window.location.hash).toBe('#programs');
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Discard changes' }));
  await waitFor(() => expect(window.location.hash).toBe('#body'));
});

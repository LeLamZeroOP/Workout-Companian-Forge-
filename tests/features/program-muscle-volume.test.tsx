import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createDefaultData } from '../../src/data/defaults';
import { ProgramForm } from '../../src/features/programs/ProgramForm';
import { ProgramMuscleSummary } from '../../src/features/programs/ProgramMuscleSummary';

it('updates planned muscle sets as a program draft changes and leaves cancel unsaved', async () => {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  render(<ProgramForm initialValue={program} exerciseCatalog={data.exercises} onSave={onSave} onCancel={onCancel} />);
  const table = screen.getByRole('table', { name: 'Muscle sets' });
  expect(within(table).getByRole('row', { name: /Chest/ })).toHaveTextContent('3');
  const sets = screen.getAllByRole('spinbutton', { name: 'Sets' });
  await user.clear(sets[0]!);
  await user.type(sets[0]!, '4');
  expect(within(table).getByRole('row', { name: /Chest/ })).toHaveTextContent('4');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalled();
  expect(onSave).not.toHaveBeenCalled();
});

it('does not claim a seven-day average for an unscheduled program', () => {
  const data = createDefaultData();
  render(<ProgramMuscleSummary program={data.programs[0]!} exercises={data.exercises} />);
  expect(screen.getByText(/Per pass through listed workouts/)).toBeInTheDocument();
  expect(screen.queryByText('Below your range')).not.toBeInTheDocument();
});

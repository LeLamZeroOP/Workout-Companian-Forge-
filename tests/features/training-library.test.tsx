import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { createDefaultData } from '../../src/data/defaults';
import { TrainingLibrary } from '../../src/features/programs/TrainingLibrary';

it('previews and customizes a sourced split before saving it', async () => {
  const user = userEvent.setup(); const data = createDefaultData(); const save = vi.fn();
  render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises.slice(0,3)} onSave={save} onDelete={vi.fn()} onSaveExercise={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: '4 days / week' }));
  expect(screen.getByRole('link', { name: 'Public source' })).toHaveAttribute('href', 'https://builtwithscience.com/fitness-tips/best-workout-split-2025/');
  await user.click(screen.getByText('Preview 4 workouts'));
  expect(screen.getAllByText('Barbell Bench Press').length).toBeGreaterThan(0);
  await user.click(screen.getByRole('button', { name: 'Customize Upper / Lower' }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getAllByLabelText(/Workout name/)).toHaveLength(4);
  await user.click(screen.getByRole('button', { name: 'Save program' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Upper / Lower', notes: expect.stringContaining('Source: https://') }));
  // Renders the full Programs page and walks a four-workout form; takes 5–6 s in jsdom on its own.
}, 20_000);

it('compares at most two splits on a shared seven-day basis', async () => {
  const user = userEvent.setup();
  const data = createDefaultData();
  render(<TrainingLibrary exercises={data.exercises} onChoose={vi.fn()} />);
  const buttons = screen.getAllByRole('button', { name: /^Compare$/ });
  await user.click(buttons[0]!);
  await user.click(buttons[1]!);
  expect(screen.getByRole('table', { name: 'Split comparison, weighted contributions per 7 days' })).toBeInTheDocument();
  await user.click(buttons[2]!);
  expect(screen.getByRole('status')).toHaveTextContent('Compare two splits at a time.');
  await user.click(screen.getByRole('button', { name: 'Clear comparison' }));
  expect(screen.queryByRole('table', { name: 'Split comparison, weighted contributions per 7 days' })).not.toBeInTheDocument();
});

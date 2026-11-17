import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { createDefaultData } from '../../src/data/defaults';
import { validateProgram } from '../../src/domain/workout';

it('browses the library in batches and searches beyond the visible exercises', async () => {
  const data = createDefaultData();
  const { container } = render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises.slice(0, 3)} onSave={vi.fn()} onDelete={vi.fn()} onSaveExercise={vi.fn()} />);
  expect(container.querySelectorAll('.catalog-row')).toHaveLength(24);
  await userEvent.click(screen.getByRole('button', { name: 'Show more exercises' }));
  expect(container.querySelectorAll('.catalog-row')).toHaveLength(48);
  fireEvent.change(screen.getByLabelText('Search exercises'), { target: { value: 'lying leg curl' } });
  expect(screen.getByRole('button', { name: /^Lying Leg Curl machine/ })).toBeInTheDocument();
  expect(container.querySelectorAll('.catalog-row')).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Search exercises'), { target: { value: '' } });
  await userEvent.click(screen.getByRole('button', { name: /^band$/ }));
  expect(container.querySelectorAll('.catalog-row').length).toBeLessThanOrEqual(24);
});

it('searches readable muscle names and resets an empty exercise filter', async () => {
  const data = createDefaultData();
  render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={vi.fn()} onDelete={vi.fn()} onSaveExercise={vi.fn()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Search exercises'), '  front delts  ');
  expect(screen.getByRole('button', { name: /^Dumbbell Chest Press dumbbell/ })).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Search exercises'));
  await user.type(screen.getByLabelText('Search exercises'), 'unknown movement');
  expect(screen.getByText('No exercises match these filters.')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Clear exercise filters' }));
  expect(screen.getByLabelText('Search exercises')).toHaveValue('');
});

it('lets a custom exercise choose its actual equipment', async () => {
  const data = createDefaultData();
  const save = vi.fn();
  render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={vi.fn()} onDelete={vi.fn()} onSaveExercise={save} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'New exercise' }));
  await user.type(screen.getByLabelText('Exercise name'), 'My dumbbell press');
  await user.click(screen.getByRole('button', { name: 'Equipment' }));
  await user.click(screen.getByRole('option', { name: 'Dumbbell' }));
  await user.click(screen.getByRole('button', { name: 'Chest contribution' }));
  await user.click(screen.getByRole('option', { name: '1' }));
  await user.click(screen.getByRole('button', { name: 'Save exercise' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'My dumbbell press', equipment: 'dumbbell', isCustom: true }));
});

it('duplicates a maximum-length program into an editable copy with a remapped cycle', async () => {
  const data = createDefaultData();
  const program = { ...data.programs[0]!, name: 'P'.repeat(60), volumePlan: { goal: 'custom' as const, targets: [], cycle: { slots: [data.programs[0]!.workouts[0]!.id, null] } } };
  const save = vi.fn();
  render(<ProgramsPage programs={[program]} exerciseCatalog={data.exercises} onSave={save} onDelete={vi.fn()} onSaveExercise={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: `Duplicate ${program.name}` }));
  const copy = save.mock.calls[0]![0];
  expect(validateProgram(copy, data.exercises)).toEqual({});
  expect(copy.volumePlan.cycle.slots).toEqual([copy.workouts[0].id, null]);
  expect(copy.workouts[0].id).not.toBe(program.workouts[0]!.id);
  expect(program.name).toHaveLength(60);
});

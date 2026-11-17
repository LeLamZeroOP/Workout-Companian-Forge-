import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramForm } from '../../src/features/programs/ProgramForm';
import { SetRow } from '../../src/features/workout/SetRow';
import { createDefaultData } from '../../src/data/defaults';
import type { WorkoutSet } from '../../src/domain/models';

it('lets a user clear program reps and type the replacement without a leading zero', async () => {
  const data = createDefaultData();
  const save = vi.fn();
  render(<ProgramForm initialValue={data.programs[0]!} exerciseCatalog={data.exercises} onSave={save} onCancel={vi.fn()} />);
  const input = screen.getAllByLabelText('Rep min')[0]!;
  await userEvent.clear(input);
  expect(input).toHaveValue(null);
  await userEvent.type(input, '10');
  expect((input as HTMLInputElement).value).toBe('10');
  await userEvent.click(screen.getByRole('button', { name: 'Save program' }));
  expect(save.mock.calls[0]![0].workouts[0].exercises[0].targetRepMin).toBe(10);
});

it('allows clearing zero kg, replacing reps, and entering a fractional weight', async () => {
  function Row() {
    const [set, setSet] = useState<WorkoutSet>({ id: 's', reps: 0, weightKg: 0, kind: 'working', completed: false });
    return <SetRow set={set} setNumber={1} onChange={setSet} />;
  }
  render(<Row />);
  const weight = screen.getByLabelText(/Weight/);
  await userEvent.clear(weight);
  expect(weight).toHaveValue(null);
  await userEvent.type(weight, '12.5');
  expect(weight).toHaveValue(12.5);
  const reps = screen.getByLabelText(/Reps/);
  fireEvent.change(reps, { target: { value: '08' } });
  expect((reps as HTMLInputElement).value).toBe('8');
});

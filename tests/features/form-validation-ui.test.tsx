import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeasurementForm } from '../../src/features/body/MeasurementForm';
import { ManualTargetForm } from '../../src/features/nutrition/ManualTargetForm';
import { CustomFoodForm } from '../../src/features/nutrition/CustomFoodForm';
import { ProgramForm } from '../../src/features/programs/ProgramForm';
import { createDefaultData } from '../../src/data/defaults';

it('opens a collapsed invalid measurement and focuses its described field', async () => {
  const save = vi.fn(); render(<MeasurementForm now={new Date('2026-10-09T12:00:00Z')} onSave={save} onCancel={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Weight in kilograms'), { target: { value: '80' } });
  fireEvent.change(screen.getByLabelText('Waist in centimeters'), { target: { value: '-2' } });
  await userEvent.click(screen.getByRole('button', { name: 'Save measurement' }));
  const field = screen.getByLabelText('Waist in centimeters');
  expect(field.closest('details')).toHaveAttribute('open');
  expect(field).toHaveFocus(); expect(field).toHaveAttribute('aria-invalid', 'true');
  expect(field).toHaveAccessibleDescription(/20 to 300 cm/i); expect(save).not.toHaveBeenCalled();
});

it('describes each invalid target without losing entered values', async () => {
  const save = vi.fn(); render(<ManualTargetForm effectiveFrom="2026-10-09" activeTarget={null} onSave={save} onCancel={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Protein in grams'), { target: { value: '120' } });
  await userEvent.click(screen.getByRole('button', { name: 'Save target' }));
  expect(screen.getByLabelText('Calories per day')).toHaveFocus();
  expect(screen.getByLabelText('Calories per day')).toHaveAccessibleDescription(/Enter calories/);
  expect(screen.getByLabelText('Protein in grams')).toHaveValue(120);
  expect(save).not.toHaveBeenCalled();
});

it('focuses the food name and links serving errors to their fields', async () => {
  render(<CustomFoodForm onSave={vi.fn()} onCancel={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Save custom food' }));
  expect(screen.getByLabelText('Food name')).toHaveFocus();
  expect(screen.getByLabelText('Food name')).toHaveAccessibleDescription('Enter a food name.');
  expect(screen.getByLabelText('Serving weight in grams')).toHaveAttribute('aria-invalid', 'true');
});

it('focuses invalid program set counts with inline domain validation', async () => {
  const data = createDefaultData(); const save = vi.fn();
  render(<ProgramForm initialValue={data.programs[0]!} exerciseCatalog={data.exercises} onSave={save} onCancel={vi.fn()} />);
  const sets = screen.getAllByLabelText('Sets')[0]!;
  fireEvent.change(sets, { target: { value: '0' } });
  await userEvent.click(screen.getByRole('button', { name: 'Save program' }));
  expect(sets).toHaveFocus(); expect(sets).toHaveAttribute('aria-invalid', 'true');
  expect(sets).toHaveAccessibleDescription(/sets/i); expect(save).not.toHaveBeenCalled();
});

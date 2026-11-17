import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { createDefaultData } from '../../src/data/defaults';
import { FoodEntryDialog } from '../../src/features/nutrition/FoodEntryDialog';
import { commonFoods } from '../../src/data/foods/catalog';

it('retains an edited program when local persistence fails and saves it on retry', async () => {
  const data = createDefaultData();
  const workout = data.programs[0]!.workouts[0]!;
  data.programs[0]!.workouts = [{ ...workout, exercises: [workout.exercises[0]!] }];
  localStorage.setItem('workout-tracker:data', JSON.stringify(data));
  window.history.replaceState(null, '', '#programs');
  render(<App />);
  const user = userEvent.setup();
  await user.click(screen.getByText('Edit', { selector: 'button' }));
  fireEvent.change(screen.getByLabelText('Program name'), { target: { value: 'Retained program' } });
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Storage full'); });
  await user.click(screen.getByText('Save program', { selector: 'button' }));
  expect(screen.getByLabelText('Program name')).toHaveValue('Retained program');
  expect(screen.getByRole('alert')).toHaveTextContent('Storage full');
  save.mockRestore();
  await user.click(screen.getByText('Save program', { selector: 'button' }));
  expect(screen.getByRole('heading', { name: 'Retained program' })).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('workout-tracker:data')!).programs[0].name).toBe('Retained program');
});

it('retains a body measurement form after storage rejection', async () => {
  window.history.replaceState(null, '', '#body');
  render(<App />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Log weight' }));
  await user.type(screen.getByLabelText('Weight in kilograms'), '81.5');
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Storage full'); });
  await user.click(screen.getByRole('button', { name: 'Save measurement' }));
  expect(screen.getByLabelText('Weight in kilograms')).toHaveValue(81.5);
  save.mockRestore();
  await user.click(screen.getByRole('button', { name: 'Save measurement' }));
  expect(screen.getByRole('heading', { name: '81.5 kg' })).toBeInTheDocument();
});

it('keeps the selected food and amount open when diary saving fails', async () => {
  const add = vi.fn(() => false);
  const close = vi.fn();
  render(<FoodEntryDialog foods={[commonFoods[0]!]} meal="lunch" localDate="2026-10-08" onAdd={add} onClose={close} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: new RegExp(commonFoods[0]!.name) }));
  await user.clear(screen.getByLabelText('Amount in grams'));
  await user.type(screen.getByLabelText('Amount in grams'), '150');
  await user.click(screen.getByRole('button', { name: 'Add to lunch' }));
  expect(add).toHaveBeenCalled();
  expect(close).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Amount in grams')).toHaveValue(150);
});

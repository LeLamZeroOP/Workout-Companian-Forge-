import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoodEntryDialog } from '../../src/features/nutrition/FoodEntryDialog';
import { EditDiaryEntry } from '../../src/features/nutrition/EditDiaryEntry';
import { ManualTargetForm } from '../../src/features/nutrition/ManualTargetForm';
import { createFoodLogEntry } from '../../src/domain/nutrition';
import type { FoodDefinition, FoodLogEntry } from '../../src/domain/models';

const food: FoodDefinition = { id: 'food', name: 'Test food', brand: null, category: 'Other', preparation: '', source: 'custom', sourceId: null, dataVersion: 'test', nutrientsPer100g: null, portion: { name: 'portion', nutrients: { caloriesKcal: 600000, proteinG: null, carbsG: null, fatG: null, fiberG: null, sodiumMg: null } }, servings: [] };

it('blocks food amounts whose scaled values cannot be saved, and allows correcting them', async () => {
  const user = userEvent.setup();
  const onAdd = vi.fn();
  render(<FoodEntryDialog foods={[food]} meal="lunch" localDate="2026-10-08" onAdd={onAdd} onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: /Test food/ }));
  const amount = screen.getByLabelText('Number of portions (portion)');
  await user.clear(amount); await user.type(amount, '2');
  expect(screen.getByRole('button', { name: 'Add to lunch' })).toBeDisabled();
  expect(onAdd).not.toHaveBeenCalled();
  await user.clear(amount); await user.type(amount, '1');
  await user.click(screen.getByRole('button', { name: 'Add to lunch' }));
  expect(onAdd).toHaveBeenCalledOnce();
  expect(() => createFoodLogEntry(food, 2, 'lunch', '2026-10-08')).toThrow(/nutrient range/);
});

it('keeps the diary editor available when a resized snapshot exceeds storage bounds', async () => {
  const entry: FoodLogEntry = { ...createFoodLogEntry(food, 1, 'lunch', '2026-10-08'), id: 'entry' };
  render(<EditDiaryEntry entry={entry} onSave={vi.fn()} onCancel={vi.fn()} />);
  const amount = screen.getByLabelText('Number of portions');
  await userEvent.clear(amount); await userEvent.type(amount, '2');
  expect(screen.getByRole('button', { name: 'Save entry' })).toBeDisabled();
  expect(screen.getByRole('alert')).toHaveTextContent(/nutrient range/);
});

it('rejects a manual target beyond the saved-document limits before submitting', async () => {
  const onSave = vi.fn();
  const target = { id: 'target', effectiveFrom: '2026-10-08', mode: 'manual' as const, caloriesKcal: 2000, proteinG: 150, carbsG: 250, fatG: 70, formulaVersion: null };
  render(<ManualTargetForm effectiveFrom="2026-10-08" activeTarget={target} onSave={onSave} onCancel={vi.fn()} />);
  const calories = screen.getByLabelText('Calories per day');
  await userEvent.clear(calories); await userEvent.type(calories, '1000001');
  await userEvent.click(screen.getByRole('button', { name: 'Save target' }));
  expect(onSave).not.toHaveBeenCalled();
});

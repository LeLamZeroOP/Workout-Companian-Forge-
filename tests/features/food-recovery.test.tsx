import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NutritionPage } from '../../src/features/nutrition/NutritionPage';
import type { FoodDefinition, FoodLogEntry } from '../../src/domain/models';

const nutrients = { caloriesKcal: 300, proteinG: null, carbsG: 40, fatG: 10, fiberG: null, sodiumMg: null };
const food: FoodDefinition = { id: 'food', name: 'Saved bowl', brand: 'Home', category: 'Meal', preparation: 'Cooked', source: 'custom', sourceId: null, dataVersion: 'v2', nutrientsPer100g: null, portion: { name: 'bowl', nutrients }, servings: [] };
const entry: FoodLogEntry = { id: 'entry', foodId: food.id, foodName: food.name, localDate: '2026-10-08', meal: 'lunch', grams: null, portionQuantity: 2, servingDescription: '2 × bowl', nutrients: { ...nutrients, caloriesKcal: 600 }, source: 'custom', sourceId: null };

function Harness() {
  const [foods, setFoods] = useState([food]);
  const [entries, setEntries] = useState([entry]);
  return <NutritionPage date="2026-10-08" foods={foods} entries={entries} targets={[]} onSaveCustomFood={next => setFoods(current => current.map(item => item.id === next.id ? next : item))} onAddEntry={next => setEntries(current => [...current.filter(item => item.id !== next.id), next])} onDeleteEntry={id => setEntries(current => current.filter(item => item.id !== id))} />;
}

it('archives and restores a custom food without changing its saved meal', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'My foods' }));
  await user.click(screen.getByRole('button', { name: 'Archive Saved bowl' }));
  expect(screen.queryByRole('button', { name: 'Edit Saved bowl' })).not.toBeInTheDocument();
  expect(screen.getByText('600 kcal')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Archived foods/ }));
  await user.click(screen.getByRole('button', { name: 'Restore Saved bowl' }));
  await user.click(screen.getByRole('button', { name: /Available foods/ }));
  expect(screen.getByRole('button', { name: 'Edit Saved bowl' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Search my foods'), 'HOME');
  expect(screen.getByRole('button', { name: 'Edit Saved bowl' })).toBeInTheDocument();
  await user.type(screen.getByLabelText('Search my foods'), 'missing');
  expect(screen.getByText('No foods match this search.')).toBeInTheDocument();
});

it('undoes diary deletion with its original snapshot and identity after changing days', async () => {
  const user = userEvent.setup();
  render(<Harness />);
  await user.click(screen.getByRole('button', { name: 'Delete Saved bowl' }));
  expect(screen.queryByRole('button', { name: 'Edit entry Saved bowl' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Next day' }));
  await user.click(screen.getByRole('button', { name: 'Undo deletion' }));
  await user.click(screen.getByRole('button', { name: 'Previous day' }));
  expect(screen.getByText('600 kcal')).toBeInTheDocument();
  expect(screen.getByText('2 × bowl · Unknown protein')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Edit entry Saved bowl' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Undo deletion' })).not.toBeInTheDocument();
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useState } from 'react';
import { NutritionPage } from '../../src/features/nutrition/NutritionPage';
import { CustomFoodForm } from '../../src/features/nutrition/CustomFoodForm';
import { commonFoods } from '../../src/data/foods/catalog';
import { createFoodLogEntry, incompleteMacros, scaleNutrients, sumNutrients } from '../../src/domain/nutrition';
import type { FoodDefinition, FoodLogEntry } from '../../src/domain/models';
import { createDefaultData } from '../../src/data/defaults';
import { parseAppData } from '../../src/data/migrations';

function Harness() {
  const [foods, setFoods] = useState<FoodDefinition[]>(commonFoods); const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  return <NutritionPage foods={foods} entries={entries} targets={[]} date="2026-09-27" onSaveCustomFood={(food) => setFoods((current) => [...current.filter((item) => item.id !== food.id), food])} onAddEntry={(entry) => setEntries((current) => [...current, entry])} onDeleteEntry={() => {}} />;
}

describe('My foods', () => {
  it('creates a named portion inside Add food, logs it, edits and favorites it without rewriting the diary', async () => {
    const user = userEvent.setup(); render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Add lunch' })); await user.click(screen.getByRole('button', { name: 'Create my food' }));
    await user.click(screen.getByRole('radio', { name: /Named portion/ }));
    await user.type(screen.getByLabelText('Food name'), 'My pizza');
    await user.clear(screen.getByLabelText('Serving name')); await user.type(screen.getByLabelText('Serving name'), '1 slice');
    await user.type(screen.getByLabelText('Calories per serving'), '300');
    await user.click(screen.getByRole('button', { name: 'Save custom food' }));
    expect(screen.queryByLabelText('Amount in grams')).not.toBeInTheDocument();
    const quantity = screen.getByLabelText('Number of portions (1 slice)'); await user.clear(quantity); await user.type(quantity, '2');
    expect(screen.getByText('600 kcal')).toBeInTheDocument(); expect(screen.getByText('Unknown protein')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to lunch' }));
    expect(screen.getAllByText('Known total · incomplete data')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'My foods' }));
    await user.click(screen.getByRole('button', { name: 'Favorite My pizza' })); expect(screen.getByRole('button', { name: 'Favorite My pizza' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Edit My pizza' }));
    const calories = screen.getByLabelText('Calories per serving'); await user.clear(calories); await user.type(calories, '400');
    await user.click(screen.getByRole('button', { name: 'Save custom food' }));
    expect(screen.getByText('600 kcal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add dinner' }));
    await user.type(screen.getByLabelText('Search foods'), 'My pizza');
    expect(within(screen.getByRole('dialog')).getByText('400 kcal')).toBeInTheDocument();
  });
  it('supports per-100g input, finite optional values and explicit zero macros', async () => {
    const user = userEvent.setup(); const save = vi.fn(); render(<CustomFoodForm onSave={save} onCancel={() => {}} />);
    await user.click(screen.getByRole('radio', { name: /Per 100 g/ })); await user.type(screen.getByLabelText('Food name'), 'My soup');
    await user.type(screen.getByLabelText('Calories per 100 g'), '20'); await user.type(screen.getByLabelText(/protein per 100 g/i), '0');
    await user.type(screen.getByLabelText(/sodium per 100 g/i), '-1'); await user.click(screen.getByRole('button', { name: 'Save custom food' }));
    expect(save).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText(/sodium per 100 g/i)); await user.click(screen.getByRole('button', { name: 'Save custom food' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ nutrientsPer100g: expect.objectContaining({ caloriesKcal: 20, proteinG: 0, carbsG: null, fatG: null }) }));
  });
  it('preserves unknowns through scaling, totals and schema serialization', () => {
    const nutrients = { caloriesKcal: 300, proteinG: null, carbsG: 30, fatG: null, fiberG: null, sodiumMg: null };
    expect(scaleNutrients(nutrients, 200)).toMatchObject({ proteinG: null, carbsG: 60, fatG: null });
    const total = sumNutrients([nutrients, { ...nutrients, proteinG: 10 }]); expect(total.proteinG).toBe(10); expect(total.fatG).toBeNull();
    const food: FoodDefinition = { id: 'f', name: 'Pizza', brand: null, category: 'Meal', preparation: 'Cooked', source: 'custom', sourceId: null, dataVersion: 'v2', nutrientsPer100g: null, portion: { name: 'slice', nutrients }, servings: [] };
    const entry = createFoodLogEntry(food, 2, 'lunch', '2026-09-27'); expect(entry.grams).toBeNull(); expect(entry.nutrients.caloriesKcal).toBe(600);
    expect(incompleteMacros([entry])).toEqual(['proteinG', 'fatG']);
    const data = createDefaultData(); data.nutrition.customFoods = [food]; data.nutrition.diary = [entry];
    expect(parseAppData(JSON.parse(JSON.stringify(data)))).toEqual(data);
    expect(() => createFoodLogEntry(food, Infinity, 'lunch', '2026-09-27')).toThrow(/positive/i);
  });
});

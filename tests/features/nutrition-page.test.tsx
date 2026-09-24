import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { NutritionPage } from '../../src/features/nutrition/NutritionPage';
import { commonFoods } from '../../src/data/foods/catalog';

describe('NutritionPage', () => {
  it('adds a catalog food to the selected meal and shows updated totals', async () => {
    const onAddEntry = vi.fn();
    render(<NutritionPage foods={commonFoods} entries={[]} targets={[]} onAddEntry={onAddEntry} onDeleteEntry={vi.fn()} onSaveCustomFood={vi.fn()} date="2026-09-24" />);
    await userEvent.click(screen.getByRole('button', { name: /add breakfast/i }));
    await userEvent.type(screen.getByLabelText(/search foods/i), 'chicken breast');
    await userEvent.click(screen.getByRole('button', { name: /chicken breast/i }));
    const serving = screen.getByRole('button', { name: /1 breast/i });
    expect(serving).toHaveAttribute('aria-pressed', 'true');
    const amount = screen.getByLabelText(/amount in grams/i);
    await userEvent.clear(amount);
    await userEvent.type(amount, '150');
    expect(serving).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByRole('button', { name: /add to breakfast/i }));
    expect(onAddEntry).toHaveBeenCalledWith(expect.objectContaining({ meal: 'breakfast', localDate: '2026-09-24', grams: 150, nutrients: expect.objectContaining({ proteinG: 46.5 }) }));
  });

  it('shows a saved target and food snapshot entries', () => {
    render(<NutritionPage foods={commonFoods} entries={[{ id: 'one', localDate: '2026-09-24', meal: 'lunch', foodId: null, foodName: 'My lunch', grams: 200, servingDescription: '1 bowl', nutrients: { caloriesKcal: 550, proteinG: 35, carbsG: 60, fatG: 18, fiberG: 8, sodiumMg: 500 }, source: 'custom', sourceId: null }]} targets={[{ id: 'target', effectiveFrom: '2026-09-01', mode: 'manual', caloriesKcal: 2200, proteinG: 150, carbsG: 250, fatG: 65, formulaVersion: null }]} onAddEntry={vi.fn()} onDeleteEntry={vi.fn()} onSaveCustomFood={vi.fn()} date="2026-09-24" />);
    expect(screen.getByText('550')).toBeInTheDocument();
    expect(screen.getByText(/of 2,200 kcal/i)).toBeInTheDocument();
    expect(screen.getByText('My lunch')).toBeInTheDocument();
  });
});

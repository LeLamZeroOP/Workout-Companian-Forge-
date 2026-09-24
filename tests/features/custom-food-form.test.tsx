import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CustomFoodForm } from '../../src/features/nutrition/CustomFoodForm';

describe('CustomFoodForm', () => {
  it('requires a name and positive serving size', async () => {
    render(<CustomFoodForm onSave={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /save custom food/i }));
    expect(screen.getByText(/enter a food name/i)).toBeInTheDocument();
    expect(screen.getByText(/serving weight must be greater than zero/i)).toBeInTheDocument();
  });

  it('saves normalized per-100g nutrient data', async () => {
    const onSave = vi.fn();
    render(<CustomFoodForm onSave={onSave} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/^food name/i), 'Protein bowl');
    await userEvent.type(screen.getByLabelText(/serving weight/i), '250');
    await userEvent.type(screen.getByLabelText(/calories per serving/i), '500');
    await userEvent.type(screen.getByLabelText(/protein per serving/i), '30');
    await userEvent.type(screen.getByLabelText(/carbs per serving/i), '50');
    await userEvent.type(screen.getByLabelText(/fat per serving/i), '20');
    await userEvent.click(screen.getByRole('button', { name: /save custom food/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Protein bowl', source: 'custom', nutrientsPer100g: expect.objectContaining({ caloriesKcal: 200, proteinG: 12, carbsG: 20, fatG: 8 }) }));
  });
});

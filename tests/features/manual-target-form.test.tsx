import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ManualTargetForm } from '../../src/features/nutrition/ManualTargetForm';

describe('ManualTargetForm', () => {
  it('saves entered calories and gram targets for its effective date', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ManualTargetForm effectiveFrom="2026-09-24" activeTarget={null} onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Calories per day'), '2300');
    await user.type(screen.getByLabelText('Protein in grams'), '160');
    await user.type(screen.getByLabelText('Carbs in grams'), '250');
    await user.type(screen.getByLabelText('Fat in grams'), '70');
    await user.click(screen.getByRole('button', { name: 'Save target' }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ effectiveFrom: '2026-09-24', mode: 'manual', caloriesKcal: 2300, proteinG: 160, carbsG: 250, fatG: 70, formulaVersion: null }));
  });

  it('rejects missing or negative inputs without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ManualTargetForm effectiveFrom="2026-09-24" activeTarget={null} onSave={onSave} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Save target' }));
    expect(screen.getByLabelText('Calories per day')).toHaveAccessibleDescription(/Enter calories/);
    expect(screen.getByLabelText('Calories per day')).toHaveFocus();
    await user.type(screen.getByLabelText('Calories per day'), '-500');
    await user.click(screen.getByRole('button', { name: 'Save target' }));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('copies the active target but creates a new dated version on a later day', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ManualTargetForm effectiveFrom="2026-09-24" activeTarget={{ id: 'old', effectiveFrom: '2026-09-01', mode: 'calculated', caloriesKcal: 2200, proteinG: 140, carbsG: 250, fatG: 60, formulaVersion: 'formula-v1' }} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Calories per day')).toHaveValue(2200);
    await user.click(screen.getByRole('button', { name: 'Save target' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ effectiveFrom: '2026-09-24', mode: 'manual', formulaVersion: null }));
    expect(onSave.mock.calls[0]?.[0].id).not.toBe('old');
  });
});

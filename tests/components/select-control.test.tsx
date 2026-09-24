import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SelectControl } from '../../src/components/SelectControl';

const options = [
  { value: 'female', label: 'Female equation' },
  { value: 'male', label: 'Male equation' },
];

describe('SelectControl', () => {
  it('opens a deliberate listbox and selects an option', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectControl label="Equation sex" value="female" options={options} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Equation sex' });
    expect(trigger).toHaveTextContent('Female equation');

    await user.click(trigger);
    expect(screen.getByRole('listbox', { name: 'Equation sex' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'Female equation' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: 'Male equation' }));
    expect(onChange).toHaveBeenCalledWith('male');
    expect(screen.queryByRole('listbox', { name: 'Equation sex' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('supports arrow keys, selection, escape, and focus return', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SelectControl label="Equation sex" value="female" options={options} onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Equation sex' });
    trigger.focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Female equation' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('male');
    expect(trigger).toHaveFocus();

    await user.keyboard('{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox', { name: 'Equation sex' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

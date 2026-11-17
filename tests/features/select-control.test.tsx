import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectControl } from '../../src/components/SelectControl';

it('keeps an unset selection empty and supports filtered keyboard selection', async () => {
  const user = userEvent.setup(); const change = vi.fn();
  render(<><SelectControl label="Exercise" searchable value="" onChange={change} options={[{ value: 'press', label: 'Chest press', description: 'Dumbbell' }, { value: 'row', label: 'Cable row', description: 'Cable' }]} /><button>Next field</button></>);
  expect(screen.getByText('Choose an option')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Exercise' }));
  expect(screen.getByRole('textbox')).toHaveFocus();
  await user.type(screen.getByRole('textbox'), 'row');
  expect(screen.queryByRole('option', { name: /Chest press/ })).not.toBeInTheDocument();
  await user.keyboard('{ArrowDown}{Enter}');
  expect(change).toHaveBeenCalledWith('row');
  expect(screen.getByRole('button', { name: 'Exercise' })).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Exercise' }));
  await user.type(screen.getByRole('textbox'), 'missing');
  expect(screen.getByRole('status')).toHaveTextContent('No matches');
  await user.keyboard('{Escape}{Tab}');
  expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
});

it('finds typed prefixes, cycles repeated letters and commits only on selection', async () => {
  const user = userEvent.setup(); const change = vi.fn();
  render(<SelectControl label="Equipment" value="cable" onChange={change} options={[
    { value: 'cable', label: 'Cable' }, { value: 'barbell', label: 'Barbell' }, { value: 'bodyweight', label: 'Bodyweight' }, { value: 'dumbbell', label: 'Dumbbell' },
  ]} />);
  const trigger = screen.getByRole('button', { name: 'Equipment' });
  trigger.focus(); await user.keyboard('b');
  expect(screen.getByRole('option', { name: 'Barbell' })).toHaveFocus();
  await user.keyboard('b');
  expect(screen.getByRole('option', { name: 'Bodyweight' })).toHaveFocus();
  expect(change).not.toHaveBeenCalled();
  await user.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
  await user.keyboard('du');
  expect(screen.getByRole('option', { name: 'Dumbbell' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(change).toHaveBeenCalledWith('dumbbell');
});

it('expires typed prefixes and ignores modified shortcuts', async () => {
  const user = userEvent.setup(); const time = vi.spyOn(Date, 'now');
  time.mockReturnValue(1000);
  render(<SelectControl label="Choice" value="a" onChange={vi.fn()} options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'd', label: 'Delta' }]} />);
  screen.getByRole('button', { name: 'Choice' }).focus();
  await user.keyboard('{Control>}b{/Control}');
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  await user.keyboard('b');
  expect(screen.getByRole('option', { name: 'Beta' })).toHaveFocus();
  time.mockReturnValue(1800);
  await user.keyboard('d');
  expect(screen.getByRole('option', { name: 'Delta' })).toHaveFocus();
  time.mockRestore();
});

it('closes the earlier menu when another is opened by keyboard', async () => {
  const user = userEvent.setup(); const options = [{ value: 'a', label: 'Alpha' }];
  render(<><SelectControl label="First" value="a" onChange={vi.fn()} options={options} /><SelectControl label="Second" value="a" onChange={vi.fn()} options={options} /></>);
  await user.click(screen.getByRole('button', { name: 'First' }));
  screen.getByRole('button', { name: 'Second' }).focus();
  await user.keyboard('{ArrowDown}');
  expect(screen.getAllByRole('listbox')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'First' })).toHaveAttribute('aria-expanded', 'false');
});

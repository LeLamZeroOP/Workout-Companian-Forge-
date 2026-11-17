import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MeasurementHistory } from '../../src/features/body/MeasurementHistory';
import { FoodSearch } from '../../src/features/nutrition/FoodSearch';
import { commonFoods } from '../../src/data/foods/catalog';

it('lets a reader review additional measurements and notes without entering the editor', async () => {
  const onEdit = vi.fn();
  render(<MeasurementHistory entries={[{ id: 'measurement', recordedAt: '2026-10-08T12:00:00.000Z', localDate: '2026-10-08', weightKg: 80, bodyFatPercent: null, waistCm: 85.5, chestCm: null, hipsCm: null, upperArmCm: 35, thighCm: null, notes: 'Morning reading\nBefore breakfast' }]} onEdit={onEdit} onDelete={vi.fn()} />);
  await userEvent.click(screen.getByText(/Measurements and notes/));
  expect(screen.getByText('85.5 cm')).toBeVisible();
  expect(screen.getByText('35 cm')).toBeVisible();
  expect(screen.getByText(/Morning reading/)).toBeVisible();
  expect(onEdit).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Edit measurement' })).toHaveAccessibleDescription(/Oct 8, 2026, 80 kg/);
});

it('orders Recent foods by diary recency rather than favorites or catalog order', async () => {
  const first = commonFoods[0]!;
  const recent = commonFoods[1]!;
  render(<FoodSearch foods={[{ ...first, favorite: true }, recent]} recentFoodIds={[recent.id, first.id]} onSelect={vi.fn()} />);
  await userEvent.click(screen.getByRole('button', { name: 'Recent' }));
  const items = screen.getAllByRole('listitem');
  expect(items[0]).toHaveTextContent(recent.name);
  expect(items[1]).toHaveTextContent(first.name);
});

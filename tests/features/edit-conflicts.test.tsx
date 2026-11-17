import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { createDefaultData } from '../../src/data/defaults';
import { BodyProfileForm } from '../../src/features/body/BodyProfileForm';
import { BodyPage } from '../../src/features/body/BodyPage';
import { NutritionPage } from '../../src/features/nutrition/NutritionPage';
import { ManualTargetForm } from '../../src/features/nutrition/ManualTargetForm';
import { createFoodLogEntry } from '../../src/domain/nutrition';
import { commonFoods } from '../../src/data/foods/catalog';
import type { BodyMeasurement, BodyProfile } from '../../src/domain/models';

it('blocks a stale program edit and lets the user load the saved version', async () => {
  const data = createDefaultData();
  const save = vi.fn();
  const props = { programs: data.programs, exerciseCatalog: data.exercises, onSave: save, onDelete: vi.fn(), onSaveExercise: vi.fn() };
  const { rerender } = render(<ProgramsPage {...props} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.clear(screen.getByLabelText('Program name'));
  await user.type(screen.getByLabelText('Program name'), 'My unsaved draft');
  rerender(<ProgramsPage {...props} programs={[{ ...data.programs[0]!, name: 'Other tab program' }]} />);
  expect(screen.getByRole('alert')).toHaveTextContent('This program changed elsewhere');
  expect(screen.getByLabelText('Program name')).toHaveValue('My unsaved draft');
  expect(screen.getByRole('button', { name: 'Save program' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Load saved program' }));
  expect(screen.getByLabelText('Program name')).toHaveValue('Other tab program');
  await user.click(screen.getByRole('button', { name: 'Save program' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Other tab program' }));
});

it('does not recreate a program deleted elsewhere from an old editor', async () => {
  const data = createDefaultData();
  const save = vi.fn();
  const props = { programs: data.programs, exerciseCatalog: data.exercises, onSave: save, onDelete: vi.fn(), onSaveExercise: vi.fn() };
  const { rerender } = render(<ProgramsPage {...props} />);
  await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
  rerender(<ProgramsPage {...props} programs={[]} />);
  expect(screen.getByRole('alert')).toHaveTextContent('This program was deleted elsewhere');
  expect(screen.getByRole('button', { name: 'Save program' })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
});

it('preserves an unsaved profile but blocks overwriting a changed profile', async () => {
  const profile: BodyProfile = { birthDate: '1996-01-01', heightCm: 180, equationSex: 'male', activityLevel: 'moderate', goal: 'maintain', targetMode: 'manual' };
  const save = vi.fn();
  const { rerender } = render(<BodyProfileForm initial={profile} onSave={save} onCancel={vi.fn()} />);
  rerender(<BodyProfileForm initial={{ ...profile, heightCm: 190 }} onSave={save} onCancel={vi.fn()} />);
  expect(screen.getByLabelText('Height in centimeters')).toHaveValue(180);
  expect(screen.getByRole('alert')).toHaveTextContent('This profile changed elsewhere');
  await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
  expect(save).not.toHaveBeenCalled();
});

it('blocks a stale measurement editor without discarding its draft', async () => {
  const entry: BodyMeasurement = { id: 'm', recordedAt: '2026-10-08T10:00:00Z', localDate: '2026-10-08', weightKg: 80, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
  const save = vi.fn();
  const props = { profile: null, measurements: [entry], onSaveProfile: vi.fn(), onSaveMeasurement: save, onDeleteMeasurement: vi.fn() };
  const { rerender } = render(<BodyPage {...props} />);
  await userEvent.click(screen.getByRole('button', { name: 'Edit measurement' }));
  rerender(<BodyPage {...props} measurements={[{ ...entry, weightKg: 90 }]} />);
  expect(screen.getByLabelText('Weight in kilograms')).toHaveValue(80);
  expect(screen.getByRole('alert')).toHaveTextContent('This measurement changed elsewhere');
  expect(screen.getByRole('button', { name: 'Save measurement' })).toBeDisabled();
});

it('keeps diary edits visible when that entry changes elsewhere', async () => {
  const entry = createFoodLogEntry(commonFoods[0]!, 100, 'lunch', '2026-10-08');
  const save = vi.fn();
  const props = { date: entry.localDate, foods: [], entries: [entry], targets: [], onAddEntry: save, onDeleteEntry: vi.fn(), onSaveCustomFood: vi.fn() };
  const { rerender } = render(<NutritionPage {...props} />);
  await userEvent.click(screen.getByRole('button', { name: `Edit entry ${entry.foodName}` }));
  await userEvent.clear(screen.getByLabelText('Amount in grams'));
  await userEvent.type(screen.getByLabelText('Amount in grams'), '150');
  rerender(<NutritionPage {...props} entries={[{ ...entry, grams: 200 }]} />);
  expect(screen.getByRole('alert')).toHaveTextContent('This entry changed elsewhere');
  expect(screen.getByLabelText('Amount in grams')).toHaveValue(150);
  expect(screen.getByRole('button', { name: 'Save entry' })).toBeDisabled();
});

it('blocks a target draft when a newer effective target is received', async () => {
  const target = { id: 't', effectiveFrom: '2026-10-08', mode: 'manual' as const, caloriesKcal: 2000, proteinG: 150, carbsG: 250, fatG: 70, formulaVersion: null };
  const save = vi.fn();
  const { rerender } = render(<ManualTargetForm effectiveFrom={target.effectiveFrom} activeTarget={target} onSave={save} onCancel={vi.fn()} />);
  rerender(<ManualTargetForm effectiveFrom={target.effectiveFrom} activeTarget={{ ...target, caloriesKcal: 2500 }} onSave={save} onCancel={vi.fn()} />);
  expect(screen.getByRole('alert')).toHaveTextContent('This target changed elsewhere');
  expect(screen.getByLabelText('Calories per day')).toHaveValue(2000);
  expect(screen.getByRole('button', { name: 'Save target' })).toBeDisabled();
});

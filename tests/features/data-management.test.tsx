import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { DataManagement } from '../../src/features/settings/DataManagement';

function populatedData() {
  const data = createDefaultData();
  data.sessions.push({ id: 'session-1', programId: null, programName: 'Imported', workoutTemplateId: null, workoutName: 'Push', startedAt: '2026-09-24T08:00:00.000Z', completedAt: '2026-09-24T09:00:00.000Z', notes: '', exercises: [], guide: { currentExerciseId: null, currentSetId: null, restTimer: null } });
  data.body.measurements.push({ id: 'body-1', recordedAt: '2026-09-24T07:00:00.000Z', weightKg: 80, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' });
  data.nutrition.targets.push({ id: 'target-1', effectiveFrom: '2026-09-24', mode: 'manual', caloriesKcal: 2400, proteinG: 150, carbsG: 270, fatG: 80, formulaVersion: null });
  data.nutrition.customFoods.push({ id: 'food-1', name: 'My yogurt', brand: null, category: 'dairy', preparation: 'plain', source: 'custom', sourceId: null, dataVersion: 'user', nutrientsPer100g: { caloriesKcal: 100, proteinG: 10, carbsG: 5, fatG: 4, fiberG: null, sodiumMg: null }, servings: [{ name: 'cup', grams: 200 }] });
  data.nutrition.diary.push({ id: 'entry-1', localDate: '2026-09-24', meal: 'breakfast', foodId: 'food-1', foodName: 'My yogurt', grams: 200, servingDescription: '1 cup', nutrients: { caloriesKcal: 200, proteinG: 20, carbsG: 10, fatG: 8, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null });
  return data;
}

describe('DataManagement', () => {
  it('downloads the complete versioned data document', async () => {
    const createObjectUrl = vi.fn(() => 'blob:forge-backup');
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const data = populatedData();
    render(<DataManagement data={data} onImport={vi.fn()} onReset={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /download backup/i }));

    expect(createObjectUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:forge-backup');
    click.mockRestore();
  });

  it('previews a valid import and replaces data only after confirmation', async () => {
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(<DataManagement data={createDefaultData()} onImport={onImport} onReset={vi.fn()} />);

    const file = new File([JSON.stringify(populatedData())], 'forge-backup.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/choose backup file/i), file);

    expect(await screen.findByRole('heading', { name: /review import/i })).toBeInTheDocument();
    expect(screen.getByText('1 body entry')).toBeInTheDocument();
    expect(screen.getByText('1 diary entry')).toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /replace my data/i }));
    expect(screen.getByRole('alertdialog', { name: /replace all local data/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^replace data$/i }));
    expect(onImport).toHaveBeenCalledWith(expect.objectContaining({ version: 2 }));
  });

  it('rejects an invalid import without exposing a replacement action', async () => {
    const onImport = vi.fn();
    const user = userEvent.setup();
    render(<DataManagement data={createDefaultData()} onImport={onImport} onReset={vi.fn()} />);

    await user.upload(screen.getByLabelText(/choose backup file/i), new File(['{"version":99}'], 'bad.json', { type: 'application/json' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/unsupported.*version/i);
    expect(screen.queryByRole('button', { name: /replace my data/i })).not.toBeInTheDocument();
    expect(onImport).not.toHaveBeenCalled();
  });

  it('requires confirmation before a scoped reset', async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(<DataManagement data={createDefaultData()} onImport={vi.fn()} onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /reset body data/i }));
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog', { name: /reset body data/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^reset body$/i }));
    expect(onReset).toHaveBeenCalledWith('body');
  });
});

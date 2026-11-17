import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgramsPage } from '../../src/features/programs/ProgramsPage';
import { createDefaultData } from '../../src/data/defaults';
import { validateAppData } from '../../src/data/validateAppData';

function readBlob(blob: Blob) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsText(blob); });
}

it('downloads one program as a Forge file from its card', async () => {
  const blobs: Blob[] = [];
  const names: string[] = [];
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:forge-split'; }) });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { names.push(this.download); });
  const data = createDefaultData();
  data.programs.push({ ...structuredClone(data.programs[0]!), id: 'second-program', name: 'Second program' });
  const onSave = vi.fn();
  render(<ProgramsPage programs={data.programs} exerciseCatalog={data.exercises} onSave={onSave} onDelete={vi.fn()} onSaveExercise={vi.fn()} />);

  await userEvent.click(screen.getByRole('button', { name: 'Export Starter Strength' }));

  expect(click).toHaveBeenCalledOnce();
  expect(names[0]).toMatch(/^forge-split-starter-strength-\d{4}-\d{2}-\d{2}\.forge\.json$/);
  const exported = validateAppData(JSON.parse(await readBlob(blobs[0]!)));
  expect(exported.programs.map(program => program.name)).toEqual(['Starter Strength']);
  expect(exported.exercises.map(exercise => exercise.id).sort()).toEqual(['db-chest-press', 'lat-pulldown', 'leg-press']);
  expect(exported.sessions).toEqual([]);
  expect(onSave).not.toHaveBeenCalled();
  click.mockRestore();
});

import { createDefaultData } from '../../src/data/defaults';
import { LocalStorageWorkoutRepository, StorageDataError, resetDataScope } from '../../src/data/localStorageRepository';

describe('local workout repository', () => {
  it('loads defaults without writing them on first use', () => {
    const repository = new LocalStorageWorkoutRepository(localStorage);
    const data = repository.load();

    expect(data.version).toBe(2);
    expect(data.programs.length).toBeGreaterThan(0);
    expect(localStorage.getItem('workout-tracker:data')).toBeNull();
  });

  it('round trips saved data', () => {
    const repository = new LocalStorageWorkoutRepository(localStorage);
    const data = createDefaultData();
    data.settings.restAlertSound = false;

    repository.save(data);
    expect(repository.load()).toEqual(data);
  });

  it('rejects corrupt data without overwriting it', () => {
    const repository = new LocalStorageWorkoutRepository(localStorage);
    localStorage.setItem('workout-tracker:data', '{broken');

    expect(() => repository.load()).toThrow(StorageDataError);
    expect(localStorage.getItem('workout-tracker:data')).toBe('{broken');
  });

  it('rejects unsupported schema versions', () => {
    const repository = new LocalStorageWorkoutRepository(localStorage);
    localStorage.setItem('workout-tracker:data', JSON.stringify({ version: 99 }));
    expect(() => repository.load()).toThrow(/version/i);
  });

  it('exports, imports, and clears data', () => {
    const repository = new LocalStorageWorkoutRepository(localStorage);
    const json = JSON.stringify(createDefaultData());
    const imported = repository.importJson(json);
    repository.save(imported);

    expect(repository.exportJson()).toContain('Dumbbell Chest Press');
    repository.clear();
    expect(localStorage.getItem('workout-tracker:data')).toBeNull();
  });

  it('atomically replaces a complete backup and leaves current data untouched when validation fails', () => {
    const repository = new LocalStorageWorkoutRepository(localStorage);
    const current = createDefaultData();
    const imported = createDefaultData();
    imported.body.measurements.push({ id: 'body-1', recordedAt: '2026-09-24T07:00:00.000Z', weightKg: 80, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' });
    repository.save(current);

    expect(repository.replaceFromJson(JSON.stringify(imported)).body.measurements).toHaveLength(1);
    expect(repository.load().body.measurements).toHaveLength(1);
    expect(() => repository.replaceFromJson('{"version":99}')).toThrow(/version/i);
    expect(repository.load().body.measurements).toHaveLength(1);
  });

  it('resets only the requested data scope', () => {
    const data = createDefaultData();
    data.body.measurements.push({ id: 'body-1', recordedAt: '2026-09-24T07:00:00.000Z', weightKg: 80, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' });
    data.nutrition.diary.push({ id: 'entry-1', localDate: '2026-09-24', meal: 'breakfast', foodId: null, foodName: 'Quick calories', grams: 0, servingDescription: 'Quick add', nutrients: { caloriesKcal: 200, proteinG: 0, carbsG: 0, fatG: 0, fiberG: null, sodiumMg: null }, source: 'custom', sourceId: null });

    const reset = resetDataScope(data, 'body');

    expect(reset.body).toEqual({ profile: null, measurements: [] });
    expect(reset.nutrition.diary).toHaveLength(1);
    expect(reset.programs).toHaveLength(data.programs.length);
  });
});

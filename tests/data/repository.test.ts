import { createDefaultData } from '../../src/data/defaults';
import { LocalStorageWorkoutRepository, StorageDataError } from '../../src/data/localStorageRepository';

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
});

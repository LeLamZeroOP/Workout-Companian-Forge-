import { createDefaultData, createDefaultDataV1 } from '../../src/data/defaults';
import { parseAppData } from '../../src/data/migrations';

describe('version 2 migration', () => {
  it('migrates version 1 without changing workout records', () => {
    const old = createDefaultDataV1();
    const migrated = parseAppData(old);

    expect(migrated.version).toBe(4);
    expect(migrated.programs).toEqual(old.programs);
    expect(migrated.sessions).toEqual(old.sessions);
    expect(migrated.body).toEqual({ profile: null, measurements: [] });
    expect(migrated.nutrition).toEqual({ targets: [], customFoods: [], diary: [] });
  });

  it('keeps valid version 2 data intact', () => {
    const version2 = createDefaultData();

    expect(parseAppData(version2)).toEqual(version2);
  });
});

it('migrates a genuine v2 backup to v4 without changing historical values', () => {
  const original = createDefaultData();
  original.body.measurements = [{ id: 'old', recordedAt: '2026-09-26T12:00:00Z', weightKg: 80, notes: '', bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null }];
  const migrated = parseAppData({ ...original, version: 2 });
  expect(migrated.version).toBe(4); expect(migrated.body).toEqual(original.body); expect(migrated.programs).toEqual(original.programs);
});

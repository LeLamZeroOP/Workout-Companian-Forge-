import { createDefaultData, createDefaultDataV1 } from '../../src/data/defaults';
import { parseAppData } from '../../src/data/migrations';

describe('version 2 migration', () => {
  it('migrates version 1 without changing workout records', () => {
    const old = createDefaultDataV1();
    const migrated = parseAppData(old);

    expect(migrated.version).toBe(2);
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

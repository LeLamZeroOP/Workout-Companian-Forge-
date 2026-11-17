import { createDefaultData } from '../../src/data/defaults';
import { validateAppData } from '../../src/data/validateAppData';

describe('validateAppData', () => {
  it('accepts a complete V2 document', () => {
    const data = createDefaultData();
    expect(validateAppData(data)).toEqual(data);
  });

  it('rejects malformed nested session records', () => {
    const data = createDefaultData();
    data.sessions.push({ id: 'broken' } as never);
    expect(() => validateAppData(data)).toThrow(/session/i);
  });

  it('rejects invalid nutrition numbers and duplicate record IDs', () => {
    const data = createDefaultData();
    data.nutrition.targets.push({ id: 'one', effectiveFrom: '2026-09-24', mode: 'manual', caloriesKcal: -100, proteinG: 0, carbsG: 0, fatG: 0, formulaVersion: null });
    expect(() => validateAppData(data)).toThrow(/calories/i);
    data.nutrition.targets[0]!.caloriesKcal = 2000;
    data.nutrition.targets.push({ ...data.nutrition.targets[0]! });
    expect(() => validateAppData(data)).toThrow(/duplicate/i);
  });

  it('rejects unsupported versions and oversized input', () => {
    const data = createDefaultData();
    expect(() => validateAppData({ ...data, version: 99 })).toThrow(/version/i);
    data.programs[0]!.notes = 'x'.repeat(10 * 1024 * 1024);
    expect(() => validateAppData(data)).toThrow(/size/i);
  });
});

it('refuses invalid dates, missing portion bases, and invalid merge ledgers before writing', () => {
  const data = createDefaultData();
  data.nutrition.targets = [{ id: 'target', effectiveFrom: '2026-02-31', mode: 'manual', caloriesKcal: 2000, proteinG: 100, carbsG: 200, fatG: 60, formulaVersion: null }];
  expect(() => validateAppData(data)).toThrow(/date/i);
  data.nutrition.targets = [];
  expect(() => validateAppData({ ...data, mergeLedger: { mappings: [], receipts: [{ id: 'receipt', at: '2026-09-27T12:00:00Z', counts: { added: -1, replaced: 0, copied: 0, skipped: 0, linked: 0 } }] } })).toThrow(/added/i);
});

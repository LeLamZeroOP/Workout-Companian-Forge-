import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { parseAppData } from '../../src/data/migrations';

describe('schema 4 migration', () => {
  it('preserves legacy records and round trips', () => {
    const legacy = { ...structuredClone(createDefaultData()), version: 3 };
    const next = parseAppData(legacy);
    expect(next.version).toBe(4);
    expect(next.sessions).toEqual(legacy.sessions);
    expect(next.programs[0]?.volumePlan).toBeUndefined();
    expect(parseAppData(JSON.parse(JSON.stringify(next)))).toEqual(next);
  });

  it('rejects invalid cycle references and target bounds', () => {
    const data = createDefaultData();
    data.programs[0]!.volumePlan = { goal: 'hypertrophy', cycle: { slots: ['missing-workout'] }, targets: [] };
    expect(() => parseAppData(data)).toThrow(/cycle/);
    data.programs[0]!.volumePlan.cycle!.slots = [data.programs[0]!.workouts[0]!.id];
    data.programs[0]!.volumePlan.targets = [{ muscle: 'chest', lower: 12, upper: 10, basis: 'direct', period: 'cycle', priority: 'focus' }];
    expect(() => parseAppData(data)).toThrow(/lower exceeds upper/);
  });

  it.each([
    { slots: [null, null], error: /training day/ },
    { slots: Array(29).fill('starter-push'), error: /at most 28/ },
  ])('rejects invalid cycle shape', ({ slots, error }) => {
    const data = createDefaultData();
    data.programs[0]!.volumePlan = { goal: 'custom', cycle: { slots }, targets: [] };
    expect(() => parseAppData(data)).toThrow(error);
  });

  it('rejects overlapping and malformed reviewed roles', () => {
    const data = createDefaultData();
    data.exercises[0]!.muscleRoles = { direct: ['chest'], indirect: ['chest'], reviewedAt: '2026-09-30', source: 'user' };
    expect(() => parseAppData(data)).toThrow(/repeated muscle/);
    data.exercises[0]!.muscleRoles.indirect = [];
    data.exercises[0]!.muscleRoles.reviewedAt = '2026-02-30';
    expect(() => parseAppData(data)).toThrow(/date/);
  });

  it('rejects non-finite targets and an average without a cycle', () => {
    const data = createDefaultData();
    data.programs[0]!.volumePlan = { goal: 'custom', targets: [{ muscle: 'chest', lower: Number.NaN, upper: 10, basis: 'direct', period: 'cycle', priority: 'focus' }] };
    expect(() => parseAppData(data)).toThrow(/valid number/);
    data.programs[0]!.volumePlan.targets[0]!.lower = 0;
    data.programs[0]!.volumePlan.targets[0]!.period = 'sevenDayAverage';
    expect(() => parseAppData(data)).toThrow(/needs a cycle/);
  });
});

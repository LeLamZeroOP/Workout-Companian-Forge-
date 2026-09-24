import { getLatestMeasurement, getWeightChange, getWeightTrend, validateBodyMeasurement } from '../../src/domain/bodyMeasurements';
import type { BodyMeasurement } from '../../src/domain/models';

function measurement(id: string, recordedAt: string, weightKg: number): BodyMeasurement {
  return { id, recordedAt, weightKg, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
}

describe('body measurements', () => {
  it('validates required weight and optional measurement ranges', () => {
    expect(validateBodyMeasurement({ ...measurement('bad', '2026-09-20T08:00:00.000Z', 0), bodyFatPercent: 80, waistCm: 10 })).toMatchObject({
      weightKg: expect.any(String), bodyFatPercent: expect.any(String), waistCm: expect.any(String),
    });
    expect(validateBodyMeasurement(measurement('valid', '2026-09-20T08:00:00.000Z', 80))).toEqual({});
  });

  it('keeps the final entry per local day and calculates a trailing average', () => {
    const entries = [
      measurement('early', '2026-09-20T07:00:00', 80.2),
      measurement('one', '2026-09-20T18:00:00', 80),
      measurement('two', '2026-09-21T08:00:00', 79.8),
    ];
    expect(getWeightTrend(entries)).toEqual([
      { date: '2026-09-20', weightKg: 80, movingAverageKg: 80 },
      { date: '2026-09-21', weightKg: 79.8, movingAverageKg: 79.9 },
    ]);
  });

  it('returns the latest entry and change between the latest two entries', () => {
    const entries = [measurement('later', '2026-09-22T08:00:00', 79.5), measurement('earlier', '2026-09-20T08:00:00', 80)];
    expect(getLatestMeasurement(entries)?.id).toBe('later');
    expect(getWeightChange(entries)).toBeCloseTo(-0.5);
    expect(getWeightChange(entries.slice(0, 1))).toBeNull();
  });
});

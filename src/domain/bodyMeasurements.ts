import type { BodyMeasurement } from './models';

export type BodyMeasurementErrors = Partial<Record<'recordedAt' | 'weightKg' | 'bodyFatPercent' | 'waistCm' | 'chestCm' | 'hipsCm' | 'upperArmCm' | 'thighCm', string>>;

function localDateKey(value: string): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validateBodyMeasurement(entry: BodyMeasurement): BodyMeasurementErrors {
  const errors: BodyMeasurementErrors = {};
  if (Number.isNaN(new Date(entry.recordedAt).getTime())) errors.recordedAt = 'Choose a valid date and time.';
  if (!Number.isFinite(entry.weightKg) || entry.weightKg < 20 || entry.weightKg > 500) errors.weightKg = 'Weight must be from 20 to 500 kg.';
  if (entry.bodyFatPercent !== null && (!Number.isFinite(entry.bodyFatPercent) || entry.bodyFatPercent < 1 || entry.bodyFatPercent > 75)) errors.bodyFatPercent = 'Body fat must be from 1% to 75%.';
  const circumferences = ['waistCm', 'chestCm', 'hipsCm', 'upperArmCm', 'thighCm'] as const;
  for (const field of circumferences) {
    const value = entry[field];
    if (value !== null && (!Number.isFinite(value) || value < 20 || value > 300)) errors[field] = 'Measurement must be from 20 to 300 cm.';
  }
  return errors;
}

export function getLatestMeasurement(entries: BodyMeasurement[]): BodyMeasurement | null {
  return [...entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0] ?? null;
}

export function getWeightChange(entries: BodyMeasurement[]): number | null {
  const sorted = [...entries].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  return sorted.length > 1 ? sorted[0]!.weightKg - sorted[1]!.weightKg : null;
}

export function getWeightTrend(entries: BodyMeasurement[]): Array<{ date: string; weightKg: number; movingAverageKg: number }> {
  const finalByDate = new Map<string, BodyMeasurement>();
  for (const entry of [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))) finalByDate.set(localDateKey(entry.recordedAt), entry);
  const daily = [...finalByDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  return daily.map(([date, entry], index) => {
    const window = daily.slice(Math.max(0, index - 6), index + 1);
    const average = window.reduce((sum, [, item]) => sum + item.weightKg, 0) / window.length;
    return { date, weightKg: entry.weightKg, movingAverageKg: Math.round(average * 100) / 100 };
  });
}

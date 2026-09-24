import { TrendChart } from '../../components/TrendChart';
import { getWeightTrend } from '../../domain/bodyMeasurements';
import type { BodyMeasurement } from '../../domain/models';

export function WeightTrendChart({ measurements }: { measurements: BodyMeasurement[] }) {
  const trend = getWeightTrend(measurements);
  if (!trend.length) return null;
  return <TrendChart data={trend} series={[{ key: 'weightKg', label: 'Weight', unit: 'kg' }, { key: 'movingAverageKg', label: '7-entry average', unit: 'kg' }]} tableLabel="Weight trend data" sharedAxis />;
}

import type { WorkoutSession } from '../../domain/models';
import { getDailyVolumeTrend } from '../../domain/progress';
import { TrendChart } from '../../components/TrendChart';

export function DailyVolumeProgress({ sessions }: { sessions: WorkoutSession[] }) {
  const trend = getDailyVolumeTrend(sessions);
  if (!trend.length) return <div className="analytics-card empty-analytics"><h3>No volume data yet</h3><p>Finish a workout to begin your daily trend.</p></div>;
  const total = trend.reduce((sum, day) => sum + day.volumeKg, 0);
  return <section className="analytics-card"><div className="chart-heading"><div><p className="eyebrow">Recorded volume</p><strong>{total.toLocaleString()} kg</strong><span>{trend.length} training {trend.length === 1 ? 'day' : 'days'}</span></div><p>All completed exercises</p></div><TrendChart data={trend} series={[{ key: 'volumeKg', label: 'Volume', unit: 'kg' }]} tableLabel="Daily volume trend data" /></section>;
}

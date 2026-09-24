import type { WorkoutSession } from '../../domain/models';
import { getExercisePersonalBest, getExerciseTrend } from '../../domain/progress';
import { TrendChart } from '../../components/TrendChart';

export function ExerciseProgress({ sessions, exerciseId }: { sessions: WorkoutSession[]; exerciseId: string }) {
  const trend = getExerciseTrend(sessions, exerciseId);
  const personalBest = getExercisePersonalBest(sessions, exerciseId);
  if (!trend.length) return <div className="analytics-card empty-analytics"><h3>No exercise data yet</h3><p>Complete a weighted set to begin this trend.</p></div>;
  return (
    <section className="analytics-card">
      <div className="chart-heading"><div><p className="eyebrow">Personal best</p><strong>{personalBest?.weightKg ?? 0} kg</strong><span>{personalBest?.reps ?? 0} reps</span></div><p>Heaviest completed set</p></div>
      <TrendChart data={trend} series={[{ key: 'maxWeightKg', label: 'Top weight', unit: 'kg' }, { key: 'volumeKg', label: 'Volume', unit: 'kg' }]} tableLabel="Exercise trend data" />
    </section>
  );
}

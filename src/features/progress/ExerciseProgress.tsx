import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { WorkoutSession } from '../../domain/models';
import { getExercisePersonalBest, getExerciseTrend } from '../../domain/progress';
import { TrendChart } from '../../components/TrendChart';
import type { TrendSeries } from '../../components/TrendChart';
import { formatDisplayDate } from '../../domain/calendar';

const metrics: Array<TrendSeries & { buttonLabel: string }> = [
  { key: 'maxWeightKg', label: 'Top weight', buttonLabel: 'Top load', unit: 'kg' },
  { key: 'volumeKg', label: 'Volume', buttonLabel: 'Volume', unit: 'kg' },
  { key: 'totalReps', label: 'Repetitions', buttonLabel: 'Reps', unit: 'reps', singularUnit: 'rep', integer: true },
  { key: 'completedSets', label: 'Completed sets', buttonLabel: 'Sets', unit: 'sets', singularUnit: 'set', integer: true },
];

export function ExerciseProgress({ sessions, exerciseId, includeWarmups = false, periodFiltered = false }: { periodFiltered?: boolean; includeWarmups?: boolean; sessions: WorkoutSession[]; exerciseId: string }) {
  const [metric, setMetric] = useState('maxWeightKg');
  const trend = getExerciseTrend(sessions, exerciseId, includeWarmups);
  const personalBest = getExercisePersonalBest(sessions, exerciseId, includeWarmups);
  const recordSession = sessions.find(session => session.completedAt && session.exercises.some(exercise => exercise.exerciseId === exerciseId && exercise.sets.some(set => set.id === personalBest?.id)));
  if (!trend.length) return <div className="analytics-card empty-analytics"><h3>No recorded sets for this exercise</h3><p>Try another period or complete a valid set to begin this trend.</p></div>;
  return (
    <section className="analytics-card">
      <div className="chart-heading"><div><p className="eyebrow">{periodFiltered ? 'Best in selected period' : 'Personal best'}</p><strong>{personalBest?.weightKg ?? 0} kg</strong><span>{personalBest?.reps ?? 0} reps</span></div><p>Load record · higher reps break ties; exact ties use the earliest session. {recordSession?.completedAt && formatDisplayDate(new Date(recordSession.completedAt))}</p></div>
      <SegmentedControl className="exercise-metrics" label="Exercise metric" value={metric} onChange={setMetric} options={metrics.map(item => ({ value: item.key, label: item.buttonLabel }))} /><p className="field-help">{metric === 'totalReps' || metric === 'completedSets' ? 'Daily totals for this exercise. Reps and sets also track bodyweight work logged at 0 kg.' : 'Volume = recorded kg × reps. Loads retain your original per-hand or combined convention; no conversion is inferred.'}</p><TrendChart data={trend} series={metrics.filter(item => item.key === metric)} tableLabel="Exercise trend data" />
    </section>
  );
}

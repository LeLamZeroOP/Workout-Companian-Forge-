import { ChevronRight, Scale, Utensils } from 'lucide-react';
import type { BodyMeasurement, FoodLogEntry, NutritionTarget } from '../../domain/models';
import { getLatestMeasurement, getWeightChange, getWeightTrend } from '../../domain/bodyMeasurements';
import { getDiaryTotal, getEffectiveTarget } from '../../domain/foodDiary';
import { formatMacro, incompleteMacros } from '../../domain/nutrition';
import { ProgressMeter } from '../../components/ProgressMeter';

export function TodayBalance({ measurements, entries, targets, date, onLogWeight, onAddFood }: { measurements: BodyMeasurement[]; entries: FoodLogEntry[]; targets: NutritionTarget[]; date: string; onLogWeight: () => void; onAddFood: () => void }) {
  const latest = getLatestMeasurement(measurements);
  const change = getWeightChange(measurements);
  const total = getDiaryTotal(entries);
  const target = getEffectiveTarget(targets, date);
  const incomplete = incompleteMacros(entries).length > 0;
  const weights = getWeightTrend(measurements).slice(-12).map(point => point.weightKg);
  return <div className="today-secondary-grid">
    <section className="today-compact-card daily-body-card" aria-label="Daily body summary"><div>
      <span className="metric-icon"><Scale size={18} aria-hidden="true" /></span><p className="eyebrow">Body</p>
      <h3>{latest ? `${latest.weightKg} kg` : 'No weight logged'}</h3>
      {latest && <time className="today-record-date" dateTime={latest.localDate ?? latest.recordedAt}>{new Date(latest.localDate ? latest.localDate + 'T12:00:00' : latest.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</time>}
      <p>{change === null ? latest ? 'Add another entry to see change.' : 'Start a private weight trend.' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change).toFixed(1)} kg from your previous entry`}</p>
      {weights.length > 1 && <WeightPreview weights={weights} />}
      {latest && <span className="daily-card-context">{measurements.length} recorded {measurements.length === 1 ? 'measurement' : 'measurements'} · latest value shown</span>}
    </div><button className="secondary-action" type="button" onClick={onLogWeight}>Log weight<ChevronRight size={16} aria-hidden="true" /></button></section>
    <section className="today-compact-card daily-nutrition-card" aria-label="Daily nutrition overview"><div>
      <span className="metric-icon"><Utensils size={18} aria-hidden="true" /></span><p className="eyebrow">Nutrition</p>
      <h3>{entries.length ? `${Math.round(total.caloriesKcal).toLocaleString()}${target ? ` of ${target.caloriesKcal.toLocaleString()}` : ''} kcal` : 'No food logged today'}</h3>
      <p>{entries.length ? `${formatMacro(total.proteinG)} protein · ${formatMacro(total.carbsG)} carbs · ${formatMacro(total.fatG)} fat${incomplete ? ' · Known totals, incomplete data' : ''}` : 'Add a meal to begin today’s totals.'}</p>
      {target && <div className="daily-target-progress"><ProgressMeter label="Recorded calories toward daily target" value={total.caloriesKcal} max={target.caloriesKcal} valueText={`${Math.round(total.caloriesKcal)} of ${target.caloriesKcal} kcal recorded`} /><span>{total.caloriesKcal > target.caloriesKcal ? `${Math.round(total.caloriesKcal - target.caloriesKcal).toLocaleString()} kcal above your target` : `${Math.round(target.caloriesKcal - total.caloriesKcal).toLocaleString()} kcal to your target`}</span></div>}
      {entries.length > 0 && <span className="daily-card-context">{entries.length} food {entries.length === 1 ? 'entry' : 'entries'} today{!target ? ' · no target set' : ''}</span>}
    </div><button className="secondary-action" type="button" onClick={onAddFood}>Add food<ChevronRight size={16} aria-hidden="true" /></button></section>
  </div>;
}

function WeightPreview({ weights }: { weights: number[] }) {
  const low = Math.min(...weights); const high = Math.max(...weights);
  const points = weights.map((value, index) => `${4 + index / (weights.length - 1) * 232},${high === low ? 22 : 36 - (value - low) / (high - low) * 28}`).join(' ');
  return <svg className="daily-weight-preview" viewBox="0 0 240 44" aria-hidden="true" preserveAspectRatio="none"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

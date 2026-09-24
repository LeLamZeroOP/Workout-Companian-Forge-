import type { Nutrients, NutritionTarget } from '../../domain/models';

function Metric({ label, value, target, unit }: { label: string; value: number; target?: number; unit: string }) {
  const percent = target ? Math.min(100, value / target * 100) : 0;
  return <div className="macro-metric"><div><span>{label}</span><strong><span>{Math.round(value).toLocaleString()}</span>{unit}</strong></div><p>{target ? `${Math.round(value).toLocaleString()} of ${target.toLocaleString()}${unit}` : 'No target set'}</p><div className="macro-track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div></div>;
}

export function MacroSummary({ total, target }: { total: Nutrients; target: NutritionTarget | null }) {
  return <section className="macro-summary" aria-label="Daily nutrition summary">
    <Metric label="Calories" value={total.caloriesKcal} target={target?.caloriesKcal} unit=" kcal" />
    <Metric label="Protein" value={total.proteinG} target={target?.proteinG} unit=" g" />
    <Metric label="Carbs" value={total.carbsG} target={target?.carbsG} unit=" g" />
    <Metric label="Fat" value={total.fatG} target={target?.fatG} unit=" g" />
  </section>;
}

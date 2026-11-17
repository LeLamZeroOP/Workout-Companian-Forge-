import type { ReactNode } from 'react';
import type { Nutrients, NutritionTarget } from '../../domain/models';

function Metric({ label, value, target, unit, incomplete }: { label: string; value: number | null; target?: number; unit: string; incomplete?: boolean }) {
  const percent = target && value !== null && !incomplete ? Math.min(100, value / target * 100) : 0;
  return <div className="macro-metric"><div><span>{label}</span><strong><span>{value === null ? 'Unknown' : Math.round(value).toLocaleString()}</span>{value === null ? '' : <small>{unit}</small>}</strong></div><p>{incomplete ? 'Known total · incomplete data' : target && value !== null ? `${Math.round(value).toLocaleString()} of ${target.toLocaleString()}${unit}` : 'No target set'}</p><div className="macro-track" aria-hidden="true"><span style={{ transform: `scaleX(${percent / 100})` }} /></div></div>;
}

export function MacroSummary({ total, target, incomplete = [], children }: { total: Nutrients; target: NutritionTarget | null; incomplete?: string[]; children?: ReactNode }) {
  return <section className="macro-summary" aria-label="Daily nutrition summary">
    <Metric label="Calories" value={total.caloriesKcal} target={target?.caloriesKcal} unit=" kcal" />
    <Metric label="Protein" value={total.proteinG} target={target?.proteinG} unit=" g" incomplete={incomplete.includes('proteinG')} />
    <Metric label="Carbs" value={total.carbsG} target={target?.carbsG} unit=" g" incomplete={incomplete.includes('carbsG')} />
    <Metric label="Fat" value={total.fatG} target={target?.fatG} unit=" g" incomplete={incomplete.includes('fatG')} />
    {children && <div className="macro-summary-footer">{children}</div>}
  </section>;
}

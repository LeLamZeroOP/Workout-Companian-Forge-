import { useState } from 'react';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { ExerciseDefinition, MuscleGroup, Program } from '../../domain/models';
import { muscleLabels } from '../../domain/muscleSets';
import { compareMuscleTarget, normalizeVolume, summarizeProgramVolume } from '../../domain/programMuscleVolume';

const fmt = (value: number | null) => value === null ? 'Unknown' : Number.isInteger(value) ? String(value) : value.toFixed(1);

export function ProgramMuscleSummary({ program, exercises, collapsible = false }: { program: Program; exercises: ExerciseDefinition[]; collapsible?: boolean }) {
  const [period, setPeriod] = useState<'cycle' | 'sevenDayAverage'>('cycle');
  const [basis, setBasis] = useState<'direct' | 'weighted'>('direct');
  const raw = summarizeProgramVolume(program, exercises);
  const normalized = period === 'sevenDayAverage' ? normalizeVolume(raw) : null;
  const summary = normalized ?? raw;
  const completeWeighted = raw.missingDefinitionIds.length === 0;
  const currentPeriod = normalized ? 'Average per 7 days if repeated as written' : raw.periodDays === null ? 'Per pass through listed workouts' : `${raw.periodDays}-day cycle`;

  function targetStatus(muscle: MuscleGroup, value: number | null) {
    const target = program.volumePlan?.targets.find(item => item.muscle === muscle && item.basis === basis);
    if (!target) return 'No target';
    if (raw.periodDays === null || (basis === 'weighted' && !completeWeighted)) return 'Unknown';
    const factor = target.period === period ? 1 : target.period === 'cycle' ? 7 / raw.periodDays! : raw.periodDays! / 7;
    const verdict = compareMuscleTarget(value, { ...target, lower: target.lower * factor, upper: target.upper * factor });
    return verdict === 'unknown' ? 'Unknown' : verdict === 'below' ? 'Below your range' : verdict === 'above' ? 'Above your range' : verdict === 'within' ? 'Within your range' : 'No target';
  }

  const performed = <strong>{fmt(summary.performedSets)} performed sets</strong>;
  const body = <>
    <p className="field-help">{currentPeriod}. Working sets are counted once per exercise; muscle rows can overlap. Weighted contributions use your saved coefficients and are estimates.</p>
    {raw.unknownExerciseIds.length > 0 && <p className="field-help">Direct and indirect counts are unknown because {raw.unknownExerciseIds.length} exercise definition{raw.unknownExerciseIds.length === 1 ? '' : 's'} lack reviewed roles.</p>}
    {raw.missingDefinitionIds.length > 0 && <p role="alert">{raw.missingDefinitionIds.length} exercise definitions are missing. Weighted totals are partial.</p>}
    {raw.periodDays !== null && <SegmentedControl label="Volume period" value={period} onChange={setPeriod} options={[{ value: 'cycle', label: 'Cycle' }, { value: 'sevenDayAverage', label: '7-day average' }]} />}
    <SegmentedControl label="Set counting basis" value={basis} onChange={setBasis} options={[{ value: 'direct', label: 'Direct sets' }, { value: 'weighted', label: 'Weighted contributions' }]} />
    <div className="table-scroll"><table className="data-table"><caption>Muscle sets</caption><thead><tr><th scope="col">Muscle</th><th scope="col">{basis === 'direct' ? 'Direct sets' : 'Weighted'}</th>{basis === 'direct' && <th scope="col">Indirect sets</th>}<th scope="col">Sessions</th><th scope="col">Your range</th></tr></thead><tbody>{summary.rows.map(row => {
      const value = basis === 'direct' ? row.directSets : completeWeighted ? row.weightedSets : null;
      return <tr key={row.muscle}><th scope="row">{muscleLabels[row.muscle]}</th><td>{fmt(value)}</td>{basis === 'direct' && <td>{fmt(row.indirectSets)}</td>}<td>{fmt(row.directSessions)}</td><td>{targetStatus(row.muscle, value)}</td></tr>;
    })}</tbody></table></div>
  </>;
  // In the program editor the table is review material, so it starts collapsed with its total visible.
  if (collapsible) return <details className="program-muscle-summary is-collapsible"><summary><span><span className="eyebrow">Current plan</span><span className="summary-title">Muscle sets</span></span>{raw.missingDefinitionIds.length > 0 && <span className="summary-warning">Partial totals</span>}{performed}</summary><div className="program-muscle-summary-body">{body}</div></details>;
  return <section className="program-muscle-summary">
    <div className="section-heading"><div><p className="eyebrow">Current plan</p><h3>Muscle sets</h3></div>{performed}</div>
    {body}
  </section>;
}

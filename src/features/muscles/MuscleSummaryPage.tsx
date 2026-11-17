import { useState } from 'react';
import { SelectControl } from '../../components/SelectControl';
import { SegmentedControl } from '../../components/SegmentedControl';
import type { ExerciseDefinition, Program, WorkoutSession } from '../../domain/models';
import { getMuscleSetTotals, muscleGroups, muscleLabels, summarizeCompletedMuscleVolume } from '../../domain/muscleSets';
import { normalizeVolume, summarizeProgramVolume } from '../../domain/programMuscleVolume';
import { formatDisplayDate, isCalendarDate } from '../../domain/calendar';
import { useCurrentDay } from '../../hooks/useCurrentDay';

type Period = 'week' | 'month' | 'all' | 'custom';

function dateInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function periodRange(period: Period, now: Date, sessions: WorkoutSession[], customFrom: string, customTo: string): [Date, Date] {
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  if (period === 'week') { const start = new Date(now); start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); start.setHours(0, 0, 0, 0); return [start, end]; }
  if (period === 'month') { const start = new Date(now.getFullYear(), now.getMonth(), 1); return [start, end]; }
  if (period === 'custom') { return [new Date(`${customFrom}T00:00:00`), new Date(`${customTo}T23:59:59.999`)]; }
  const dates = sessions.filter((session) => session.completedAt).map((session) => new Date(session.completedAt!).getTime());
  return [new Date(dates.length ? Math.min(...dates) : now.getTime()), end];
}

function setLabel(value: number) { return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, '')} ${value === 1 ? 'set' : 'sets'}`; }

export function MuscleSummaryPage({ sessions, programs = [], exercises = [], now: fixedNow }: { sessions: WorkoutSession[]; programs?: Program[]; exercises?: ExerciseDefinition[]; now?: Date }) {
  const now = useCurrentDay(fixedNow);
  const [period, setPeriod] = useState<Period>('week');
  const [showAll, setShowAll] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(programs[0]?.id ?? '');
  const [includeOtherPrograms, setIncludeOtherPrograms] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(dateInputValue(now));
  const [from, to] = periodRange(period, now, sessions, customFrom, customTo);
  const rangeValid = period !== 'custom' || (isCalendarDate(customFrom) && isCalendarDate(customTo) && customFrom <= customTo);
  const totals = getMuscleSetTotals(sessions, from, to);
  const rows = muscleGroups.map((muscle) => ({ muscle, value: totals[muscle] ?? 0 })).filter((row) => showAll || row.value > 0).sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((row) => row.value), 1);
  const selectedProgram = programs.find(program => program.id === selectedProgramId) ?? programs[0];
  const matchingSessions = sessions.filter(session => session.completedAt && new Date(session.completedAt) >= from && new Date(session.completedAt) <= to && (includeOtherPrograms || session.programId === selectedProgram?.id));
  const completed = summarizeCompletedMuscleVolume(matchingSessions);
  const plan = selectedProgram ? summarizeProgramVolume(selectedProgram, exercises) : null;
  const planWeek = plan ? normalizeVolume(plan) : null;

  return (
    <section className="analytics-stack">
      <div className="analytics-intro"><p className="eyebrow">Effective volume</p><h2>Muscle set balance</h2><p>Each completed working set is multiplied by its saved muscle coefficients. Four sets at chest 1.0 and triceps 0.5 count as four chest and two triceps contributions, not six performed sets. These are bookkeeping estimates, not exact measures of stimulus.</p></div>
      <div className="analytics-toolbar muscle-toolbar">
        <SegmentedControl label="Muscle summary period" value={period} onChange={setPeriod} options={(['week', 'month', 'all', 'custom'] as Period[]).map(value => ({ value, label: value === 'all' ? 'All time' : value[0]!.toUpperCase() + value.slice(1) }))} />
        <label className="toggle-label"><input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />Show all muscles</label>
      </div>
      {period === 'custom' && <div className="date-range"><label>From<input type="date" value={customFrom} max={customTo} onChange={(event) => setCustomFrom(event.target.value)} /></label><label>To<input type="date" value={customTo} min={customFrom} onChange={(event) => setCustomTo(event.target.value)} /></label></div>}
      {rangeValid ? <><section className="analytics-card muscle-card">
        <div className="chart-heading"><div><p className="eyebrow">{from.toLocaleDateString([], { month: 'short', day: 'numeric' })} to {to.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p><strong>{Object.values(totals).reduce((sum, value) => sum + (value ?? 0), 0).toFixed(1)}</strong><span>weighted contributions</span></div><p>Warmups are excluded</p></div>
        {rows.length ? <div className="muscle-bars">{rows.map(({ muscle, value }) => <div className="muscle-row" key={muscle}><div><strong>{muscleLabels[muscle]}</strong><span>{setLabel(value)}</span></div><div className="bar-track" aria-hidden="true"><span style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div> : <div className="empty-analytics"><h3>No muscle sets in this period</h3><p>Try another range or complete a working set.</p></div>}
      </section>
      {selectedProgram && <section className="analytics-card plan-comparison"><div className="section-heading"><div><p className="eyebrow">Plan / Completed</p><h3>Current plan and recorded work</h3></div></div><p className="field-help">Compared with current plan. Completed sets use saved session snapshots and the selected date range; no missed-session or adherence estimate is implied.</p><SelectControl label="Plan" value={selectedProgram.id} onChange={setSelectedProgramId} options={programs.map(program => ({ value: program.id, label: program.name }))} /><label className="checkbox-label"><input type="checkbox" checked={includeOtherPrograms} onChange={event => setIncludeOtherPrograms(event.target.checked)} />Include sessions from other programs</label><p className="field-help">Plan: {planWeek ? 'average per 7 days if repeated as written' : 'one pass through listed workouts'} · Completed: {formatDisplayDate(from)} to {formatDisplayDate(to)}.</p>{completed.unknownExerciseIds.length > 0 && <p className="field-help">Some completed sessions lack reviewed roles; their direct counts are unknown. Weighted contributions remain available.</p>}<div className="table-scroll"><table className="data-table"><caption>Planned and completed muscle sets</caption><thead><tr><th scope="col">Muscle</th><th scope="col">Current plan direct</th><th scope="col">Completed direct</th><th scope="col">Current plan weighted</th><th scope="col">Completed weighted</th></tr></thead><tbody>{muscleGroups.map(muscle => { const planned = (planWeek ?? plan)!.rows.find(row => row.muscle === muscle)!; const actual = completed.rows.find(row => row.muscle === muscle)!; return <tr key={muscle}><th scope="row">{muscleLabels[muscle]}</th><td>{planned.directSets === null ? 'Unknown' : planned.directSets.toFixed(1)}</td><td>{actual.directSets === null ? 'Unknown' : actual.directSets.toFixed(1)}</td><td>{plan!.missingDefinitionIds.length ? 'Partial' : planned.weightedSets.toFixed(1)}</td><td>{actual.weightedSets.toFixed(1)}</td></tr>; })}</tbody></table></div></section>}</> : <p className="error-banner" role="alert">Choose valid dates with the start on or before the end.</p>}
    </section>
  );
}

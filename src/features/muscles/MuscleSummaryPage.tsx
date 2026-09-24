import { useState } from 'react';
import type { WorkoutSession } from '../../domain/models';
import { getMuscleSetTotals, muscleGroups, muscleLabels } from '../../domain/muscleSets';

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

export function MuscleSummaryPage({ sessions, now = new Date() }: { sessions: WorkoutSession[]; now?: Date }) {
  const [period, setPeriod] = useState<Period>('week');
  const [showAll, setShowAll] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [customTo, setCustomTo] = useState(dateInputValue(now));
  const [from, to] = periodRange(period, now, sessions, customFrom, customTo);
  const totals = getMuscleSetTotals(sessions, from, to);
  const rows = muscleGroups.map((muscle) => ({ muscle, value: totals[muscle] ?? 0 })).filter((row) => showAll || row.value > 0).sort((a, b) => b.value - a.value);
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <section className="analytics-stack">
      <div className="analytics-intro"><p className="eyebrow">Effective volume</p><h2>Muscle set balance</h2><p>A working set is distributed using each exercise's saved muscle contribution.</p></div>
      <div className="analytics-toolbar muscle-toolbar">
        <div className="segmented-control" aria-label="Muscle summary period">
          {(['week', 'month', 'all', 'custom'] as Period[]).map((value) => <button type="button" key={value} className={period === value ? 'active' : ''} aria-pressed={period === value} onClick={() => setPeriod(value)}>{value === 'all' ? 'All time' : value[0]!.toUpperCase() + value.slice(1)}</button>)}
        </div>
        <label className="toggle-label"><input type="checkbox" checked={showAll} onChange={(event) => setShowAll(event.target.checked)} />Show all muscles</label>
      </div>
      {period === 'custom' && <div className="date-range"><label>From<input type="date" value={customFrom} max={customTo} onChange={(event) => setCustomFrom(event.target.value)} /></label><label>To<input type="date" value={customTo} min={customFrom} onChange={(event) => setCustomTo(event.target.value)} /></label></div>}
      <section className="analytics-card muscle-card">
        <div className="chart-heading"><div><p className="eyebrow">{from.toLocaleDateString([], { month: 'short', day: 'numeric' })} to {to.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p><strong>{Object.values(totals).reduce((sum, value) => sum + (value ?? 0), 0).toFixed(1)}</strong><span>weighted sets</span></div><p>Warmups are excluded</p></div>
        {rows.length ? <div className="muscle-bars">{rows.map(({ muscle, value }) => <div className="muscle-row" key={muscle}><div><strong>{muscleLabels[muscle]}</strong><span>{setLabel(value)}</span></div><div className="bar-track" aria-hidden="true"><span style={{ width: `${(value / max) * 100}%` }} /></div></div>)}</div> : <div className="empty-analytics"><h3>No muscle sets in this period</h3><p>Try another range or complete a working set.</p></div>}
      </section>
    </section>
  );
}

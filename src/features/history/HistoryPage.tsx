import { OverlayPresence } from '../../components/OverlayPresence';
import { useState } from 'react';
import { ChevronRight, Dumbbell } from 'lucide-react';
import type { WorkoutSession } from '../../domain/models';
import { getSessionSummary } from '../../domain/progress';
import { WorkoutDetail } from './WorkoutDetail';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CsvExportButton } from '../../components/CsvExportButton';
import { workoutHistoryCsv } from '../../domain/recordExports';
import { isCalendarDate, localDateString } from '../../domain/calendar';
import { DateRangeFilter } from '../../components/DateRangeFilter';

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min` : `${minutes} min`;
}

/** Sessions are already newest first; keep that order within and across months. */
function groupByMonth(sessions: WorkoutSession[]) {
  const groups: Array<{ key: string; label: string; sessions: WorkoutSession[] }> = [];
  for (const session of sessions) {
    const date = new Date(session.completedAt!);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const last = groups.at(-1);
    if (last?.key === key) last.sessions.push(session);
    else groups.push({ key, label: date.toLocaleDateString([], { month: 'long', year: 'numeric' }), sessions: [session] });
  }
  return groups;
}

export function HistoryPage({ sessions, onSave, onDelete, onOpenWorkout }: { onOpenWorkout?: () => void; onSave?: (session: WorkoutSession) => boolean | void; onDelete?: (sessionId: string) => boolean | void; sessions: WorkoutSession[] }) {
  const completed = sessions.filter((session) => session.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const invalidRange = Boolean((from && !isCalendarDate(from)) || (to && !isCalendarDate(to)) || (from && to && from > to));
  const matches = invalidRange ? [] : completed.filter(session => `${session.workoutName} ${session.programName} ${session.notes} ${session.exercises.map(item => `${item.exerciseName} ${item.notes}`).join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()) && (!from || new Date(session.completedAt!).getTime() >= new Date(`${from}T00:00:00`).getTime()) && (!to || new Date(session.completedAt!).getTime() <= new Date(`${to}T23:59:59.999`).getTime()));
  const selected = completed.find((session) => session.id === selectedId);
  if (selected) return <><WorkoutDetail key={selected.id} onSave={onSave} session={selected} onBack={() => { setSelectedId(null); setDeletingId(null); }} />{onDelete && <button type="button" className="danger-action history-delete" onClick={() => setDeletingId(selected.id)}>Delete workout</button>}<OverlayPresence>{deletingId === selected.id && onDelete && <ConfirmDialog title={`Delete ${selected.workoutName}?`} message="This removes this session and its sets from history and training summaries. Download a backup in Settings if you need to keep a copy." confirmLabel="Delete from history" onCancel={() => setDeletingId(null)} onConfirm={() => { if (onDelete(selected.id) === false) return; setDeletingId(null); setSelectedId(null); }} />}</OverlayPresence></>;
  if (!completed.length) return <section className="empty-stage"><p className="eyebrow">No history yet</p><h2>Complete your first workout.</h2><p>Your sets, volume, and exercise details will be saved here.</p>{onOpenWorkout && <div className="form-actions"><button className="primary-action" type="button" onClick={onOpenWorkout}><Dumbbell size={18} aria-hidden="true" />Start a workout</button></div>}</section>;

  return (
    <section className="analytics-stack">
      <div className="analytics-intro"><p className="eyebrow">Training archive</p><h2>{completed.length} completed {completed.length === 1 ? 'session' : 'sessions'}</h2><p>Open any workout to review every completed set.</p></div>
      <div className="analytics-filters history-filters"><label className="history-search">Search history<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Workout, exercise or notes" /></label>
        <DateRangeFilter from={from} to={to} invalid={invalidRange} onFrom={setFrom} onTo={setTo} />
        {(query || from || to) && <button className="secondary-action" type="button" onClick={() => { setQuery(''); setFrom(''); setTo(''); }}>Clear filters</button>}
        <CsvExportButton label="Export history CSV" fileName={`forge-workouts-${localDateString(new Date())}.csv`} disabled={!matches.length} buildCsv={() => workoutHistoryCsv(matches)} />
      </div>{invalidRange && <p className="field-error" role="alert">Choose valid dates with the start on or before the end.</p>}<p className="field-help" role="status">Showing {matches.length} of {completed.length} sessions</p>{!matches.length && !invalidRange && <p>No sessions match these filters.</p>}
      {groupByMonth(matches).map(group => <section className="history-group" key={group.key} aria-label={`${group.label}, ${group.sessions.length} ${group.sessions.length === 1 ? 'session' : 'sessions'}`}>
        <h3 className="history-group-title">{group.label}<small>{group.sessions.length} {group.sessions.length === 1 ? 'session' : 'sessions'}</small></h3>
        <div className="history-list">
        {group.sessions.map((session) => {
          const summary = getSessionSummary(session);
          const completedAt = new Date(session.completedAt!);
          return <button type="button" key={session.id} onClick={() => { setSelectedId(session.id); setDeletingId(null); }} aria-label={`Open ${session.workoutName} from ${session.programName}`}>
            <time dateTime={session.completedAt!}><strong>{completedAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}</strong><span>{completedAt.toLocaleDateString([], { weekday: 'short' })}</span></time>
            <div><strong>{session.workoutName}</strong><span>{session.programName}</span></div>
            <div className="history-metrics"><span>{summary.completedSets} {summary.completedSets === 1 ? 'set' : 'sets'}</span><span>{summary.volumeKg.toLocaleString()} kg</span>{summary.durationSeconds > 0 && <span>{formatDuration(summary.durationSeconds)}</span>}</div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>;
        })}
        </div>
      </section>)}
    </section>
  );
}

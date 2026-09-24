import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { WorkoutSession } from '../../domain/models';
import { getSessionSummary } from '../../domain/progress';
import { WorkoutDetail } from './WorkoutDetail';

export function HistoryPage({ sessions }: { sessions: WorkoutSession[] }) {
  const completed = sessions.filter((session) => session.completedAt).sort((a, b) => b.completedAt!.localeCompare(a.completedAt!));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = completed.find((session) => session.id === selectedId);
  if (selected) return <WorkoutDetail session={selected} onBack={() => setSelectedId(null)} />;
  if (!completed.length) return <section className="empty-stage"><p className="eyebrow">No history yet</p><h2>Complete your first workout.</h2><p>Your sets, volume, and exercise details will be saved here.</p></section>;

  return (
    <section className="analytics-stack">
      <div className="analytics-intro"><p className="eyebrow">Training archive</p><h2>{completed.length} completed {completed.length === 1 ? 'session' : 'sessions'}</h2><p>Open any workout to review every completed set.</p></div>
      <div className="history-list">
        {completed.map((session) => {
          const summary = getSessionSummary(session);
          return <button type="button" key={session.id} onClick={() => setSelectedId(session.id)} aria-label={`Open ${session.workoutName} from ${session.programName}`}>
            <time dateTime={session.completedAt!}><strong>{new Date(session.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}</strong><span>{new Date(session.completedAt!).getFullYear()}</span></time>
            <div><strong>{session.workoutName}</strong><span>{session.programName}</span></div>
            <div className="history-metrics"><span>{summary.completedSets} sets</span><span>{summary.volumeKg.toLocaleString()} kg</span></div>
            <ChevronRight size={18} aria-hidden="true" />
          </button>;
        })}
      </div>
    </section>
  );
}

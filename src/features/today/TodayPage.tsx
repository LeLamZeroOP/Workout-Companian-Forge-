import type { Program, WorkoutSession } from '../../domain/models';
import { ArrowRight, CalendarCheck, Dumbbell, Flame } from 'lucide-react';

export interface TodayPageProps {
  programs: Program[];
  sessions: WorkoutSession[];
  onPrimaryAction: () => void;
  now?: Date;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - ((day + 6) % 7));
  result.setHours(0, 0, 0, 0);
  return result;
}

export function TodayPage({ programs, sessions, onPrimaryAction, now = new Date() }: TodayPageProps) {
  const active = sessions.find((session) => session.completedAt === null);
  const completed = sessions.filter((session) => session.completedAt !== null);
  const latest = [...completed].sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))[0];
  const weekStart = startOfWeek(now).getTime();
  const weeklyCount = completed.filter((session) => new Date(session.completedAt!).getTime() >= weekStart && new Date(session.completedAt!).getTime() <= now.getTime()).length;
  const isFirstUse = programs.length === 0;
  const actionLabel = active ? 'Resume workout' : isFirstUse ? 'Create first program' : 'Start workout';

  return (
    <div className="today-layout">
      <section className="session-panel">
        <div>
          <p className="eyebrow">Today</p>
          <h2>{active ? `${active.workoutName} is in progress` : isFirstUse ? 'Build your first training plan.' : 'Start a training session.'}</h2>
          <p>{active ? `${active.programName} · Started ${new Date(active.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : isFirstUse ? 'Create a program, order your exercises, and set rest times before your first guided session.' : 'Choose a program and Forge will guide every set and rest period.'}</p>
        </div>
        <button className="primary-action" type="button" onClick={onPrimaryAction}>
          {actionLabel}<ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <aside className="overview-panel" aria-label="Training overview">
        <div className="metrics-strip">
          <section className="stat-block"><span className="metric-icon"><Flame size={18} aria-hidden="true" /></span><p>This week</p><strong>{weeklyCount}</strong><span>{weeklyCount === 1 ? '1 session this week' : `${weeklyCount} sessions this week`}</span></section>
          <section className="stat-block"><span className="metric-icon"><CalendarCheck size={18} aria-hidden="true" /></span><p>Programs</p><strong>{programs.length}</strong><span>{programs[0]?.name ?? 'None yet'}</span></section>
        </div>
        <section className="recent-card">
          <div className="section-heading"><h3>Latest workout</h3><Dumbbell size={20} aria-hidden="true" /></div>
          {latest ? <div className="recent-row"><div><strong>{latest.workoutName}</strong><span>{latest.programName}</span></div><time dateTime={latest.completedAt!}>{new Date(latest.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}</time></div> : <p className="muted">Completed workouts will appear here.</p>}
        </section>
      </aside>
    </div>
  );
}

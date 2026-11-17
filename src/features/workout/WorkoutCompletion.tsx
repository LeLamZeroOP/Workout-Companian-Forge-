import { useLayoutEffect, useRef } from 'react';
import { ArrowRight, Check, Clock3, Layers3, Weight } from 'lucide-react';
import type { WorkoutSession } from '../../domain/models';
import { getSessionSummary } from '../../domain/progress';

export function WorkoutCompletion({ session, saveStatus, onNext }: { session: WorkoutSession; saveStatus: string; onNext: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const summary = getSessionSummary(session);
  const warmups = getSessionSummary(session, true).completedSets - summary.completedSets;
  const minutes = Math.floor(summary.durationSeconds / 60);
  const seconds = summary.durationSeconds % 60;
  return <section className="workout-completion analytics-card" aria-label="Finished workout">
    <div className="completion-check" aria-hidden="true"><Check size={30} strokeWidth={2.5} /></div>
    <p className="eyebrow">Workout complete</p><h2 ref={heading} tabIndex={-1}>{session.workoutName}</h2>
    <p className="muted">{session.programName} · {new Date(session.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
    <div className="completion-metrics" aria-label="Completion summary">
      <div><Layers3 size={19} aria-hidden="true" /><strong>{summary.completedSets}</strong><span>Working {summary.completedSets === 1 ? 'set' : 'sets'}</span></div>
      <div><Clock3 size={19} aria-hidden="true" /><strong>{minutes}:{String(seconds).padStart(2, '0')}</strong><span>Duration</span></div>
      <div><Weight size={19} aria-hidden="true" /><strong>{summary.volumeKg.toLocaleString()} <small>kg</small></strong><span>Recorded volume</span></div>
    </div>
    <p className="field-help">Valid completed working sets only. Volume is recorded load × reps.{warmups > 0 && ` ${warmups} completed warm-up ${warmups === 1 ? 'set is' : 'sets are'} also retained in history.`}</p>
    <p className="completion-save-status" role="status">{saveStatus}</p>
    <div className="form-actions"><a className="primary-action" href="#history">View history<ArrowRight size={17} aria-hidden="true" /></a><button className="secondary-action" type="button" onClick={onNext}>Choose next workout</button><a className="text-action" href="#today">Back to Today</a></div>
  </section>;
}

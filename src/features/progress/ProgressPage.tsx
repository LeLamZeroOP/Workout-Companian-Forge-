import { useMemo, useState } from 'react';
import type { WorkoutSession } from '../../domain/models';
import { DailyVolumeProgress } from './DailyVolumeProgress';
import { ExerciseProgress } from './ExerciseProgress';

export function ProgressPage({ sessions }: { sessions: WorkoutSession[] }) {
  const exercises = useMemo(() => {
    const values = new Map<string, string>();
    sessions.filter((session) => session.completedAt).forEach((session) => session.exercises.forEach((exercise) => values.set(exercise.exerciseId, exercise.exerciseName)));
    return [...values.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions]);
  const [view, setView] = useState<'exercise' | 'daily'>('exercise');
  const [exerciseId, setExerciseId] = useState(() => exercises[0]?.id ?? '');

  if (!exercises.length) return <section className="empty-stage"><p className="eyebrow">No progress yet</p><h2>Your training trends start here.</h2><p>Complete a workout with weighted sets to unlock exercise and volume charts.</p></section>;
  return (
    <section className="analytics-stack">
      <div className="analytics-toolbar">
        <div className="segmented-control" aria-label="Progress view"> <button type="button" className={view === 'exercise' ? 'active' : ''} aria-pressed={view === 'exercise'} onClick={() => setView('exercise')}>Exercise</button><button type="button" className={view === 'daily' ? 'active' : ''} aria-pressed={view === 'daily'} onClick={() => setView('daily')}>Daily volume</button></div>
        {view === 'exercise' && <label className="compact-select">Exercise<select value={exerciseId} onChange={(event) => setExerciseId(event.target.value)}>{exercises.map((exercise) => <option value={exercise.id} key={exercise.id}>{exercise.name}</option>)}</select></label>}
      </div>
      {view === 'exercise' ? <ExerciseProgress sessions={sessions} exerciseId={exerciseId} /> : <DailyVolumeProgress sessions={sessions} />}
    </section>
  );
}

import { ArrowLeft, Clock3, Layers3, Weight } from 'lucide-react';
import type { WorkoutSession } from '../../domain/models';
import { getSessionSummary } from '../../domain/progress';
import { getSessionMuscleSets, muscleGroups, muscleLabels } from '../../domain/muscleSets';

function durationLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function WorkoutDetail({ session, onBack }: { session: WorkoutSession; onBack: () => void }) {
  const summary = getSessionSummary(session);
  const muscleSets = getSessionMuscleSets(session);
  return (
    <section className="detail-layout">
      <button className="text-action back-action" type="button" onClick={onBack}><ArrowLeft size={17} aria-hidden="true" />All workouts</button>
      <div className="detail-hero">
        <div><p className="eyebrow">{session.programName}</p><h2>{session.workoutName}</h2><p>{new Date(session.completedAt!).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
        <div className="summary-grid" aria-label="Workout summary">
          <div><Layers3 size={18} aria-hidden="true" /><strong>{summary.completedSets}</strong><span>sets</span></div>
          <div><Weight size={18} aria-hidden="true" /><strong>{summary.volumeKg.toLocaleString()} kg</strong><span>volume</span></div>
          <div><Clock3 size={18} aria-hidden="true" /><strong>{durationLabel(summary.durationSeconds)}</strong><span>duration</span></div>
        </div>
      </div>
      <section className="session-muscles" aria-labelledby="session-muscles-title">
        <div><p className="eyebrow">Effective volume</p><h3 id="session-muscles-title">Muscles trained</h3></div>
        <div className="muscle-chip-list">{muscleGroups.filter((muscle) => (muscleSets[muscle] ?? 0) > 0).sort((a, b) => (muscleSets[b] ?? 0) - (muscleSets[a] ?? 0)).map((muscle) => <span key={muscle}><strong>{muscleSets[muscle]}</strong>{muscleLabels[muscle]}</span>)}</div>
      </section>
      <div className="exercise-history-list">
        {session.exercises.map((exercise) => (
          <article className="history-exercise" key={exercise.id}>
            <div className="section-heading"><h3>{exercise.exerciseName}</h3><span className="muted">{exercise.sets.filter((set) => set.completed).length} completed</span></div>
            <div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Set</th><th scope="col">Type</th><th scope="col">Weight</th><th scope="col">Reps</th></tr></thead><tbody>
              {exercise.sets.filter((set) => set.completed).map((set, index) => <tr key={set.id}><td>{index + 1}</td><td>{set.kind}</td><td>{set.weightKg ?? 0} kg</td><td>{set.reps ?? 0}</td></tr>)}
            </tbody></table></div>
          </article>
        ))}
      </div>
    </section>
  );
}

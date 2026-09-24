import type { WorkoutSet } from '../../domain/models';

export function SetRow({ set, setNumber, onChange }: { set: WorkoutSet; setNumber: number; onChange: (set: WorkoutSet) => void }) {
  return <div className={set.completed ? 'set-row completed' : 'set-row'}>
    <span className="set-number">{setNumber}</span>
    <label>Weight <span className="sr-only">for set {setNumber}</span><input inputMode="decimal" type="number" min="0" max="1000" step="0.25" value={set.weightKg ?? ''} onChange={(event) => onChange({ ...set, weightKg: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label>Reps <span className="sr-only">for set {setNumber}</span><input inputMode="numeric" type="number" min="0" max="1000" value={set.reps ?? ''} onChange={(event) => onChange({ ...set, reps: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    <label>Type <span className="sr-only">for set {setNumber}</span><select value={set.kind} onChange={(event) => onChange({ ...set, kind: event.target.value as WorkoutSet['kind'] })}><option value="working">Working</option><option value="warmup">Warm-up</option></select></label>
    <span className="set-status">{set.completed ? 'Completed' : 'Not complete'}</span>
  </div>;
}

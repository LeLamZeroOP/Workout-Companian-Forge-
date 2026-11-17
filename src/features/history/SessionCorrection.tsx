import { NumberInput } from '../../components/NumberInput';
import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { useState } from 'react';
import type { WorkoutSession } from '../../domain/models';
import { validSetValues } from '../../domain/trainingMetrics';
import { getSessionSummary } from '../../domain/progress';

export function SessionCorrection({ session, onSave, onCancel }: { session: WorkoutSession; onSave: (session: WorkoutSession) => void; onCancel: () => void }) {
  const [baseline] = useState(() => JSON.stringify(session));
  const [draft, setDraft] = useState(() => structuredClone(session));
  const conflict = baseline !== JSON.stringify(session);
  const valid = draft.exercises.every(exercise => exercise.sets.every(set => (set.weightKg === null || (Number.isFinite(set.weightKg) && set.weightKg >= 0 && set.weightKg <= 100000)) && (set.reps === null || (Number.isInteger(set.reps) && set.reps > 0 && set.reps <= 10000)) && (!set.completed || validSetValues(set))));
  const summary = getSessionSummary(draft);
  const formRef = useUnsavedForm(draft);
  return <form ref={formRef} className="editor-form correction-form" onSubmit={event => { event.preventDefault(); if (valid && !conflict) onSave(draft); }}>
    <p className="eyebrow">History correction</p><h2>{session.workoutName}</h2><p>Changes update this saved session and its summaries. Your program template stays separate.</p>
    {conflict && <p role="alert">This session changed elsewhere. Cancel and reopen it before correcting.</p>}
    {draft.exercises.map((exercise, ei) => <fieldset key={exercise.id}><legend>{exercise.exerciseName}</legend>{exercise.sets.map((set, si) => <div className="correction-row" key={set.id}><strong>Set {si + 1} · {set.kind}</strong><label>Weight in kg<NumberInput aria-label={`${exercise.exerciseName} set ${si + 1} weight`} type="number" min="0" max="100000" step="any" value={set.weightKg ?? ''} onChange={event => { const next = structuredClone(draft); next.exercises[ei]!.sets[si]!.weightKg = event.target.value === '' ? null : Number(event.target.value); setDraft(next); }} /></label><label>Reps<NumberInput aria-label={`${exercise.exerciseName} set ${si + 1} reps`} type="number" min="1" max="10000" step="1" value={set.reps ?? ''} onChange={event => { const next = structuredClone(draft); next.exercises[ei]!.sets[si]!.reps = event.target.value === '' ? null : Number(event.target.value); setDraft(next); }} /></label><label className="checkbox-label"><input aria-label={`${exercise.exerciseName} set ${si + 1} completed`} type="checkbox" checked={set.completed} onChange={event => { const next = structuredClone(draft); next.exercises[ei]!.sets[si]!.completed = event.target.checked; setDraft(next); }} />Completed</label></div>)}</fieldset>)}
    <p aria-live="polite">Preview: {summary.completedSets} working sets · {summary.volumeKg.toLocaleString()} kg volume</p>{!valid && <p role="alert">Completed sets need a non-negative load and positive whole reps.</p>}
    <div className="form-actions"><button className="primary-action" disabled={!valid || conflict}>Save corrections</button><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button></div>
  </form>;
}

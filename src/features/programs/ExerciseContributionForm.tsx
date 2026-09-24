import { useState } from 'react';
import type { ExerciseDefinition, MuscleGroup } from '../../domain/models';

const muscleGroups: MuscleGroup[] = ['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];
const labels: Record<MuscleGroup, string> = { chest: 'Chest', lats: 'Lats', upperBack: 'Upper back', frontDelts: 'Front delts', sideDelts: 'Side delts', rearDelts: 'Rear delts', biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs' };

export function ExerciseContributionForm({ exercise, onSave, onCancel }: { exercise: ExerciseDefinition; onSave: (exercise: ExerciseDefinition) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => structuredClone(exercise));
  const [error, setError] = useState('');
  return <form className="editor-form" onSubmit={(event) => { event.preventDefault(); if (!draft.name.trim()) { setError('Exercise name is required.'); return; } if (Object.keys(draft.muscleContribution).length === 0) { setError('Select at least one muscle contribution.'); return; } onSave(draft); }}>
    <div className="field"><label htmlFor="exercise-name">Exercise name</label><input id="exercise-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div>
    <fieldset className="contribution-grid"><legend>Effective sets per working set</legend>{muscleGroups.map((muscle) => <label key={muscle}>{labels[muscle]}<select value={draft.muscleContribution[muscle] ?? 0} onChange={(event) => setDraft((current) => { const next = structuredClone(current); const value = Number(event.target.value); if (value === 0) delete next.muscleContribution[muscle]; else next.muscleContribution[muscle] = value; return next; })}>{[0, .25, .5, .75, 1].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</fieldset>
    {error && <p className="field-error" role="alert">{error}</p>}
    <div className="form-actions"><button className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="primary-action" type="submit">Save exercise</button></div>
  </form>;
}

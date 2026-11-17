import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { useState } from 'react';
import type { Equipment, ExerciseDefinition, MuscleGroup } from '../../domain/models';
import { SelectControl } from '../../components/SelectControl';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { canonical } from '../../domain/canonical';

const muscleGroups: MuscleGroup[] = ['chest', 'lats', 'upperBack', 'frontDelts', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'abs'];
const labels: Record<MuscleGroup, string> = { chest: 'Chest', lats: 'Lats', upperBack: 'Upper back', frontDelts: 'Front delts', sideDelts: 'Side delts', rearDelts: 'Rear delts', biceps: 'Biceps', triceps: 'Triceps', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes', calves: 'Calves', abs: 'Abs' };

export function ExerciseContributionForm({ exercise, onSave, onCancel, saveDisabled = false }: { saveDisabled?: boolean; exercise: ExerciseDefinition; onSave: (exercise: ExerciseDefinition) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(() => structuredClone(exercise));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useValidationFocus(errors);
  useUnsavedForm(draft, formRef);
  const [baseline] = useState(() => canonical(exercise));
  const changed = canonical(draft) !== baseline;
  const setRole = (muscle: MuscleGroup, role: 'direct' | 'indirect' | 'none') => setDraft(current => {
    const next = structuredClone(current);
    const direct = (next.muscleRoles?.direct ?? []).filter(item => item !== muscle);
    const indirect = (next.muscleRoles?.indirect ?? []).filter(item => item !== muscle);
    if (role === 'direct') direct.push(muscle);
    if (role === 'indirect') indirect.push(muscle);
    if (!direct.length && !indirect.length) delete next.muscleRoles;
    else next.muscleRoles = { direct, indirect, reviewedAt: new Date().toISOString().slice(0, 10), source: 'user' };
    return next;
  });
  return <form ref={formRef} noValidate className="editor-form" onSubmit={(event) => { event.preventDefault(); if (saveDisabled) return; if (!draft.name.trim()) { setErrors({ name: 'Exercise name is required.' }); return; } if (Object.keys(draft.muscleContribution).length === 0) { setErrors({ contribution: 'Select at least one muscle contribution.' }); return; } setErrors({}); onSave(draft); }}>
    <section className="editor-section" aria-labelledby="exercise-basics-title"><h3 id="exercise-basics-title" className="editor-section-title"><span aria-hidden="true">1</span>Basics</h3>
    <div className="exercise-basics">
    <ValidatedField label="Exercise name" error={errors.name} maxLength={200} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
    <SelectControl label="Equipment" value={draft.equipment} onChange={value => setDraft(current => ({ ...current, equipment: value as Equipment }))} options={(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'other'] as Equipment[]).map(value => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }))} />
    <SelectControl label="Chest emphasis" value={draft.chestEmphasis ?? ''} onChange={value => setDraft(current => { const next = { ...current }; if (value) next.chestEmphasis = value as ExerciseDefinition['chestEmphasis']; else delete next.chestEmphasis; return next; })} options={[{ value: '', label: 'Unspecified' }, { value: 'upper', label: 'Upper chest' }, { value: 'mid', label: 'Mid chest' }, { value: 'mixed', label: 'Mixed' }]} />
    </div>
    <label>Setup notes<textarea maxLength={2000} value={draft.setupNotes ?? ''} onChange={event => setDraft(current => ({ ...current, setupNotes: event.target.value }))} /></label>
    </section>
    <section className="editor-section" aria-labelledby="exercise-mapping-title"><h3 id="exercise-mapping-title" className="editor-section-title"><span aria-hidden="true">2</span>Muscle mapping<small>{Object.keys(draft.muscleContribution).length} weighted · {(draft.muscleRoles?.direct.length ?? 0) + (draft.muscleRoles?.indirect.length ?? 0)} with roles</small></h3>
    <p className="field-help">Weighted contributions and reviewed roles are separate classifications. Leaving every role unselected keeps direct counts unknown in plans containing this exercise. New sessions save a snapshot; past sessions do not change.</p>
    <div className="mapping-grids">
    <fieldset className="contribution-grid"><legend>Effective sets per working set</legend>{muscleGroups.map(muscle => <SelectControl key={muscle} error={muscle === "chest" ? errors.contribution : undefined} compact displayLabel={labels[muscle]} label={`${labels[muscle]} contribution`} value={String(draft.muscleContribution[muscle] ?? 0)} onChange={selected => setDraft(current => { const next = structuredClone(current); const value = Number(selected); if (value === 0) delete next.muscleContribution[muscle]; else next.muscleContribution[muscle] = value; return next; })} options={[0, .25, .5, .75, 1].map(value => ({ value: String(value), label: String(value) }))} />)}</fieldset>
    <fieldset className="contribution-grid"><legend>Reviewed muscle roles</legend>{muscleGroups.map(muscle => <SelectControl key={muscle} compact displayLabel={labels[muscle]} label={`${labels[muscle]} role`} value={draft.muscleRoles?.direct.includes(muscle) ? 'direct' : draft.muscleRoles?.indirect.includes(muscle) ? 'indirect' : 'none'} onChange={value => setRole(muscle, value as 'direct' | 'indirect' | 'none')} options={[{ value: 'none', label: 'Unknown / none' }, { value: 'direct', label: 'Direct' }, { value: 'indirect', label: 'Indirect' }]} />)}</fieldset>
    </div>
    </section>
    <div className="editor-action-bar"><p className={changed ? 'editor-draft-status is-changed' : 'editor-draft-status'} role="status">{changed ? 'Unsaved changes' : 'No changes yet'}</p><div className="form-actions"><button className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="primary-action" type="submit" disabled={saveDisabled}>Save exercise</button></div></div>
  </form>;
}

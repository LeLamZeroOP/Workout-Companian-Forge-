import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { useState } from 'react';
import type { Equipment, ExerciseDefinition, MuscleGroup } from '../../domain/models';
import { muscleGroups, muscleLabels } from '../../domain/muscleSets';
import { SelectControl } from '../../components/SelectControl';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { WorkoutEditDialog } from './WorkoutEditDialog';

export function CreateWorkoutExerciseDialog({ replacing, disabled, onSave, onCancel, saveError }: {
  replacing: boolean; disabled: boolean; onSave: (definition: ExerciseDefinition) => boolean; onCancel: () => void; saveError?: string;
}) {
  const [id] = useState(() => `custom-${crypto.randomUUID()}`);
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState<Equipment>('other');
  const [muscle, setMuscle] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const formRef = useValidationFocus(errors);
  useUnsavedForm([name, equipment, muscle, notes], formRef);
  return <WorkoutEditDialog title="Create custom exercise" onCancel={onCancel} saveError={saveError}>
    <p className="muted">Save to your exercise library and {replacing ? 'replace the unfinished sets of this movement. Completed sets keep their original exercise.' : 'add three working sets to this workout.'}</p>
    <form ref={formRef} className="editor-form" noValidate onSubmit={event => {
      event.preventDefault();
      if (disabled) return;
      const nextErrors: Record<string, string> = {};
      if (!name.trim() || name.trim().length > 200) nextErrors.name = 'Enter an exercise name of 1–200 characters.';
      if (!muscle) nextErrors.muscle = 'Choose a primary muscle.';
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) return;
      const definition: ExerciseDefinition = { id, name: name.trim(), equipment, isCustom: true, muscleContribution: { [muscle]: 1 }, muscleRoles: { direct: [muscle as MuscleGroup], indirect: [], source: 'user', reviewedAt: new Date().toISOString().slice(0, 10) }, setupNotes: notes.trim() };
      let saved = false;
      try { saved = onSave(definition); } catch { /* Retain this form and ID for retry. */ }
      setFailed(!saved);
    }}>
      <ValidatedField label="Exercise name" value={name} maxLength={200} error={errors.name} onChange={event => setName(event.target.value)} />
      <SelectControl label="Equipment" value={equipment} disabled={disabled} onChange={value => setEquipment(value as Equipment)} options={(['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'band', 'other'] as Equipment[]).map(value => ({ value, label: value[0]!.toUpperCase() + value.slice(1) }))} />
      <SelectControl label="Primary muscle" value={muscle} error={errors.muscle} disabled={disabled} onChange={setMuscle} options={muscleGroups.map(value => ({ value, label: muscleLabels[value] }))} />
      <p className="field-help">Each working set counts as one direct set for this muscle. Edit additional muscle contributions later in Programs.</p>
      <label>Setup notes<textarea maxLength={2000} value={notes} onChange={event => setNotes(event.target.value)} /></label>
      {disabled && <p role="alert">Close this panel and resolve the workout change before continuing.</p>}
      {failed && !saveError && <p role="alert">The exercise and workout could not be saved. Your entries are still here; try again.</p>}
      <div className="form-actions"><button type="button" className="secondary-action" onClick={onCancel}>Cancel</button><button type="submit" className="primary-action" disabled={disabled}>{replacing ? 'Create and replace' : 'Create and add'}</button></div>
    </form>
  </WorkoutEditDialog>;
}

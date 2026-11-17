import { useState } from 'react';
import type { ExerciseDefinition } from '../../domain/models';
import { SelectControl } from '../../components/SelectControl';
import { WorkoutEditDialog } from './WorkoutEditDialog';

export function AddExerciseDialog({ catalog, disabled, onAdd, onCancel, onCreate, saveError }: {
  catalog: ExerciseDefinition[]; disabled: boolean; onAdd: (exercise: ExerciseDefinition) => void; onCancel: () => void; onCreate?: () => void; saveError?: string;
}) {
  const [selected, setSelected] = useState('');
  const exercise = catalog.find(e => e.id === selected);
  return <WorkoutEditDialog title="Add exercise" onCancel={onCancel} saveError={saveError}>
    <p className="muted">Add to the end of this workout. Your program stays unchanged.</p>
    <SelectControl label="Exercise to add" searchable value={selected} onChange={setSelected} disabled={disabled}
      options={catalog.map(e => ({ value: e.id, label: e.name, description: `${e.equipment}${e.isCustom ? ' · My exercise' : ''}${e.aliases?.length ? ` · ${e.aliases.join(', ')}` : ''}` }))} />
    {!catalog.length && <p>No exercises are available in your library.</p>}
    {onCreate && <button className="text-action" type="button" disabled={disabled} onClick={onCreate}>Create custom exercise</button>}
    {exercise && <p className="field-help">3 working sets · 8–12 reps · 90 seconds rest. Use Exercise options to edit these details and the set controls to change set count.</p>}
    {disabled && <p role="alert">Close this panel and resolve the workout change before continuing.</p>}
    <div className="form-actions"><button className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="primary-action" type="button" disabled={disabled || !exercise} onClick={() => { if (exercise) onAdd(exercise); }}>Add exercise</button></div>
  </WorkoutEditDialog>;
}

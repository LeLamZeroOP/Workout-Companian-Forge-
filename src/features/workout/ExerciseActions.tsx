import { useState } from 'react';
import type { ExerciseDefinition, WorkoutExercise } from '../../domain/models';
import { SelectControl } from '../../components/SelectControl';
import { WorkoutEditDialog } from './WorkoutEditDialog';

export function ExerciseActions({ exercise, catalog, disabled, onEdit, onReplace, onRemove, onCancel, onCreate, saveError, initialReplacing = false }: {
  exercise: WorkoutExercise; catalog: ExerciseDefinition[]; disabled: boolean; saveError?: string;
  onEdit: () => void; onReplace: (replacement: ExerciseDefinition) => void;
  onRemove: () => void; onCancel: () => void; onCreate?: () => void; initialReplacing?: boolean;
}) {
  const [replacing, setReplacing] = useState(initialReplacing);
  const [selected, setSelected] = useState('');
  const replacement = catalog.find(e => e.id === selected);
  const completed = exercise.sets.filter(s => s.completed).length;
  const remaining = exercise.sets.length - completed;
  return <WorkoutEditDialog title={replacing ? 'Replace exercise' : `Exercise options · ${exercise.exerciseName}`} onCancel={onCancel} saveError={saveError}>
    {replacing ? <>
      <SelectControl label="Replacement exercise" searchable value={selected} disabled={disabled} onChange={setSelected} options={catalog.filter(e => e.id !== exercise.exerciseId).map(e => ({ value: e.id, label: e.name, description: `${e.equipment}${e.isCustom ? ' · My exercise' : ''}${e.aliases?.length ? ` · ${e.aliases.join(', ')}` : ''}` }))} />
      {catalog.filter(e => e.id !== exercise.exerciseId).length === 0 && <p>No alternative exercises are available in your library.</p>}
      {onCreate && <button className="text-action" type="button" disabled={disabled || !remaining} onClick={onCreate}>Create custom exercise</button>}
      {replacement && <div className="replacement-preview"><p>{completed ? `Completed sets stay with ${exercise.exerciseName}. Remaining sets move to ${replacement.name}.` : `${replacement.name} replaces ${exercise.exerciseName} in this workout.`}</p><p>{remaining} unfinished sets · same rep targets and rest. Unfinished weight and reps will be cleared. Setup notes come from the replacement.</p></div>}
      <div className="form-actions"><button className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="primary-action" type="button" disabled={disabled || !replacement || !remaining} onClick={() => { if (replacement) onReplace(replacement); }}>Replace exercise</button></div>
    </> : <>
      <p className="muted">Changes apply to this workout only.</p>
      <div className="exercise-option-list"><button className="secondary-action" disabled={disabled} onClick={onEdit}>Edit details</button><button className="secondary-action" disabled={disabled || !remaining} onClick={() => setReplacing(true)}>Replace exercise</button>{!remaining && <p className="field-help">All sets are completed.</p>}<button className="danger-action" disabled={disabled} onClick={onRemove}>Remove exercise</button></div>
      {disabled && <p role="alert">The workout changed. Close this panel and resolve the change before reopening.</p>}
      <button className="text-action" type="button" onClick={onCancel}>Cancel</button>
    </>}
  </WorkoutEditDialog>;
}

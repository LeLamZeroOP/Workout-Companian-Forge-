import { useLayoutEffect, useRef, useState } from 'react';
import type { ExerciseDefinition, WorkoutExercise } from '../../domain/models';
import { SelectControl } from '../../components/SelectControl';
import { validateAddExerciseOptions } from '../../domain/sessionEditing';
import { AddExerciseSettings, initialAddExerciseDraft, readAddExerciseDraft, type AddExerciseChoice, type AddExerciseDraft } from './AddExerciseSettings';
import { WorkoutEditDialog } from './WorkoutEditDialog';

export function AddExerciseDialog({ catalog, disabled, onAdd, onCancel, onCreate, saveError, exercises = [], currentExerciseId = null, programTarget }: {
  catalog: ExerciseDefinition[]; disabled: boolean; onAdd: (exercise: ExerciseDefinition, choice: AddExerciseChoice) => void; onCancel: () => void;
  onCreate?: (settings: AddExerciseDraft) => void; saveError?: string; exercises?: WorkoutExercise[]; currentExerciseId?: string | null; programTarget?: string;
}) {
  const [selected, setSelected] = useState('');
  const [settings, setSettings] = useState(initialAddExerciseDraft);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const content = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (Object.keys(errors).length) content.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);
  const exercise = catalog.find(e => e.id === selected);
  function add() {
    if (!exercise || disabled) return;
    const choice = readAddExerciseDraft(settings);
    const found = validateAddExerciseOptions(choice.options);
    setErrors(found);
    if (!Object.keys(found).length) onAdd(exercise, choice);
  }
  return <WorkoutEditDialog title="Add exercise" onCancel={onCancel} saveError={saveError}>
    <div ref={content}>
    <p className="muted">Choose a movement, then set its sets, repetitions, rest and position. Your program stays unchanged unless you choose to add it there too.</p>
    <SelectControl label="Exercise to add" searchable value={selected} onChange={setSelected} disabled={disabled}
      options={catalog.map(e => ({ value: e.id, label: e.name, description: `${e.equipment}${e.isCustom ? ' · My exercise' : ''}${e.aliases?.length ? ` · ${e.aliases.join(', ')}` : ''}` }))} />
    {!catalog.length && <p>No exercises are available in your library.</p>}
    {onCreate && <button className="text-action" type="button" disabled={disabled} onClick={() => onCreate(settings)}>Create custom exercise</button>}
    <AddExerciseSettings value={settings} onChange={setSettings} errors={errors} disabled={disabled} exercises={exercises} currentExerciseId={currentExerciseId} programTarget={programTarget} />
    {disabled && <p role="alert">Close this panel and resolve the workout change before continuing.</p>}
    <div className="form-actions"><button className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="primary-action" type="button" disabled={disabled || !exercise} onClick={add}>Add exercise</button></div>
    </div>
  </WorkoutEditDialog>;
}

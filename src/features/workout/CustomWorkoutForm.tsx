import { useState } from 'react';
import { ArrowDown, ArrowUp, Play, Plus, Trash2 } from 'lucide-react';
import type { ExerciseDefinition, TemplateExercise, WorkoutTemplate } from '../../domain/models';
import { validateWorkoutTemplate } from '../../domain/workout';
import { SelectControl } from '../../components/SelectControl';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { useUnsavedForm } from '../../hooks/useUnsavedForm';

function blankExercise(): TemplateExercise {
  return { id: `custom-exercise-${crypto.randomUUID()}`, exerciseId: '', targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' };
}

export function CustomWorkoutForm({ catalog, onStart, onCancel }: {
  catalog: ExerciseDefinition[];
  onStart: (workout: WorkoutTemplate) => boolean | void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<WorkoutTemplate>(() => ({ id: `custom-workout-${crypto.randomUUID()}`, name: 'Custom workout', notes: '', exercises: [blankExercise()] }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState('');
  const formRef = useValidationFocus(errors);
  useUnsavedForm(draft, formRef);
  const options = catalog.map(exercise => ({ value: exercise.id, label: exercise.name, description: `${exercise.equipment}${exercise.isCustom ? ' · My exercise' : ''}${exercise.aliases?.length ? ` · ${exercise.aliases.join(', ')}` : ''}` }));
  function update(id: string, patch: Partial<TemplateExercise>) {
    setDraft(current => ({ ...current, exercises: current.exercises.map(exercise => exercise.id === id ? { ...exercise, ...patch } : exercise) }));
  }
  function move(index: number, offset: number) {
    setDraft(current => {
      const exercises = [...current.exercises];
      [exercises[index], exercises[index + offset]] = [exercises[index + offset]!, exercises[index]!];
      return { ...current, exercises };
    });
  }
  return <section className="analytics-card custom-workout">
    <div className="section-heading"><div><p className="eyebrow">New session</p><h2>Custom workout</h2><p className="muted">Choose today's exercises. This workout saves to history without creating a program.</p></div></div>
    <form ref={formRef} className="editor-form custom-workout-form" noValidate onSubmit={event => {
      event.preventDefault();
      const found = validateWorkoutTemplate(draft, catalog);
      if (draft.notes.length > 2000) found.notes = 'Notes must be 2,000 characters or fewer.';
      setErrors(found);
      setSaveError('');
      if (Object.keys(found).length) return;
      try {
        if (onStart({ ...draft, name: draft.name.trim() }) === false) setSaveError('Could not start this workout. Your draft is still here. Check the save error or resume your active workout.');
      } catch {
        setSaveError('Could not start this workout. Your draft is still here. Try again.');
      }
    }}>
      <ValidatedField label="Workout name" value={draft.name} maxLength={60} error={errors.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} />
      {errors.exercises && <p role="alert" className="field-error">{errors.exercises}</p>}
      {draft.exercises.map((item, index) => {
        const path = `exercises.${index}`;
        return <fieldset className="custom-workout-exercise" key={item.id}>
          <legend>Exercise {index + 1}</legend>
          <SelectControl searchable label={`Exercise ${index + 1}`} value={item.exerciseId} options={options} onChange={exerciseId => update(item.id, { exerciseId })} />
          {errors[`${path}.exerciseId`] && <p role="alert" className="field-error" tabIndex={-1} aria-invalid="true">{errors[`${path}.exerciseId`]}</p>}
          <div className="compact-fields">
            <ValidatedField label="Sets" aria-label={`Sets for exercise ${index + 1}`} type="number" inputMode="numeric" min={1} max={10} value={item.targetSets} error={errors[`${path}.targetSets`]} onChange={event => update(item.id, { targetSets: Number(event.target.value) })} />
            <ValidatedField label="Rep min" aria-label={`Rep minimum for exercise ${index + 1}`} type="number" inputMode="numeric" min={1} max={100} value={item.targetRepMin} error={errors[`${path}.targetRepRange`]} onChange={event => update(item.id, { targetRepMin: Number(event.target.value) })} />
            <ValidatedField label="Rep max" aria-label={`Rep maximum for exercise ${index + 1}`} type="number" inputMode="numeric" min={1} max={100} value={item.targetRepMax} onChange={event => update(item.id, { targetRepMax: Number(event.target.value) })} />
            <ValidatedField label="Rest (seconds)" aria-label={`Rest seconds for exercise ${index + 1}`} type="number" inputMode="numeric" min={0} max={600} value={item.restSeconds} error={errors[`${path}.restSeconds`]} onChange={event => update(item.id, { restSeconds: Number(event.target.value) })} />
          </div>
          <div className="form-actions">
            <button className="icon-button" type="button" aria-label={`Move exercise ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
            <button className="icon-button" type="button" aria-label={`Move exercise ${index + 1} down`} disabled={index === draft.exercises.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
            <button className="text-action danger-text" type="button" disabled={draft.exercises.length === 1} onClick={() => setDraft(current => ({ ...current, exercises: current.exercises.filter(exercise => exercise.id !== item.id) }))}><Trash2 size={16} />Remove exercise {index + 1}</button>
          </div>
        </fieldset>;
      })}
      <button className="secondary-action" type="button" disabled={draft.exercises.length >= 20} onClick={() => setDraft(current => ({ ...current, exercises: [...current.exercises, blankExercise()] }))}><Plus size={16} />Add exercise</button>
      <label>Workout notes, optional<textarea maxLength={2000} rows={3} value={draft.notes} onChange={event => setDraft(current => ({ ...current, notes: event.target.value }))} /></label>
      {saveError && <p role="alert" className="error-banner">{saveError}</p>}
      <div className="form-actions"><button className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="primary-action" type="submit"><Play size={17} />Start custom workout</button></div>
    </form>
  </section>;
}

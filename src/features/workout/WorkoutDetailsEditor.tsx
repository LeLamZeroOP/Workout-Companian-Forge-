import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { validateExerciseDetails, validateSessionDetails, type ExerciseDetails, type SessionDetails } from '../../domain/sessionEditing';
import { WorkoutEditDialog } from './WorkoutEditDialog';

type Props = { disabled: boolean; onCancel: () => void; saveError?: string } & (
  { mode: 'exercise'; initial: ExerciseDetails; onSave: (details: ExerciseDetails) => void } |
  { mode: 'session'; initial: SessionDetails; onSave: (details: SessionDetails) => void }
);

export function WorkoutDetailsEditor(props: Props) {
  const [name, setName] = useState(props.mode === 'session' ? props.initial.workoutName : '');
  const [notes, setNotes] = useState(props.initial.notes);
  const [min, setMin] = useState(props.mode === 'exercise' ? String(props.initial.targetRepMin ?? '') : '');
  const [max, setMax] = useState(props.mode === 'exercise' ? String(props.initial.targetRepMax ?? '') : '');
  const [rest, setRest] = useState(props.mode === 'exercise' ? String(props.initial.restSeconds) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useUnsavedForm([name, notes, min, max, rest], formRef);
  useLayoutEffect(() => {
    if (Object.keys(errors).length) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);
  function save() {
    if (props.disabled) return;
    if (props.mode === 'session') {
      const details = { workoutName: name, notes };
      const found = validateSessionDetails(details); setErrors(found);
      if (!Object.keys(found).length) props.onSave(details);
    } else {
      const details = { notes, restSeconds: rest.trim() ? Number(rest) : NaN, targetRepMin: min.trim() ? Number(min) : undefined, targetRepMax: max.trim() ? Number(max) : undefined };
      const found = validateExerciseDetails(details); setErrors(found);
      if (!Object.keys(found).length) props.onSave(details);
    }
  }
  return <WorkoutEditDialog title={props.mode === 'session' ? 'Edit workout details' : 'Edit exercise details'} onCancel={props.onCancel} saveError={props.saveError}>
    <p className="muted">Changes apply to this workout only.</p>
    <form ref={formRef} noValidate onSubmit={event => { event.preventDefault(); save(); }}>
      <fieldset disabled={props.disabled} className="workout-details-fields">
        {props.mode === 'session' ? <><label>Workout name<input value={name} maxLength={60} onChange={e => setName(e.target.value)} aria-invalid={Boolean(errors.workoutName)} aria-describedby={errors.workoutName ? `${errorId}-name` : undefined} /></label>{errors.workoutName && <p id={`${errorId}-name`} role="alert" className="field-error">{errors.workoutName}</p>}</> : <>
          <div className="workout-target-fields"><label>Rep minimum<input type="number" min={1} max={100} step={1} value={min} onChange={e => setMin(e.target.value)} aria-invalid={Boolean(errors.targets)} aria-describedby={errors.targets ? `${errorId}-targets` : undefined} /></label><label>Rep maximum<input type="number" min={1} max={100} step={1} value={max} onChange={e => setMax(e.target.value)} aria-invalid={Boolean(errors.targets)} aria-describedby={errors.targets ? `${errorId}-targets` : undefined} /></label></div>
          {errors.targets && <p id={`${errorId}-targets`} role="alert" className="field-error">{errors.targets}</p>}
          <label>Rest seconds<input type="number" min={0} max={600} step={1} value={rest} onChange={e => setRest(e.target.value)} aria-invalid={Boolean(errors.restSeconds)} aria-describedby={errors.restSeconds ? `${errorId}-rest` : undefined} /></label>{errors.restSeconds && <p id={`${errorId}-rest`} role="alert" className="field-error">{errors.restSeconds}</p>}
          <p className="field-help">Rest changes apply after future sets. A running timer keeps its current end time.</p>
        </>}
        <label>{props.mode === 'session' ? 'Session notes' : 'Exercise notes'}<textarea rows={4} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      </fieldset>
      {props.disabled && <p role="alert">The workout changed. Close this editor and resolve the change before reopening.</p>}
      <div className="form-actions"><button className="secondary-action" type="button" onClick={props.onCancel}>Cancel</button><button className="primary-action" type="submit" disabled={props.disabled}>Save changes</button></div>
    </form>
  </WorkoutEditDialog>;
}

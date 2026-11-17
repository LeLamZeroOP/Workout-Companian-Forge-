import { useId } from 'react';
import { SelectControl } from '../../components/SelectControl';
import type { WorkoutExercise } from '../../domain/models';
import { defaultAddExerciseOptions, type AddExerciseOptions, type AddExercisePosition } from '../../domain/sessionEditing';

/** Editable text for the add-exercise choices; numbers are parsed when the form is submitted. */
export type AddExerciseDraft = { sets: string; min: string; max: string; rest: string; position: string; saveToProgram: boolean };
export type AddExerciseChoice = { options: AddExerciseOptions; saveToProgram: boolean };

export const initialAddExerciseDraft: AddExerciseDraft = {
  sets: String(defaultAddExerciseOptions.targetSets), min: String(defaultAddExerciseOptions.targetRepMin), max: String(defaultAddExerciseOptions.targetRepMax),
  rest: String(defaultAddExerciseOptions.restSeconds), position: 'end', saveToProgram: false,
};

const amount = (text: string) => text.trim() ? Number(text) : NaN;

export function readAddExerciseDraft(draft: AddExerciseDraft): AddExerciseChoice {
  const position: AddExercisePosition = draft.position === 'start' || draft.position === 'end' ? draft.position : { afterExerciseId: draft.position.replace(/^after:/, '') };
  return { options: { targetSets: amount(draft.sets), targetRepMin: amount(draft.min), targetRepMax: amount(draft.max), restSeconds: amount(draft.rest), position }, saveToProgram: draft.saveToProgram };
}

export function AddExerciseSettings({ value, onChange, errors, disabled, exercises, currentExerciseId, programTarget }: {
  value: AddExerciseDraft; onChange: (next: AddExerciseDraft) => void; errors: Record<string, string>; disabled: boolean;
  exercises: WorkoutExercise[]; currentExerciseId: string | null; programTarget?: string;
}) {
  const id = useId();
  const set = (change: Partial<AddExerciseDraft>) => onChange({ ...value, ...change });
  const positions = [
    { value: 'end', label: 'At the end of the workout' },
    ...exercises.map((item, index) => ({ value: `after:${item.id}`, label: `After ${index + 1}. ${item.exerciseName}`, ...(item.id === currentExerciseId ? { description: 'Current exercise · do it next' } : {}) })),
    ...(exercises.length ? [{ value: 'start', label: 'First in the workout' }] : []),
  ];
  const position = positions.some(option => option.value === value.position) ? value.position : 'end';
  return <fieldset disabled={disabled} className="workout-details-fields add-exercise-settings">
    <legend className="sr-only">Sets, repetitions, rest and position</legend>
    <div className="add-exercise-numbers">
      <label>Sets<input type="number" inputMode="numeric" min={1} max={10} step={1} value={value.sets} onChange={event => set({ sets: event.target.value })} aria-invalid={Boolean(errors.targetSets)} aria-describedby={errors.targetSets ? `${id}-sets` : undefined} /></label>
      <label>Rep minimum<input type="number" inputMode="numeric" min={1} max={100} step={1} value={value.min} onChange={event => set({ min: event.target.value })} aria-invalid={Boolean(errors.targets)} aria-describedby={errors.targets ? `${id}-targets` : undefined} /></label>
      <label>Rep maximum<input type="number" inputMode="numeric" min={1} max={100} step={1} value={value.max} onChange={event => set({ max: event.target.value })} aria-invalid={Boolean(errors.targets)} aria-describedby={errors.targets ? `${id}-targets` : undefined} /></label>
      <label>Rest seconds<input type="number" inputMode="numeric" min={0} max={600} step={1} value={value.rest} onChange={event => set({ rest: event.target.value })} aria-invalid={Boolean(errors.restSeconds)} aria-describedby={errors.restSeconds ? `${id}-rest` : undefined} /></label>
    </div>
    {errors.targetSets && <p id={`${id}-sets`} role="alert" className="field-error">{errors.targetSets}</p>}
    {errors.targets && <p id={`${id}-targets`} role="alert" className="field-error">{errors.targets}</p>}
    {errors.restSeconds && <p id={`${id}-rest`} role="alert" className="field-error">{errors.restSeconds}</p>}
    <SelectControl label="Position in workout" value={position} disabled={disabled} onChange={next => set({ position: next })} options={positions} />
    {programTarget && <label className="checkbox-label"><input type="checkbox" checked={value.saveToProgram} onChange={event => set({ saveToProgram: event.target.checked })} />Also add to {programTarget} for next time</label>}
  </fieldset>;
}

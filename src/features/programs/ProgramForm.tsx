import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from 'lucide-react';
import type { ExerciseDefinition, Program, TemplateExercise, WorkoutTemplate } from '../../domain/models';
import { validateProgram } from '../../domain/workout';
export interface ProgramFormProps { initialValue: Program; exerciseCatalog: ExerciseDefinition[]; onSave: (program: Program) => void; onCancel: () => void }

function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function blankExercise(exerciseId: string): TemplateExercise { return { id: uid('template-exercise'), exerciseId, targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' }; }
function blankWorkout(exerciseId: string): WorkoutTemplate { return { id: uid('workout'), name: 'New workout', notes: '', exercises: [blankExercise(exerciseId)] }; }

export function ProgramForm({ initialValue, exerciseCatalog, onSave, onCancel }: ProgramFormProps) {
  const [draft, setDraft] = useState(() => structuredClone(initialValue));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateWorkout = (index: number, update: (workout: WorkoutTemplate) => void) => setDraft((current) => { const next = structuredClone(current); update(next.workouts[index]!); return next; });
  const submit = () => { const nextErrors = validateProgram(draft, exerciseCatalog); setErrors(nextErrors); if (Object.keys(nextErrors).length === 0) onSave({ ...draft, updatedAt: new Date().toISOString() }); };

  return <form className="editor-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <div className="field"><label htmlFor="program-name">Program name</label><input id="program-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />{errors.name && <p className="field-error" role="alert">{errors.name}</p>}</div>
    {Object.entries(errors).some(([key]) => key !== 'name') && <div className="error-summary" role="alert"><strong>Check the highlighted program details.</strong><ul>{Object.entries(errors).filter(([key]) => key !== 'name').map(([key, message]) => <li key={key}>{message}</li>)}</ul></div>}
    {draft.workouts.map((workout, workoutIndex) => <fieldset className="workout-editor" key={workout.id}>
      <legend>Workout {workoutIndex + 1}</legend>
      <div className="field"><label htmlFor={`workout-${workout.id}`}>Workout name {workoutIndex + 1}</label><input id={`workout-${workout.id}`} value={workout.name} onChange={(e) => updateWorkout(workoutIndex, (item) => { item.name = e.target.value; })} />{errors[`workouts.${workoutIndex}.name`] && <p className="field-error" role="alert">{errors[`workouts.${workoutIndex}.name`]}</p>}</div>
      {workout.exercises.map((item, exerciseIndex) => { const exercise = exerciseCatalog.find((candidate) => candidate.id === item.exerciseId); return <div className="exercise-editor" key={item.id}>
        <div className="exercise-editor-title"><label>Exercise<select value={item.exerciseId} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.exerciseId = e.target.value; })}>{exerciseCatalog.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select></label><div><button type="button" className="icon-button" aria-label={`Move ${exercise?.name} up`} disabled={exerciseIndex === 0} onClick={() => updateWorkout(workoutIndex, (w) => { [w.exercises[exerciseIndex - 1], w.exercises[exerciseIndex]] = [w.exercises[exerciseIndex]!, w.exercises[exerciseIndex - 1]!]; })}><ArrowUp size={16}/></button><button type="button" className="icon-button" aria-label={`Move ${exercise?.name} down`} disabled={exerciseIndex === workout.exercises.length - 1} onClick={() => updateWorkout(workoutIndex, (w) => { [w.exercises[exerciseIndex], w.exercises[exerciseIndex + 1]] = [w.exercises[exerciseIndex + 1]!, w.exercises[exerciseIndex]!]; })}><ArrowDown size={16}/></button><button type="button" className="icon-button" aria-label={`Remove ${exercise?.name}`} disabled={workout.exercises.length === 1} onClick={() => updateWorkout(workoutIndex, (w) => { w.exercises.splice(exerciseIndex, 1); })}><Trash2 size={16}/></button></div></div>
        <div className="compact-fields"><label>Sets<input type="number" min="1" max="10" value={item.targetSets} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.targetSets = Number(e.target.value); })}/></label><label>Rep min<input type="number" value={item.targetRepMin} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.targetRepMin = Number(e.target.value); })}/></label><label>Rep max<input type="number" value={item.targetRepMax} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.targetRepMax = Number(e.target.value); })}/></label><label>Rest seconds for {exercise?.name}<input type="number" min="0" max="600" value={item.restSeconds} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.restSeconds = Number(e.target.value); })}/></label></div>
      </div>; })}
      <button type="button" className="secondary-action" onClick={() => updateWorkout(workoutIndex, (w) => { w.exercises.push(blankExercise(exerciseCatalog[0]!.id)); })}><Plus size={16}/> Add exercise</button>
      <button type="button" className="text-action danger-text" disabled={draft.workouts.length === 1} onClick={() => setDraft((current) => ({ ...current, workouts: current.workouts.filter((_, index) => index !== workoutIndex) }))}>Remove workout</button>
    </fieldset>)}
    <button type="button" className="secondary-action" onClick={() => setDraft((current) => ({ ...current, workouts: [...current.workouts, blankWorkout(exerciseCatalog[0]!.id)] }))}><Plus size={16}/> Add workout</button>
    <div className="form-actions"><button type="button" className="secondary-action" onClick={onCancel}><X size={17}/>Cancel</button><button className="primary-action" type="submit"><Save size={17}/>Save program</button></div>
  </form>;
}

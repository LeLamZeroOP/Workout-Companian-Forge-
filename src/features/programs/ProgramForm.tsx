import { useUnsavedForm } from '../../hooks/useUnsavedForm';
import { ValidatedField } from '../../components/ValidatedField';
import { useValidationFocus } from '../../hooks/useValidationFocus';
import { muscleLabels, muscleGroups } from '../../domain/muscleSets';
import { SelectControl } from '../../components/SelectControl';
import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from 'lucide-react';
import type { ExerciseDefinition, Program, TemplateExercise, WorkoutTemplate } from '../../domain/models';
import { validateProgram } from '../../domain/workout';
import { ProgramMuscleSummary } from './ProgramMuscleSummary';
import { ProgramVolumeSettings } from './ProgramVolumeSettings';
export interface ProgramFormProps { saveDisabled?: boolean; initialValue: Program; exerciseCatalog: ExerciseDefinition[]; onSave: (program: Program) => void; onCancel: () => void }

function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function blankExercise(exerciseId: string): TemplateExercise { return { id: uid('template-exercise'), exerciseId, targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' }; }
function blankWorkout(exerciseId: string): WorkoutTemplate { return { id: uid('workout'), name: 'New workout', notes: '', exercises: [blankExercise(exerciseId)] }; }

export function ProgramForm({ initialValue, exerciseCatalog, onSave, onCancel, saveDisabled = false }: ProgramFormProps) {
  const [draft, setDraft] = useState(() => structuredClone(initialValue));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useValidationFocus(errors);
  useUnsavedForm(draft, formRef);
  const exerciseOptions = useMemo(() => exerciseCatalog.map(option => ({
    value: option.id,
    label: option.name,
    description: `${option.equipment} · ${option.chestEmphasis ? `${option.chestEmphasis} chest · ` : ''}${option.isCustom ? 'My exercise' : 'Exercise library'}${option.aliases?.length ? ` · ${option.aliases.join(', ')}` : ''}`,
  })), [exerciseCatalog]);
  const updateWorkout = (index: number, update: (workout: WorkoutTemplate) => void) => setDraft((current) => { const next = structuredClone(current); update(next.workouts[index]!); return next; });
  const submit = () => { if (saveDisabled) return; const nextErrors = validateProgram(draft, exerciseCatalog); setErrors(nextErrors); if (Object.keys(nextErrors).length === 0) onSave({ ...draft, updatedAt: new Date().toISOString() }); };

  return <form ref={formRef} className="editor-form program-editor" noValidate onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <p className="field-help">Editing this template affects future workouts. Active and completed sessions keep their saved exercises and targets.</p><div className="field"><label htmlFor="program-name">Program name</label><input id="program-name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'program-name-error' : undefined} maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />{errors.name && <p id="program-name-error" className="field-error" role="alert">{errors.name}</p>}</div>
    {Object.entries(errors).some(([key]) => key !== 'name') && <div className="error-summary" role="alert" tabIndex={-1}><strong>Check the highlighted program details.</strong><ul>{Object.entries(errors).filter(([key]) => key !== 'name').map(([key, message]) => <li key={key}>{message}</li>)}</ul></div>}
    <nav className="workout-jump-list" aria-label="Workouts in this program">{draft.workouts.map((workout, index) => <a href={`#session-${workout.id}`} onClick={event => { event.preventDefault(); document.getElementById(`session-${workout.id}`)?.scrollIntoView({ block: 'start' }); }} key={workout.id}><span>{String(index + 1).padStart(2, '0')}</span>{workout.name || 'Untitled workout'}</a>)}</nav>
    <ProgramMuscleSummary program={draft} exercises={exerciseCatalog} />
    <ProgramVolumeSettings program={draft} onChange={setDraft} errors={errors} />
    {draft.workouts.map((workout, workoutIndex) => <fieldset className="workout-editor" id={`session-${workout.id}`} key={workout.id}>
      <legend className="sr-only">Workout {workoutIndex + 1}</legend>
      <div className="session-editor-header">
        <span className="session-editor-number" aria-hidden="true">{String(workoutIndex + 1).padStart(2, '0')}</span>
        <div className="session-editor-identity"><p className="eyebrow">Training session</p>
      <div className="field"><label htmlFor={`workout-${workout.id}`}>Workout name {workoutIndex + 1}</label><input id={`workout-${workout.id}`} aria-invalid={Boolean(errors[`workouts.${workoutIndex}.name`])} aria-describedby={errors[`workouts.${workoutIndex}.name`] ? `workout-${workout.id}-error` : undefined} maxLength={60} value={workout.name} onChange={(e) => updateWorkout(workoutIndex, (item) => { item.name = e.target.value; })} />{errors[`workouts.${workoutIndex}.name`] && <p id={`workout-${workout.id}-error`} className="field-error" role="alert">{errors[`workouts.${workoutIndex}.name`]}</p>}</div>
        <div className="session-editor-stats"><span>{workout.exercises.length} exercises</span><span>{workout.exercises.reduce((total, exercise) => total + exercise.targetSets, 0)} working sets</span></div>
        </div>
      </div>
      <div className="session-editor-body">
      <details className="editor-notes"><summary>Session notes{workout.notes ? ' · added' : ''}</summary><label className="sr-only" htmlFor={`notes-${workout.id}`}>Notes for workout {workoutIndex + 1}</label><textarea id={`notes-${workout.id}`} maxLength={4096} value={workout.notes} onChange={event => updateWorkout(workoutIndex, item => { item.notes = event.target.value; })} placeholder="Focus, rotation or coaching cues…" /></details>
      {workout.exercises.map((item, exerciseIndex) => { const exercise = exerciseCatalog.find((candidate) => candidate.id === item.exerciseId); return <div className="exercise-editor" key={item.id}>
        <div className="exercise-editor-order"><span>Movement {String(exerciseIndex + 1).padStart(2, '0')}</span><span>{item.targetSets} × {item.targetRepMin}–{item.targetRepMax} <span aria-hidden="true">·</span> {item.restSeconds}s rest</span></div>
        <div className="exercise-editor-title"><SelectControl error={errors[`workouts.${workoutIndex}.exercises.${exerciseIndex}.exerciseId`]} label="Exercise" searchable value={item.exerciseId} onChange={value => updateWorkout(workoutIndex, w => { w.exercises[exerciseIndex]!.exerciseId = value; })} options={exerciseOptions} /><div><button type="button" className="icon-button" aria-label={`Move ${exercise?.name} up`} disabled={exerciseIndex === 0} onClick={() => updateWorkout(workoutIndex, (w) => { [w.exercises[exerciseIndex - 1], w.exercises[exerciseIndex]] = [w.exercises[exerciseIndex]!, w.exercises[exerciseIndex - 1]!]; })}><ArrowUp size={16}/></button><button type="button" className="icon-button" aria-label={`Move ${exercise?.name} down`} disabled={exerciseIndex === workout.exercises.length - 1} onClick={() => updateWorkout(workoutIndex, (w) => { [w.exercises[exerciseIndex], w.exercises[exerciseIndex + 1]] = [w.exercises[exerciseIndex + 1]!, w.exercises[exerciseIndex]!]; })}><ArrowDown size={16}/></button><button type="button" className="icon-button" aria-label={`Remove ${exercise?.name}`} disabled={workout.exercises.length === 1} onClick={() => updateWorkout(workoutIndex, (w) => { w.exercises.splice(exerciseIndex, 1); })}><Trash2 size={16}/></button></div></div>
        <div className="compact-fields"><ValidatedField label="Sets" error={errors[`workouts.${workoutIndex}.exercises.${exerciseIndex}.targetSets`]} type="number" min="1" max="10" value={item.targetSets} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.targetSets = Number(e.target.value); })} /><ValidatedField label="Rep min" error={errors[`workouts.${workoutIndex}.exercises.${exerciseIndex}.targetRepRange`]} type="number" min="1" max="100" value={item.targetRepMin} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.targetRepMin = Number(e.target.value); })} /><ValidatedField label="Rep max" error={errors[`workouts.${workoutIndex}.exercises.${exerciseIndex}.targetRepRange`]} type="number" min="1" max="100" value={item.targetRepMax} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.targetRepMax = Number(e.target.value); })} /><ValidatedField label={`Rest seconds for ${exercise?.name}`} error={errors[`workouts.${workoutIndex}.exercises.${exerciseIndex}.restSeconds`]} type="number" min="0" max="600" value={item.restSeconds} onChange={(e) => updateWorkout(workoutIndex, (w) => { w.exercises[exerciseIndex]!.restSeconds = Number(e.target.value); })} /></div>
        <details className="editor-notes"><summary>Muscle contributions</summary><p>{muscleGroups.filter(muscle => exercise?.muscleContribution[muscle]).map(muscle => `${muscleLabels[muscle]} ${exercise!.muscleContribution[muscle]}`).join(', ') || 'No contributions assigned'}</p></details><details className="editor-notes exercise-notes"><summary>Exercise notes{item.notes ? ' · added' : ''}</summary><label className="sr-only" htmlFor={`notes-${item.id}`}>Notes for {exercise?.name}</label><textarea id={`notes-${item.id}`} maxLength={4096} value={item.notes} onChange={event => updateWorkout(workoutIndex, w => { w.exercises[exerciseIndex]!.notes = event.target.value; })} /></details>
      </div>; })}
      <button type="button" className="secondary-action" disabled={workout.exercises.length >= 20} onClick={() => updateWorkout(workoutIndex, (w) => { w.exercises.push(blankExercise(exerciseCatalog[0]!.id)); })}><Plus size={16}/> Add exercise</button>
      <div className="form-actions"><button type="button" className="secondary-action" disabled={draft.workouts.length >= 14} onClick={() => setDraft(current => { const copy = structuredClone(workout); copy.id = uid('workout'); copy.name = `${copy.name.trim().slice(0, 55)} copy`; copy.exercises.forEach(item => { item.id = uid('template-exercise'); }); const workouts = [...current.workouts]; workouts.splice(workoutIndex + 1, 0, copy); return { ...current, workouts }; })}>Duplicate workout</button><button type="button" className="text-action" disabled={workoutIndex === 0} onClick={() => setDraft(current => { const workouts = [...current.workouts]; [workouts[workoutIndex-1],workouts[workoutIndex]] = [workouts[workoutIndex]!,workouts[workoutIndex-1]!]; return { ...current, workouts }; })}>Move workout up</button><button type="button" className="text-action" disabled={workoutIndex === draft.workouts.length - 1} onClick={() => setDraft(current => { const workouts = [...current.workouts]; [workouts[workoutIndex+1],workouts[workoutIndex]] = [workouts[workoutIndex]!,workouts[workoutIndex+1]!]; return { ...current, workouts }; })}>Move workout down</button></div><button type="button" className="text-action danger-text" disabled={draft.workouts.length === 1} onClick={() => setDraft(current => { const next = structuredClone(current); next.workouts.splice(workoutIndex, 1); if (next.volumePlan?.cycle) next.volumePlan.cycle.slots = next.volumePlan.cycle.slots.map(slot => slot === workout.id ? null : slot); return next; })}>Remove workout</button>
      </div>
    </fieldset>)}
    <button type="button" className="secondary-action" disabled={draft.workouts.length >= 14} onClick={() => setDraft((current) => ({ ...current, workouts: [...current.workouts, blankWorkout(exerciseCatalog[0]!.id)] }))}><Plus size={16}/> Add workout</button>
    <div className="form-actions"><button type="button" className="secondary-action" onClick={onCancel}><X size={17}/>Cancel</button><button className="primary-action" type="submit" disabled={saveDisabled}><Save size={17}/>Save program</button></div>
  </form>;
}

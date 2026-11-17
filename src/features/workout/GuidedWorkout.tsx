import { OverlayPresence } from '../../components/OverlayPresence';
import { ExerciseTechnique } from '../../components/ExerciseTechnique';
import { ProgressMeter } from '../../components/ProgressMeter';
import { ChoiceGroup } from '../../components/ChoiceGroup';
import type { ExerciseDefinition, Program, WorkoutSession } from '../../domain/models';
import { toast } from 'sonner';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, Check, ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { completeGuidedSet, extendRest, getNextIncompleteSet, selectGuidedSet, skipRest, undoGuidedSet } from '../../domain/guidedWorkout';
import { validSetValues } from '../../domain/trainingMetrics';
import { previousPerformanceForOccurrence, previousSetAt } from '../../domain/previousPerformance';
import { canFinishSession } from '../../domain/workout';
import { useRestAlerts } from '../../hooks/useRestAlerts';
import { useWorkoutDraft } from '../../hooks/useWorkoutDraft';
import { RestTimer } from './RestTimer';
import { SetValueInput } from './SetValueInput';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ExerciseActions } from './ExerciseActions';
import { WorkoutDetailsEditor } from './WorkoutDetailsEditor';
import { addExerciseToProgramWorkout, addSessionExercise, editSessionDetails, editSessionExercise, removeSessionExercise, replaceSessionExercise } from '../../domain/sessionEditing';
import { AddExerciseDialog } from './AddExerciseDialog';
import { CreateWorkoutExerciseDialog } from './CreateWorkoutExerciseDialog';
import type { AddExerciseChoice, AddExerciseDraft } from './addExerciseDraft';
const clockNow = () => new Date().toISOString();
const emptyCatalog: ExerciseDefinition[] = [];

type Props = {
  restAlertSound?: boolean; restAlertVibration?: boolean; session: WorkoutSession;
  catalog?: ExerciseDefinition[]; history?: WorkoutSession[]; storageScope?: string;
  onChange: (session: WorkoutSession, newExercises?: ExerciseDefinition[]) => boolean | void; onFinish: () => boolean | void;
  onDiscard: () => void; now?: () => string;
  /** The program this session was started from, when it still exists. */
  program?: Program; onSaveProgram?: (program: Program) => boolean | void;
};

export function GuidedWorkout({ session, catalog = emptyCatalog, history = [], storageScope = 'local', onChange, onFinish, onDiscard, now = clockNow, restAlertSound = true, restAlertVibration = true, program, onSaveProgram }: Props) {
  const { draft, changeCurrent, commit, commitCurrent, conflict, resolve, error } = useWorkoutDraft(session, storageScope, onChange, catalog);
  const alerts = useRestAlerts(restAlertSound, restAlertVibration);
  const [announcement, setAnnouncement] = useState('');
  const [queueOpen, setQueueOpen] = useState(() => window.matchMedia?.('(max-width: 640px)').matches !== true);
  const queueId = useId();
  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 640px)');
    const update = () => setQueueOpen(query?.matches !== true);
    query?.addEventListener('change', update);
    return () => query?.removeEventListener('change', update);
  }, []);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishError, setFinishError] = useState('');
  const workspace = useRef<HTMLElement>(null);
  const nextFocus = useRef<'rest' | 'entry' | null>(null);
  useEffect(() => {
    const request = nextFocus.current;
    nextFocus.current = null;
    if (!request) return;
    const selector = request === 'rest' ? '[data-rest-skip]' : '[data-set-entry="weightKg"]';
    (workspace.current?.querySelector<HTMLElement>(selector) ?? workspace.current?.querySelector<HTMLElement>('[data-finish-workout]'))?.focus();
  });
  const [panel, setPanel] = useState<{ kind: 'options' | 'replace' | 'edit' | 'remove'; exerciseId: string } | { kind: 'session' | 'add' } | { kind: 'create'; replacementId?: string; settings?: AddExerciseDraft } | null>(null);
  const panelExercise = panel && 'exerciseId' in panel ? draft.exercises.find(e => e.id === panel.exerciseId) : undefined;
  const closePanel = () => setPanel(null);
  const rest = draft.guide.restTimer;
  const exerciseIndex = Math.max(0, draft.exercises.findIndex(item => item.id === draft.guide.currentExerciseId));
  const exercise = draft.exercises[exerciseIndex];
  const setIndex = exercise?.sets.findIndex(item => item.id === draft.guide.currentSetId) ?? -1;
  const set = exercise?.sets[setIndex];
  const nextIncomplete = getNextIncompleteSet(draft, draft.guide.currentExerciseId ?? undefined, draft.guide.currentSetId ?? undefined);
  const upcoming = draft.exercises.find(item => item.id === nextIncomplete?.exerciseId);
  const completePlan = !getNextIncompleteSet(draft);
  const allSets = draft.exercises.flatMap(item => item.sets);
  const completedCount = allSets.filter(item => item.completed && validSetValues(item)).length;
  const unfinishedCount = allSets.filter(item => !item.completed).length;
  const definitionId = exercise?.exerciseId;
  const kind = set?.kind;
  const occurrence = exercise ? draft.exercises.slice(0, exerciseIndex).filter(item => item.exerciseId === definitionId).length : -1;
  const prior = useMemo(() => previousPerformanceForOccurrence(session.id, session.startedAt, definitionId, occurrence, history, kind), [session.id, session.startedAt, definitionId, occurrence, history, kind]);
  const sameKindIndex = exercise?.sets.slice(0, setIndex + 1).filter(item => item.kind === set?.kind).length ?? 1;
  const previousSet = previousSetAt(prior?.exercise, set?.kind, sameKindIndex - 1);

  const programWorkout = onSaveProgram && session.workoutTemplateId ? program?.workouts.find(item => item.id === session.workoutTemplateId) : undefined;
  const programTarget = program && programWorkout && programWorkout.exercises.length < 20 ? `${programWorkout.name} in ${program.name}` : undefined;

  function addExercise(definition: ExerciseDefinition, choice: AddExerciseChoice, created: boolean) {
    const position = choice.options.position;
    const anchorDefinitionId = typeof position === 'object' ? draft.exercises.find(item => item.id === position.afterExerciseId)?.exerciseId ?? null : null;
    const accepted = commitCurrent(latest => addSessionExercise(latest, definition, choice.options), created ? definition : undefined);
    if (!accepted) return false;
    if (choice.saveToProgram && program && programTarget && session.workoutTemplateId && onSaveProgram) {
      // The workout change is already saved; the program is a separate, optional save.
      const updated = addExerciseToProgramWorkout(program, session.workoutTemplateId, definition, choice.options, anchorDefinitionId, now());
      let saved = false;
      try { saved = updated !== null && onSaveProgram(updated) !== false; } catch { /* Reported below; the workout keeps the exercise. */ }
      if (saved) toast.success(`${definition.name} also added to ${programTarget}`);
      else toast.error(`${definition.name} is in this workout, but could not be added to ${programTarget}. Add it in Programs.`);
    }
    closePanel(); setQueueOpen(true);
    setAnnouncement(`${definition.name} ${created ? 'created and ' : ''}added to the workout.`);
    return true;
  }

  function finishSession() {
    setFinishError('');
    if (!canFinishSession(draft) || !commit()) return;
    let accepted = false;
    try { accepted = onFinish() !== false; } catch { /* Preserve the review for retry. */ }
    if (accepted) setConfirmFinish(false);
    else setFinishError('This workout could not be finished. Keep the app open and retry.');
  }
  function saveAndFocus(update: (latest: WorkoutSession) => WorkoutSession) {
    const accepted = commitCurrent(update);
    if (accepted) nextFocus.current = 'entry';
    return accepted;
  }
  function edit(field: 'weightKg' | 'reps', value: string) {
    changeCurrent(latest => {
      const latestExerciseIndex = latest.exercises.findIndex(item => item.id === exercise?.id);
      const latestExercise = latest.exercises[latestExerciseIndex];
      const latestSetIndex = latestExercise?.sets.findIndex(item => item.id === set?.id) ?? -1;
      if (!latestExercise || latestSetIndex < 0) return latest;
      const amount = value.trim() === '' ? null : Number(value);
      const sets = [...latestExercise.sets];
      sets[latestSetIndex] = { ...sets[latestSetIndex]!, [field]: amount !== null && !Number.isFinite(amount) ? null : amount };
      const exercises = [...latest.exercises];
      exercises[latestExerciseIndex] = { ...latestExercise, sets };
      return { ...latest, exercises };
    });
  }
  function finishSet() {
    if (!exercise || !set || !validSetValues(set)) return;
    if (exercise.restSeconds > 0) alerts.prepare();
    const updated = completeGuidedSet(draft, exercise.id, set.id, now());
    if (commit(updated, false)) {
      nextFocus.current = updated.guide.restTimer ? 'rest' : 'entry';
      setAnnouncement(updated.guide.restTimer ? 'Set completed. Rest started.' : 'Set completed.');
    }
  }

  return <div className="guided-layout training-workspace" data-phase={rest ? 'rest' : completePlan ? 'finished' : 'entry'}>
    <section className="current-set" ref={workspace}>
      <div role="status" className="sr-only">{announcement}</div>
      {(error || finishError) && !panel && !confirmFinish && <div role="alert" className="error-banner workout-save-error"><p>{error || finishError}</p><button className="secondary-action" type="button" disabled={conflict} onClick={() => { if (finishError) finishSession(); else if (commit()) setAnnouncement('Workout saved.'); }}>{finishError ? 'Retry finish' : 'Retry save'}</button></div>}
      {conflict && <div role="alert" className="error-banner">This session changed while your device had a draft. Review before continuing.<div className="form-actions"><button type="button" onClick={() => resolve(false)}>Use saved session</button><button type="button" onClick={() => resolve(true)}>Keep this device draft</button></div></div>}
      <div className="session-overview">
        <div className="session-edit-heading"><h2>{draft.workoutName}</h2><button data-workout-edit-trigger className="text-action" type="button" aria-label="Edit workout details" disabled={conflict} onClick={() => setPanel({ kind: 'session' })}><Pencil size={14} aria-hidden="true" />Edit details</button></div>
        <div className="session-progress"><ProgressMeter label="Workout completion" valueText={`${completedCount} of ${allSets.length} sets completed`} value={completedCount} max={allSets.length} /><span><strong>{completedCount}</strong> / {allSets.length} sets done</span></div>
      </div>
      {!exercise && <section className="finish-panel"><h3>No exercises remain.</h3><p>Add an exercise to continue, or discard this workout.</p><button className="secondary-action" type="button" disabled={conflict} onClick={() => setPanel({ kind: 'add' })}><Plus size={16} aria-hidden="true" />Add exercise</button><button className="danger-action" type="button" onClick={onDiscard}>Discard workout</button></section>}
      {exercise && <>
        <div className="exercise-focus">
          <div className="set-meta"><span>Exercise {exerciseIndex + 1} of {draft.exercises.length}</span><span>{completePlan ? 'All sets completed' : `Set ${setIndex + 1} of ${exercise.sets.length}`}</span></div>
          <div className="session-edit-heading"><h3>{exercise.exerciseName}</h3><div className="exercise-focus-actions"><ExerciseTechnique compact key={exercise.id} exerciseId={exercise.exerciseId} exerciseName={exercise.exerciseName} isCustom={catalog.find(item => item.id === exercise.exerciseId)?.isCustom} /><button className="icon-button exercise-menu" type="button" aria-label="Exercise options" disabled={conflict} onClick={() => setPanel({ kind: 'options', exerciseId: exercise.id })}><MoreHorizontal size={20} aria-hidden="true" /></button></div></div>
          <div className="exercise-prescription">{exercise.targetRepMin && exercise.targetRepMax && <span>{exercise.targetRepMin}–{exercise.targetRepMax} reps</span>}<span>{exercise.restSeconds}s rest</span><span>Load in kg</span></div>
          {exercise.notes && <p className="exercise-guidance saved-notes">{exercise.notes}</p>}
        </div>
        {rest && <RestTimer rest={rest} now={now} onElapsed={() => { if (!conflict) { alerts.notify(`${rest.startedAt}:${rest.afterSetId}`); if (saveAndFocus(skipRest)) setAnnouncement('Rest complete. Next set ready.'); } }} onExtend={() => { commitCurrent(latest => extendRest(latest, 30)); }} onSkip={() => { if (saveAndFocus(skipRest)) setAnnouncement('Next set ready.'); }} />}
        {rest && upcoming && <p className="rest-next">Next: <strong>{upcoming.exerciseName}</strong> · set {upcoming.sets.findIndex(item => item.id === nextIncomplete?.setId) + 1}{upcoming.targetRepMin && upcoming.targetRepMax ? ` · ${upcoming.targetRepMin}–${upcoming.targetRepMax} reps` : ''}</p>}
        {!rest && set && !set.completed && !completePlan && <fieldset disabled={conflict} className="set-edit-fields">
          <legend className="sr-only">Current set</legend>
          <p className="set-phase-label">{completedCount > 0 ? 'Next set ready' : 'Ready to train'}</p>
          <div className="set-tools"><ChoiceGroup label="Set type" value={set.kind} onChange={value => { const next = structuredClone(draft); next.exercises[exerciseIndex]!.sets[setIndex]!.kind = value as 'working' | 'warmup'; commit(next); }} options={[{ value: 'working', label: 'Working' }, { value: 'warmup', label: 'Warm-up' }]} /></div>
          {previousSet && <div className="previous-set-hint"><span>Previous <strong>{previousSet.weightKg} kg × {previousSet.reps}</strong></span><button className="text-action" type="button" onClick={() => { const next = structuredClone(draft); Object.assign(next.exercises[exerciseIndex]!.sets[setIndex]!, { weightKg: previousSet.weightKg, reps: previousSet.reps }); commit(next); }}>Use previous set</button></div>}
          <div className="set-inputs"><SetValueInput key={`${set.id}:weight`} label="Weight in kilograms" displayLabel="Weight" unit="kg" field="weightKg" value={set.weightKg} onChange={edit} onBlur={() => commit()} /><SetValueInput key={`${set.id}:reps`} label="Repetitions" field="reps" value={set.reps} onChange={edit} onBlur={() => commit()} /></div>
          {set.weightKg !== null && set.reps !== null && !validSetValues(set) && <p role="alert">Use a non-negative load and a positive whole-number repetition count.</p>}
          <button className="complete-button" type="button" disabled={conflict || !validSetValues(set)} onClick={finishSet}><Check size={20} aria-hidden="true" />Complete set</button>
          {/* Explained once: after the first completed set the behaviour is familiar. */}
          {!draft.exercises.some(item => item.sets.some(entry => entry.completed)) && <p className="field-help draft-hint">Drafts save on this device as you type. Leaving a field or completing a set sends the change to your saved workout.</p>}
        </fieldset>}
        <div className="workout-exercise-tools" role="group" aria-label="Workout exercise controls">
          <button data-workout-edit-trigger className="secondary-action" type="button" disabled={conflict || draft.exercises.length >= 200} onClick={() => setPanel({ kind: 'add' })}><Plus size={16} aria-hidden="true" />Add exercise</button>
          <button data-workout-edit-trigger className="secondary-action" type="button" aria-label="Replace current exercise" disabled={conflict || exercise.sets.every(row => row.completed)} onClick={() => setPanel({ kind: 'replace', exerciseId: exercise.id })}><ArrowLeftRight size={16} aria-hidden="true" />Replace exercise</button>
        </div>
        {completePlan && <div className="finish-panel workout-finished"><Check size={28} aria-hidden="true" /><h3>Every planned set is done.</h3><p>{completedCount} {completedCount === 1 ? 'set' : 'sets'} ready to save to history.</p><button data-finish-workout className="primary-action" type="button" disabled={conflict || !canFinishSession(draft)} onClick={finishSession}>Finish workout</button></div>}
        <section className="exercise-log" aria-label="Exercise set log">
          <div className="section-heading"><h4>Set log</h4><span>{exercise.sets.filter(row => row.completed && validSetValues(row)).length} / {exercise.sets.length} completed</span></div>
          <div className="table-scroll"><table className="data-table workout-set-table"><caption className="sr-only">Sets for {exercise.exerciseName}</caption><thead><tr><th>Set</th><th>Previous</th><th>This session</th><th>Status</th></tr></thead><tbody>{exercise.sets.map((row, index) => {
            const ordinal = exercise.sets.slice(0, index + 1).filter(item => item.kind === row.kind).length - 1;
            const previousRow = previousSetAt(prior?.exercise, row.kind, ordinal);
            return <tr key={row.id} aria-current={row.id === set?.id ? 'step' : undefined} className={row.completed ? 'logged-set' : undefined}><th>{index + 1}<small>{row.kind === 'warmup' ? 'warm-up' : 'working'}</small></th><td>{previousRow ? `${previousRow.weightKg} × ${previousRow.reps}` : '—'}</td><td>{row.weightKg ?? '—'} × {row.reps ?? '—'}</td><td><button type="button" className="text-action" disabled={conflict} onClick={() => { if (saveAndFocus(latest => row.completed ? undoGuidedSet(latest, exercise.id, row.id) : selectGuidedSet(latest, exercise.id, row.id))) setAnnouncement(row.completed ? 'Completion undone.' : 'Set selected.'); }}>{row.completed && <Check size={12} aria-hidden="true" />}{row.completed ? `Undo set ${index + 1}` : `Edit set ${index + 1}`}</button></td></tr>;
          })}</tbody></table></div>
          {prior && <p className="previous-performance">Last session · {new Date(prior.session.completedAt!).toLocaleDateString()} · kg as recorded. Use the same per-hand or combined convention.</p>}
          <div className="form-actions set-log-actions"><button className="text-action" type="button" disabled={conflict || exercise.sets.length >= 1000} onClick={() => { commitCurrent(latest => { const next = structuredClone(latest); const target = next.exercises.find(item => item.id === exercise.id)!; const added = { id: `set-${crypto.randomUUID()}`, weightKg: null, reps: null, kind: 'working' as const, completed: false }; target.sets.push(added); return selectGuidedSet(next, target.id, added.id); }); }}><Plus size={15} aria-hidden="true" />Add set</button><button className="text-action danger-text" type="button" disabled={conflict || !set || set.completed || exercise.sets.length <= 1} onClick={() => { commitCurrent(latest => { const next = structuredClone(latest); const target = next.exercises.find(item => item.id === exercise.id)!; const index = target.sets.findIndex(item => item.id === set!.id); target.sets.splice(index, 1); const replacement = target.sets[Math.min(index, target.sets.length - 1)]!; return selectGuidedSet(next, target.id, replacement.id); }); }}>Remove set</button></div>
        </section>
        {draft.notes && <details className="workout-notes"><summary>Workout notes</summary><p className="saved-notes">{draft.notes}</p></details>}
        {!completePlan && <div className="finish-early"><button className="secondary-action" type="button" disabled={conflict || !canFinishSession(draft)} onClick={() => setConfirmFinish(true)}>Finish early</button><p className="field-help">Save the sets you completed if you need to stop here.</p></div>}
      </>}
    </section>
    {exercise && <aside className="exercise-queue">
      <button className="workout-order-toggle" type="button" aria-expanded={queueOpen} aria-controls={queueId} onClick={() => setQueueOpen(!queueOpen)}><span>Workout order<small>{draft.exercises.length} {draft.exercises.length === 1 ? 'exercise' : 'exercises'}</small></span><ChevronDown size={18} aria-hidden="true" /></button>
      <div id={queueId} className={queueOpen ? 'workout-order open' : 'workout-order'}>{draft.exercises.map((item, index) => <div className="queue-edit-row" key={item.id}>
        <button type="button" className={item.id === exercise.id ? 'queue-item active' : 'queue-item'} aria-label={`${index + 1} ${item.exerciseName} ${item.sets.filter(candidate => candidate.completed && validSetValues(candidate)).length}/${item.sets.length} sets`} aria-current={item.id === exercise.id ? 'step' : undefined} disabled={conflict} onClick={() => { const target = item.sets.find(candidate => !candidate.completed) ?? item.sets[0]; if (target) saveAndFocus(latest => selectGuidedSet(latest, item.id, target.id)); }}><span>{item.sets.every(candidate => candidate.completed && validSetValues(candidate)) ? <Check size={14} aria-hidden="true" /> : String(index + 1).padStart(2, '0')}</span><div><strong>{item.exerciseName}</strong><small>{item.sets.filter(candidate => candidate.completed && validSetValues(candidate)).length}/{item.sets.length} sets</small></div></button>
        <button className="icon-button queue-options" type="button" aria-label={`Options for ${item.exerciseName}, exercise ${index + 1}`} disabled={conflict} onClick={() => setPanel({ kind: 'options', exerciseId: item.id })}><MoreHorizontal size={18} aria-hidden="true" /></button>
      </div>)}</div>
      <button className="text-action danger-text queue-discard" type="button" onClick={onDiscard}><Trash2 size={15} aria-hidden="true" />Discard workout</button>
    </aside>}
    <OverlayPresence>{panel?.kind === 'session' && <WorkoutDetailsEditor mode="session" initial={draft} disabled={conflict} saveError={error} onCancel={closePanel} onSave={details => { if (commitCurrent(latest => editSessionDetails(latest, details))) { closePanel(); setAnnouncement('Workout details saved.'); } }} />}</OverlayPresence>
    <OverlayPresence>{panel?.kind === 'add' && <AddExerciseDialog catalog={catalog} disabled={conflict || draft.exercises.length >= 200} saveError={error} onCancel={closePanel} exercises={draft.exercises} currentExerciseId={exercise?.id ?? null} programTarget={programTarget} onCreate={settings => setPanel({ kind: 'create', settings })} onAdd={(definition, choice) => { addExercise(definition, choice, false); }} />}</OverlayPresence>
    <OverlayPresence>{panel?.kind === 'create' && <CreateWorkoutExerciseDialog replacing={Boolean(panel.replacementId)} disabled={conflict || (panel.replacementId ? !draft.exercises.some(item => item.id === panel.replacementId && item.sets.some(row => !row.completed)) : draft.exercises.length >= 200)} saveError={error} onCancel={closePanel} initialSettings={panel.settings} exercises={draft.exercises} currentExerciseId={exercise?.id ?? null} programTarget={programTarget} onSave={(definition, choice) => {
      const replacementId = panel.replacementId;
      if (!replacementId) return addExercise(definition, choice, true);
      const accepted = commitCurrent(latest => replaceSessionExercise(latest, replacementId, definition), definition);
      if (accepted) { closePanel(); setQueueOpen(true); setAnnouncement(`${definition.name} created and used as the replacement.`); }
      return accepted;
    }} />}</OverlayPresence>
    <OverlayPresence>{panel?.kind === 'edit' && panelExercise && <WorkoutDetailsEditor key={panelExercise.id} mode="exercise" initial={panelExercise} disabled={conflict} saveError={error} onCancel={closePanel} onSave={details => { if (commitCurrent(latest => editSessionExercise(latest, panelExercise.id, details))) { closePanel(); setAnnouncement('Exercise details saved.'); } }} />}</OverlayPresence>
    <OverlayPresence>{(panel?.kind === 'options' || panel?.kind === 'replace') && panelExercise && <ExerciseActions key={`${panel.kind}:${panelExercise.id}`} initialReplacing={panel.kind === 'replace'} exercise={panelExercise} catalog={catalog} disabled={conflict} saveError={error} onCancel={closePanel} onCreate={() => setPanel({ kind: 'create', replacementId: panelExercise.id })} onEdit={() => setPanel({ kind: 'edit', exerciseId: panelExercise.id })} onRemove={() => setPanel({ kind: 'remove', exerciseId: panelExercise.id })} onReplace={replacement => { if (commitCurrent(latest => replaceSessionExercise(latest, panelExercise.id, replacement))) { closePanel(); setAnnouncement(`Remaining sets replaced with ${replacement.name}.`); } }} />}</OverlayPresence>
    <OverlayPresence>{panel?.kind === 'remove' && panelExercise && <ConfirmDialog disabled={conflict} error={error} restoreFocusSelector="[data-workout-edit-trigger]" title={`Remove ${panelExercise.exerciseName}?`} message={`${panelExercise.sets.filter(s => s.completed).length} completed sets. This exercise and all its logged results will be removed from this workout.`} confirmLabel="Remove exercise" onCancel={closePanel} onConfirm={() => { if (commitCurrent(latest => removeSessionExercise(latest, panelExercise.id))) { closePanel(); setAnnouncement(`${panelExercise.exerciseName} removed.`); } }} />}</OverlayPresence>
    <OverlayPresence>{confirmFinish && <ConfirmDialog confirmTone="primary" error={error || finishError} title="Finish this workout early?" message={`Save ${completedCount} completed ${completedCount === 1 ? 'set' : 'sets'} to history. ${unfinishedCount} unfinished ${unfinishedCount === 1 ? 'set stays' : 'sets stay'} uncompleted and do not count toward your training totals.`} confirmLabel="Save and finish" disabled={conflict || !canFinishSession(draft)} onCancel={() => setConfirmFinish(false)} onConfirm={finishSession} />}</OverlayPresence>
  </div>;
}

import { canonical } from '../domain/canonical';
import { useEffect, useRef, useState } from 'react';
import type { ExerciseDefinition, WorkoutSession } from '../domain/models';
import { validateAppData } from '../data/validateAppData';
import { createDefaultData } from '../data/defaults';
import { validSetValues } from '../domain/trainingMetrics';
const emptyExercises: ExerciseDefinition[] = [];

function validateDraft(next: WorkoutSession) {
  validateAppData({ ...createDefaultData(), sessions: [next] });
  for (const set of next.exercises.flatMap(exercise => exercise.sets)) {
    if ((set.completed && !validSetValues(set)) || (set.reps !== null && (!Number.isInteger(set.reps) || set.reps <= 0))) throw new Error('Invalid repetitions');
  }
}

export function useWorkoutDraft(session: WorkoutSession, scope: string, onChange: (next: WorkoutSession, newExercises?: ExerciseDefinition[]) => boolean | void, savedExercises: ExerciseDefinition[] = emptyExercises) {
  const key = `forge:workout-draft:${scope}:${session.id}`;
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { base: string; draft: WorkoutSession; submitted?: string[]; newExercises?: ExerciseDefinition[] };
        const shape = structuredClone(saved.draft);
        for (const exercise of shape.exercises) for (const set of exercise.sets) {
          for (const value of [set.weightKg, set.reps]) if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error('Invalid draft');
          set.weightKg = null; set.reps = null;
        }
        validateAppData({ ...createDefaultData(), sessions: [shape] });
        if (saved.newExercises) {
          if (!Array.isArray(saved.newExercises) || saved.newExercises.some(item => !item.isCustom)) throw new Error('Invalid custom exercise draft');
          validateAppData({ ...createDefaultData(), exercises: [...createDefaultData().exercises, ...saved.newExercises] });
        }
        if (typeof saved.base !== 'string' || (saved.submitted && (!Array.isArray(saved.submitted) || saved.submitted.some(value => typeof value !== 'string')))) throw new Error('Invalid draft baseline');
        if (saved.draft.id === session.id && !saved.draft.completedAt) return { ...saved, base: canonical(JSON.parse(saved.base)), submitted: saved.submitted?.map(value => canonical(JSON.parse(value))) };
      }
    } catch { /* Ignore corrupt drafts; canonical data remains available. */ }
    return { base: canonical(session), draft: structuredClone(session), submitted: [] as string[] };
  });
  const [draft, setDraft] = useState(initial.draft);
  const current = useRef(initial.draft);
  const base = useRef(initial.base);
  const [conflict, setConflict] = useState(!initial.submitted?.includes(canonical(session)) && initial.base !== canonical(session) && canonical(initial.draft) !== canonical(session));
  const [error, setError] = useState('');
  const submitted = useRef(new Set<string>(initial.submitted ?? []));
  const newExercises = useRef<ExerciseDefinition[]>(initial.newExercises ?? []);
  const saveTimer = useRef<number | null>(null);
  function saveDraft(next: WorkoutSession) {
    try { localStorage.setItem(key, JSON.stringify({ base: base.current, draft: next, submitted: [...submitted.current], newExercises: newExercises.current })); }
    catch { setError('This draft could not be saved on this device. Keep the app open and retry after freeing storage.'); }
  }
  useEffect(() => () => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      try { localStorage.setItem(key, JSON.stringify({ base: base.current, draft: current.current, submitted: [...submitted.current], newExercises: newExercises.current })); } catch { /* The next open will use saved session data. */ }
    }
  }, [key]);
  useEffect(() => {
    const incoming = canonical(session);
    const local = canonical(current.current);
    const definitionsAcknowledged = newExercises.current.every(definition => savedExercises.some(saved => saved.id === definition.id && canonical(saved) === canonical(definition)));
    if ((incoming === local || local === base.current) && definitionsAcknowledged) {
      if (incoming === local && submitted.current.has(incoming)) setError('');
      submitted.current.clear(); newExercises.current = []; current.current = structuredClone(session); base.current = incoming; setDraft(current.current); setConflict(false);
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
      try { localStorage.removeItem(key); } catch { /* A stale draft is rejected by its baseline. */ }
    } else if (submitted.current.has(incoming)) {
      for (const value of submitted.current) { submitted.current.delete(value); if (value === incoming) break; }
      base.current = incoming; setConflict(false);
      try { localStorage.setItem(key, JSON.stringify({ base: incoming, draft: current.current, submitted: [...submitted.current], newExercises: newExercises.current })); } catch { setError('This draft could not be saved on this device. Keep the app open.'); }
    } else if (incoming !== base.current) setConflict(true);
  }, [session, key, savedExercises]);
  function change(next: WorkoutSession, immediate = false) {
    current.current = next; setDraft(next); setError('');
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = null;
    if (immediate) saveDraft(next);
    else saveTimer.current = window.setTimeout(() => { saveTimer.current = null; saveDraft(current.current); }, 200);
  }
  function changeCurrent(update: (latest: WorkoutSession) => WorkoutSession) {
    // A page can reload before a debounce or React cleanup runs. Persist the
    // device draft synchronously; account writes still happen at commit points.
    change(update(current.current), true);
  }
  function persist(next: WorkoutSession, retainOnFailure: boolean, newExercise?: ExerciseDefinition) {
    const definitions = newExercise ? [...newExercises.current.filter(item => item.id !== newExercise.id), newExercise] : newExercises.current;
    try { validateDraft(next); }
    catch { if (retainOnFailure) change(next); setError('Correct the invalid set values before this draft can be saved to your workout.'); return false; }
    if (canonical(next) !== base.current || definitions.length) {
      const submittedValue = canonical(next);
      submitted.current.add(submittedValue);
      let accepted = false;
      try { accepted = (definitions.length ? onChange(next, definitions) : onChange(next)) !== false; } catch { /* Keep the current editor available for retry. */ }
      if (!accepted) {
        submitted.current.delete(submittedValue);
        if (retainOnFailure) change(next, true);
        setError('This change could not be saved. Keep the app open and retry.');
        return false;
      }
    }
    newExercises.current = definitions;
    change(next, true);
    return true;
  }
  function commit(next = current.current, retainOnFailure = true, newExercise?: ExerciseDefinition) {
    return !conflict && persist(next, retainOnFailure, newExercise);
  }
  function resolve(keepLocal: boolean) {
    setConflict(false); base.current = canonical(session);
    if (keepLocal) persist(current.current, true);
    else { if (saveTimer.current !== null) window.clearTimeout(saveTimer.current); saveTimer.current = null; newExercises.current = []; current.current = structuredClone(session); setDraft(current.current); setError(''); try { localStorage.removeItem(key); } catch { /* Optional cleanup. */ } }
  }
  function commitCurrent(update: (latest: WorkoutSession) => WorkoutSession, newExercise?: ExerciseDefinition) {
    return !conflict && commit(update(current.current), false, newExercise);
  }
  return { draft, change, changeCurrent, commit, commitCurrent, conflict, resolve, error };
}

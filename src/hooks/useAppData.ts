import { availableExercises, exercisesForProgram } from '../domain/exerciseCatalog';
import { applyMutation } from '../domain/appMutations';
import { useEffect, useRef, useState } from 'react';
import type { AppDataV2, BodyMeasurement, BodyProfile, ExerciseDefinition, FoodDefinition, FoodLogEntry, NutritionTarget, Program, WorkoutSession, WorkoutTemplate } from '../domain/models';
import { createDefaultData } from '../data/defaults';
import { LocalStorageWorkoutRepository, STORAGE_KEY } from '../data/localStorageRepository';
import { resetDataScope, type DataResetScope } from '../data/localStorageRepository';
import { canFinishSession, createCustomSession, createSession } from '../domain/workout';
import { upsertNutritionTarget } from '../domain/foodDiary';
import { canonical } from '../domain/canonical';
import type { WorkoutPreferences } from '../domain/models';

const getRepository = () => typeof window === 'undefined' ? null : new LocalStorageWorkoutRepository(window.localStorage);
const messageFor = (reason: unknown, fallback: string) => reason && typeof reason === 'object' && 'message' in reason && typeof reason.message === 'string' ? reason.message : fallback;

function removeLocalDrafts(sessionId?: string) {
  try {
    const prefix = 'forge:workout-draft:local:';
    if (sessionId) localStorage.removeItem(`${prefix}${sessionId}`);
    else {
      const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
      for (const key of keys) if (key?.startsWith(prefix)) localStorage.removeItem(key);
    }
  } catch { /* Canonical session data has already been saved; draft cleanup is optional. */ }
}

export function useAppData() {
  const [initial] = useState(() => {
    try { return { data: getRepository()?.load() ?? createDefaultData(), error: null as string | null }; }
    catch (reason) { return { data: createDefaultData(), error: messageFor(reason, 'Could not load workout data.') }; }
  });
  const [error, setError] = useState<string | null>(initial.error);
  const [loadError, setLoadError] = useState<string | null>(initial.error);
  const [data, setData] = useState<AppDataV2>(initial.data);
  const currentData = useRef(initial.data);
  const readFailure = useRef(initial.error);

  useEffect(() => {
    function receiveStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea && event.storageArea !== window.localStorage) return;
        const next = getRepository()!.load();
        currentData.current = next; setData(next);
        readFailure.current = null; setLoadError(null); setError(null);
      } catch (reason) {
        const message = messageFor(reason, 'Could not read the data changed in another tab.');
        readFailure.current = message; setLoadError(message); setError(message);
      }
    }
    window.addEventListener('storage', receiveStorage);
    return () => window.removeEventListener('storage', receiveStorage);
  }, []);

  function updateData(update: (current: AppDataV2) => AppDataV2, allowReplacement = false): boolean {
    if (readFailure.current && !allowReplacement) {
      setError('Your saved data could not be read. Download the original data or restore a backup before editing.');
      return false;
    }
    let reading = !allowReplacement;
    try {
      if (!allowReplacement) {
        const stored = getRepository()?.load() ?? currentData.current;
        if (canonical(stored) !== canonical(currentData.current)) {
          currentData.current = stored; setData(stored);
          setError('Your data changed in another tab. The latest copy is loaded. Review it and retry your edit.');
          return false;
        }
      }
      reading = false;
      const next = update(currentData.current);
      getRepository()?.save(next);
      currentData.current = next; setData(next);
      readFailure.current = null; setLoadError(null); setError(null);
      return true;
    } catch (reason) {
      const message = messageFor(reason, 'Could not save workout data.');
      if (reading) { readFailure.current = message; setLoadError(message); }
      setError(message);
      return false;
    }
  }

  function retryLoad(): boolean {
    try {
      const next = getRepository()?.load() ?? createDefaultData();
      currentData.current = next; setData(next);
      readFailure.current = null; setLoadError(null); setError(null);
      return true;
    } catch (reason) {
      const message = messageFor(reason, 'Could not load workout data.');
      readFailure.current = message; setLoadError(message); setError(message);
      return false;
    }
  }

  function saveProgram(program: Program) {
    return updateData((current) => {
      const exists = current.programs.some((item) => item.id === program.id);
      return { ...current, exercises: exercisesForProgram(current.exercises, program), programs: exists ? current.programs.map((item) => item.id === program.id ? program : item) : [...current.programs, program] };
    });
  }

  function deleteProgram(programId: string) {
    return updateData((current) => ({ ...current, programs: current.programs.filter((item) => item.id !== programId) }));
  }

  function saveExercise(exercise: ExerciseDefinition) {
    return updateData((current) => {
      const exists = current.exercises.some((item) => item.id === exercise.id);
      return { ...current, exercises: exists ? current.exercises.map((item) => item.id === exercise.id ? exercise : item) : [...current.exercises, exercise] };
    });
  }

  function startWorkout(programId: string, workoutId: string) {
    return updateData((current) => {
      if (current.sessions.some((session) => session.completedAt === null)) return current;
      const program = current.programs.find((item) => item.id === programId);
      const workout = program?.workouts.find((item) => item.id === workoutId);
      if (!program || !workout) return current;
      return {
        ...current,
        sessions: [...current.sessions, createSession(program, workout, current.exercises, new Date().toISOString())],
        settings: { ...current.settings, lastSelectedProgramId: programId },
      };
    });
  }

  function startCustomWorkout(workout: WorkoutTemplate) {
    return updateData(current => {
      if (current.sessions.some(session => session.completedAt === null)) return current;
      return applyMutation(current, { kind: 'startWorkout', session: createCustomSession(workout, availableExercises(current.exercises), new Date().toISOString()), programId: null });
    });
  }

  function updateSession(session: WorkoutSession, newExercises?: ExerciseDefinition[]) {
    return updateData((current) => current.sessions.some(item => item.id === session.id) ? applyMutation(current, { kind: 'updateSession', session, ...(newExercises?.length ? { newExercises } : {}) }) : current);
  }

  function finishWorkout(sessionId: string) {
    const saved = updateData((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== sessionId || session.completedAt !== null) return session;
        return canFinishSession(session) ? { ...session, completedAt: new Date().toISOString(), guide: { ...session.guide, restTimer: null } } : session;
      }),
    }));
    if (saved && currentData.current.sessions.find(session => session.id === sessionId)?.completedAt) removeLocalDrafts(sessionId);
    return saved;
  }

  function discardWorkout(sessionId: string) {
    const saved = updateData((current) => ({ ...current, sessions: current.sessions.filter((session) => session.id !== sessionId || session.completedAt !== null) }));
    if (saved && !currentData.current.sessions.some(session => session.id === sessionId)) removeLocalDrafts(sessionId);
    return saved;
  }

  function saveWorkoutPreferences(preferences: WorkoutPreferences) {
    return updateData(current => ({ ...current, settings: { ...current.settings, ...preferences } }));
  }

  function deleteSession(sessionId: string) {
    return updateData(current => ({ ...current, sessions: current.sessions.filter(session => session.id !== sessionId || session.completedAt === null) }));
  }

  function saveBodyProfile(profile: BodyProfile) {
    return updateData((current) => ({ ...current, body: { ...current.body, profile } }));
  }

  function saveBodyMeasurement(measurement: BodyMeasurement) {
    return updateData((current) => {
      const exists = current.body.measurements.some((item) => item.id === measurement.id);
      return { ...current, body: { ...current.body, measurements: exists ? current.body.measurements.map((item) => item.id === measurement.id ? measurement : item) : [...current.body.measurements, measurement] } };
    });
  }

  function deleteBodyMeasurement(measurementId: string) {
    return updateData((current) => ({ ...current, body: { ...current.body, measurements: current.body.measurements.filter((item) => item.id !== measurementId) } }));
  }

  function saveNutritionTarget(target: NutritionTarget) {
    return updateData((current) => ({ ...current, nutrition: { ...current.nutrition, targets: upsertNutritionTarget(current.nutrition.targets, target) } }));
  }

  function saveCustomFood(food: FoodDefinition) {
    return updateData((current) => ({ ...current, nutrition: { ...current.nutrition, customFoods: [...current.nutrition.customFoods.filter((item) => item.id !== food.id), food] } }));
  }

  function addFoodEntry(entry: FoodLogEntry) {
    return updateData((current) => ({ ...current, nutrition: { ...current.nutrition, diary: [...current.nutrition.diary.filter(item => item.id !== entry.id), entry] } }));
  }

  function copyFoodEntries(entries: FoodLogEntry[]) {
    return updateData(current => ({ ...current, nutrition: { ...current.nutrition, diary: [...current.nutrition.diary, ...entries.filter(entry => !current.nutrition.diary.some(item => item.id === entry.id))] } }));
  }

  function deleteFoodEntry(entryId: string) {
    return updateData((current) => ({ ...current, nutrition: { ...current.nutrition, diary: current.nutrition.diary.filter((entry) => entry.id !== entryId) } }));
  }

  function replaceData(next: AppDataV2) {
    const saved = updateData(() => next, true);
    if (saved) removeLocalDrafts();
    return saved;
  }

  function resetData(scope: DataResetScope) {
    const saved = updateData((current) => resetDataScope(current, scope), scope === 'all');
    if (saved && (scope === 'workouts' || scope === 'all')) removeLocalDrafts();
    return saved;
  }

  return { data, error, loadError, retryLoad, updateData, saveWorkoutPreferences, saveProgram, deleteProgram, saveExercise, startWorkout, startCustomWorkout, updateSession, finishWorkout, discardWorkout, deleteSession, saveBodyProfile, saveBodyMeasurement, deleteBodyMeasurement, saveNutritionTarget, saveCustomFood, addFoodEntry, copyFoodEntries, deleteFoodEntry, replaceData, resetData };
}

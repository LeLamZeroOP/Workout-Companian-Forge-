import { availableExercises } from '../domain/exerciseCatalog';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createDefaultData } from '../data/defaults';
import { cloudClient } from '../data/cloudClient';
import { CloudRepository, createSupabaseDocumentGateway } from '../data/cloudRepository';
import { CloudSync, type SyncView, type PreparedMerge, type ConflictReview } from '../data/cloudSync';
import type { MergeChoice, MergeSelection } from '../domain/selectiveMerge';
import { OfflineStore } from '../data/offlineStore';
import { canFinishSession, createCustomSession, createSession } from '../domain/workout';
import type { WorkoutPreferences } from '../domain/models';
import { applyMutation, getConflictScope, readConflictValue, type AppMutation } from '../domain/appMutations';
import type { AppDataV2, BodyMeasurement, BodyProfile, ExerciseDefinition, FoodDefinition, FoodLogEntry, NutritionTarget, Program, WorkoutSession, WorkoutTemplate } from '../domain/models';

const offlineStore = typeof indexedDB === 'undefined' ? null : new OfflineStore();
const cloudSync = cloudClient && offlineStore ? new CloudSync(new CloudRepository(createSupabaseDocumentGateway(cloudClient)), offlineStore) : null;

export function useCloudAppData() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<SyncView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine);
  const actionChain = useRef<Promise<void>>(Promise.resolve());
  const userIdRef = useRef<string | null>(null);
  const viewRef = useRef<SyncView | null>(null);
  const scheduled = useRef<Array<{ userId: string; mutation: AppMutation }>>([]);

  const showView = useCallback((next: SyncView | null) => { viewRef.current = next; setView(next); }, []);

  const refresh = useCallback(async (userId: string) => {
    if (!cloudSync) return;
    try {
      const opened = await cloudSync.open(userId, createDefaultData());
      if (userIdRef.current !== userId) return;
      showView(opened);
      setError(null);
      if (navigator.onLine) {
        const synced = await cloudSync.flush(userId);
        if (userIdRef.current === userId) showView(synced);
      }
    } catch (reason) {
      if (userIdRef.current === userId) setError(reason instanceof Error ? reason.message : 'Cloud data could not be loaded.');
    }
  }, [showView]);

  useEffect(() => {
    if (!cloudClient) return;
    let active = true;
    const selectUser = (next: User | null) => {
      if (!active) return;
      if (userIdRef.current !== (next?.id ?? null)) {
        userIdRef.current = next?.id ?? null;
        showView(null);
        setError(null);
      }
      setUser(next);
      setAuthReady(true);
      if (next) void refresh(next.id);
    };
    let authEventReceived = false;
    void cloudClient.auth.getSession().then(({ data, error: authError }) => {
      if (!active || authEventReceived) return;
      selectUser(data.session?.user ?? null);
      if (authError) setError(authError.message);
    });
    const { data: subscription } = cloudClient.auth.onAuthStateChange((_event, session) => { authEventReceived = true; selectUser(session?.user ?? null); });
    return () => { active = false; subscription.subscription.unsubscribe(); };
  }, [refresh, showView]);

  useEffect(() => {
    if (!user) return;
    const sync = () => { setOffline(!navigator.onLine); if (navigator.onLine) void refresh(user.id); };
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    window.addEventListener('focus', sync);
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync); window.removeEventListener('focus', sync); };
  }, [refresh, user]);

  const dispatch = useCallback((mutation: AppMutation) => {
    const userId = userIdRef.current;
    if (!userId || !cloudSync) return;
    const displayed = viewRef.current;
    if (!displayed) return;
    const projected = scheduled.current.filter((item) => item.userId === userId).reduce((data, item) => applyMutation(data, item.mutation), displayed.data);
    const expected = { before: readConflictValue(projected, getConflictScope(mutation)), revision: displayed.revision };
    const queued = { userId, mutation };
    scheduled.current.push(queued);
    actionChain.current = actionChain.current.catch(() => {}).then(async () => {
      try {
        if (userIdRef.current !== userId) return;
        const next = await cloudSync.enqueue(userId, mutation, expected);
        scheduled.current = scheduled.current.filter((item) => item !== queued);
        if (userIdRef.current !== userId) return;
        showView(next);
        setError(null);
        if (navigator.onLine) {
          const synced = await cloudSync.flush(userId);
          if (userIdRef.current === userId) showView(synced);
        }
      } catch (reason) {
        if (userIdRef.current === userId) setError(reason instanceof Error ? reason.message : 'Change was not saved.');
      } finally { scheduled.current = scheduled.current.filter((item) => item !== queued); }
    });
  }, [showView]);

  async function signIn() {
    if (!cloudClient) return;
    setAuthBusy(true);
    setError(null);
    const { error: signInError } = await cloudClient.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, scopes: 'openid email profile' } });
    if (signInError) { setError(signInError.message); setAuthBusy(false); }
  }

  async function signOut() {
    if (!cloudClient) return;
    await actionChain.current.catch(() => {});
    const userId = userIdRef.current;
    if (offlineStore && userId && (await offlineStore.load(userId))?.recovery?.some((operation) => operation.status === 'prepared')) {
      setError('Reconnect and Retry sync to reconcile the pending account operation before signing out.'); return;
    }
    if (viewRef.current && viewRef.current.pendingCount > 0) {
      setError('Resolve and sync pending changes before signing out. Exporting creates a backup; it does not sync the queue.');
      return;
    }
    if (userIdRef.current !== userId) return;
    const { error: signOutError } = await cloudClient.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }

  async function importData(nextData: AppDataV2) {
    const userId = userIdRef.current;
    if (!cloudSync || !userId) return;
    await actionChain.current.catch(() => {});
    if (userIdRef.current !== userId) throw new Error('Account changed.');
    try {
      const next = await cloudSync.replaceExact(userId, nextData);
      if (userIdRef.current === userId) { showView(next); setError(null); }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Cloud import failed.');
      throw reason;
    }
  }

  async function prepareMerge(source: AppDataV2, selection: MergeSelection) {
    const userId = userIdRef.current;
    if (!cloudSync || !userId) throw new Error('Sign in before merging.');
    await actionChain.current.catch(() => {});
    if (userIdRef.current !== userId) throw new Error('Account changed.');
    const result = await cloudSync.prepareMerge(userId, source, selection);
    if (userIdRef.current !== userId) throw new Error('Account changed.');
    return result;
  }

  async function commitMerge(review: PreparedMerge, source: AppDataV2) {
    if (!cloudSync || userIdRef.current !== review.userId) throw new Error('Account changed.');
    await actionChain.current.catch(() => {});
    const result = await cloudSync.commitMerge(review, source, () => userIdRef.current === review.userId);
    if (userIdRef.current !== review.userId) throw new Error('Account changed.');
    showView(result); setError(null);
  }

  async function reviewConflicts() {
    const userId = userIdRef.current;
    if (!cloudSync || !userId) throw new Error('Sign in to review conflicts.');
    await actionChain.current.catch(() => {});
    const result = await cloudSync.reviewConflicts(userId);
    if (userIdRef.current !== userId) throw new Error('Account changed.');
    return result;
  }

  async function resolveConflicts(review: ConflictReview, choices: Record<string, MergeChoice>) {
    if (!cloudSync || userIdRef.current !== review.userId) throw new Error('Account changed.');
    await actionChain.current.catch(() => {});
    const result = await cloudSync.resolveConflicts(review, choices, () => userIdRef.current === review.userId);
    if (userIdRef.current !== review.userId) throw new Error('Account changed.');
    showView(result); setError(null);
  }

  async function getDeviceBackup() {
    const userId = userIdRef.current;
    if (!offlineStore || !userId) throw new Error('No signed-in account.');
    const state = await offlineStore.load(userId);
    if (!state) throw new Error('No saved account data.');
    return state;
  }

  function startWorkout(programId: string, workoutId: string) {
    const current = viewRef.current?.data;
    if (!current || current.sessions.some((session) => session.completedAt === null)) return;
    const program = current.programs.find((item) => item.id === programId);
    const workout = program?.workouts.find((item) => item.id === workoutId);
    if (program && workout) dispatch({ kind: 'startWorkout', session: createSession(program, workout, current.exercises, new Date().toISOString()), programId });
  }

  function startCustomWorkout(workout: WorkoutTemplate) {
    const displayed = viewRef.current?.data;
    const current = displayed && scheduled.current.filter(item => item.userId === userIdRef.current).reduce((data, item) => applyMutation(data, item.mutation), displayed);
    if (!current || current.sessions.some(session => session.completedAt === null)) return false;
    try {
      dispatch({ kind: 'startWorkout', session: createCustomSession(workout, availableExercises(current.exercises), new Date().toISOString()), programId: null });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not start custom workout.');
      return false;
    }
  }

  function finishWorkout(sessionId: string) {
    const displayed = viewRef.current?.data;
    const projected = displayed && scheduled.current.filter(item => item.userId === userIdRef.current).reduce((data,item) => applyMutation(data,item.mutation), displayed);
    const session = projected?.sessions.find((item) => item.id === sessionId);
    if (!session || session.completedAt) return;
    if (canFinishSession(session)) dispatch({ kind: 'finishWorkout', sessionId, completedAt: new Date().toISOString() });
  }

  return {
    user, authReady, authBusy, offline, data: view?.data ?? null, error,
    pendingCount: view?.pendingCount ?? 0, conflictCount: view?.conflictCount ?? 0,
    signIn, signOut, importData, getDeviceBackup, prepareMerge, commitMerge, reviewConflicts, resolveConflicts, retry: () => user && void refresh(user.id),
    saveProgram: (program: Program) => dispatch({ kind: 'saveProgram', program }),
    saveWorkoutPreferences: (preferences: WorkoutPreferences) => dispatch({ kind: 'saveWorkoutPreferences', preferences }),
    deleteProgram: (programId: string) => dispatch({ kind: 'deleteProgram', programId }),
    saveExercise: (exercise: ExerciseDefinition) => dispatch({ kind: 'saveExercise', exercise }),
    startWorkout,
    startCustomWorkout,
    updateSession: (session: WorkoutSession, newExercises?: ExerciseDefinition[]) => dispatch({ kind: 'updateSession', session, ...(newExercises?.length ? { newExercises } : {}) }),
    finishWorkout,
    discardWorkout: (sessionId: string) => dispatch({ kind: 'discardWorkout', sessionId }),
    deleteSession: (sessionId: string) => dispatch({ kind: 'deleteSession', sessionId }),
    saveBodyProfile: (profile: BodyProfile) => dispatch({ kind: 'saveBodyProfile', profile }),
    saveBodyMeasurement: (measurement: BodyMeasurement) => dispatch({ kind: 'saveBodyMeasurement', measurement }),
    deleteBodyMeasurement: (measurementId: string) => dispatch({ kind: 'deleteBodyMeasurement', measurementId }),
    saveNutritionTarget: (target: NutritionTarget) => dispatch({ kind: 'saveNutritionTarget', target }),
    saveCustomFood: (food: FoodDefinition) => dispatch({ kind: 'saveCustomFood', food }),
    copyFoodEntries: (entries: FoodLogEntry[]) => dispatch({ kind: 'copyFoodEntries', entries }),
    addFoodEntry: (entry: FoodLogEntry) => dispatch({ kind: 'addFoodEntry', entry }),
    deleteFoodEntry: (entryId: string) => dispatch({ kind: 'deleteFoodEntry', entryId }),
  };
}

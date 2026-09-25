import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createDefaultData } from '../data/defaults';
import { cloudClient } from '../data/cloudClient';
import { CloudRepository, createSupabaseDocumentGateway } from '../data/cloudRepository';
import { CloudSync, type SyncView } from '../data/cloudSync';
import { OfflineStore } from '../data/offlineStore';
import { createSession } from '../domain/workout';
import type { AppMutation } from '../domain/appMutations';
import type { AppDataV2, BodyMeasurement, BodyProfile, ExerciseDefinition, FoodDefinition, FoodLogEntry, NutritionTarget, Program, WorkoutSession } from '../domain/models';

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
    void cloudClient.auth.getUser().then(({ data, error: authError }) => {
      if (authError && active) setError(authError.message);
      selectUser(data.user);
    });
    const { data: subscription } = cloudClient.auth.onAuthStateChange((_event, session) => selectUser(session?.user ?? null));
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
    actionChain.current = actionChain.current.catch(() => {}).then(async () => {
      try {
        const next = await cloudSync.enqueue(userId, mutation);
        if (userIdRef.current !== userId) return;
        showView(next);
        setError(null);
        if (navigator.onLine) {
          const synced = await cloudSync.flush(userId);
          if (userIdRef.current === userId) showView(synced);
        }
      } catch (reason) {
        if (userIdRef.current === userId) setError(reason instanceof Error ? reason.message : 'Change was not saved.');
      }
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
    if (viewRef.current && viewRef.current.pendingCount > 0) {
      setError('Sync or export pending changes before signing out.');
      return;
    }
    const { error: signOutError } = await cloudClient.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }

  async function importData(nextData: AppDataV2) {
    const userId = userIdRef.current;
    if (!cloudSync || !userId) return;
    try {
      const next = await cloudSync.replaceExact(userId, nextData);
      if (userIdRef.current === userId) { showView(next); setError(null); }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Cloud import failed.');
      throw reason;
    }
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

  function finishWorkout(sessionId: string) {
    const session = viewRef.current?.data.sessions.find((item) => item.id === sessionId);
    if (!session || session.completedAt) return;
    const hasCompletedSet = session.exercises.some((exercise) => exercise.sets.some((set) => set.completed && set.weightKg !== null && set.reps !== null));
    if (hasCompletedSet) dispatch({ kind: 'finishWorkout', sessionId, completedAt: new Date().toISOString() });
  }

  return {
    user, authReady, authBusy, offline, data: view?.data ?? null, error,
    pendingCount: view?.pendingCount ?? 0, conflictCount: view?.conflictCount ?? 0,
    signIn, signOut, importData, getDeviceBackup, retry: () => user && void refresh(user.id),
    saveProgram: (program: Program) => dispatch({ kind: 'saveProgram', program }),
    deleteProgram: (programId: string) => dispatch({ kind: 'deleteProgram', programId }),
    saveExercise: (exercise: ExerciseDefinition) => dispatch({ kind: 'saveExercise', exercise }),
    startWorkout,
    updateSession: (session: WorkoutSession) => dispatch({ kind: 'updateSession', session }),
    finishWorkout,
    discardWorkout: (sessionId: string) => dispatch({ kind: 'discardWorkout', sessionId }),
    saveBodyProfile: (profile: BodyProfile) => dispatch({ kind: 'saveBodyProfile', profile }),
    saveBodyMeasurement: (measurement: BodyMeasurement) => dispatch({ kind: 'saveBodyMeasurement', measurement }),
    deleteBodyMeasurement: (measurementId: string) => dispatch({ kind: 'deleteBodyMeasurement', measurementId }),
    saveNutritionTarget: (target: NutritionTarget) => dispatch({ kind: 'saveNutritionTarget', target }),
    saveCustomFood: (food: FoodDefinition) => dispatch({ kind: 'saveCustomFood', food }),
    addFoodEntry: (entry: FoodLogEntry) => dispatch({ kind: 'addFoodEntry', entry }),
    deleteFoodEntry: (entryId: string) => dispatch({ kind: 'deleteFoodEntry', entryId }),
  };
}

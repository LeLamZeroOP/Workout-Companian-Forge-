import { useState } from 'react';
import type { AppDataV1, ExerciseDefinition, Program, WorkoutSession } from '../domain/models';
import { createDefaultData } from '../data/defaults';
import { LocalStorageWorkoutRepository } from '../data/localStorageRepository';
import { createSession } from '../domain/workout';

const repository = typeof window === 'undefined' ? null : new LocalStorageWorkoutRepository(window.localStorage);

export function useAppData() {
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AppDataV1>(() => {
    try { return repository?.load() ?? createDefaultData(); }
    catch (reason) { setTimeout(() => setError(reason instanceof Error ? reason.message : 'Could not load workout data.')); return createDefaultData(); }
  });

  function updateData(update: (current: AppDataV1) => AppDataV1) {
    setData((current) => {
      const next = update(current);
      try { repository?.save(next); setError(null); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save workout data.'); }
      return next;
    });
  }

  function saveProgram(program: Program) {
    updateData((current) => {
      const exists = current.programs.some((item) => item.id === program.id);
      return { ...current, programs: exists ? current.programs.map((item) => item.id === program.id ? program : item) : [...current.programs, program] };
    });
  }

  function deleteProgram(programId: string) {
    updateData((current) => ({ ...current, programs: current.programs.filter((item) => item.id !== programId) }));
  }

  function saveExercise(exercise: ExerciseDefinition) {
    updateData((current) => {
      const exists = current.exercises.some((item) => item.id === exercise.id);
      return { ...current, exercises: exists ? current.exercises.map((item) => item.id === exercise.id ? exercise : item) : [...current.exercises, exercise] };
    });
  }

  function startWorkout(programId: string, workoutId: string) {
    updateData((current) => {
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

  function updateSession(session: WorkoutSession) {
    updateData((current) => ({ ...current, sessions: current.sessions.map((item) => item.id === session.id ? session : item) }));
  }

  function finishWorkout(sessionId: string) {
    updateData((current) => ({
      ...current,
      sessions: current.sessions.map((session) => {
        if (session.id !== sessionId || session.completedAt !== null) return session;
        const hasCompletedSet = session.exercises.some((exercise) => exercise.sets.some((set) => set.completed && set.weightKg !== null && set.reps !== null));
        return hasCompletedSet ? { ...session, completedAt: new Date().toISOString(), guide: { ...session.guide, restTimer: null } } : session;
      }),
    }));
  }

  function discardWorkout(sessionId: string) {
    updateData((current) => ({ ...current, sessions: current.sessions.filter((session) => session.id !== sessionId || session.completedAt !== null) }));
  }

  return { data, error, updateData, saveProgram, deleteProgram, saveExercise, startWorkout, updateSession, finishWorkout, discardWorkout };
}

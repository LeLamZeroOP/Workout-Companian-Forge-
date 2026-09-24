import { useState } from 'react';
import type { Program, WorkoutSession } from '../../domain/models';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useElapsedTime } from '../../hooks/useElapsedTime';
import { useWakeLock } from '../../hooks/useWakeLock';
import { GuidedWorkout } from './GuidedWorkout';
import { StartWorkoutDialog } from './StartWorkoutDialog';

function ActiveWorkout({ session, onChange, onFinish, onDiscard, keepScreenAwake }: { session: WorkoutSession; onChange: (session: WorkoutSession) => void; onFinish: () => void; onDiscard: () => void; keepScreenAwake: boolean }) {
  const elapsed = useElapsedTime(session.startedAt);
  useWakeLock(keepScreenAwake);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  return <section><div className="workout-heading"><div><p className="eyebrow">{session.programName}</p><h2>{session.workoutName}</h2></div><div className="elapsed"><span>Elapsed</span><strong>{elapsed.label}</strong></div></div><GuidedWorkout session={session} onChange={onChange} onFinish={onFinish} onDiscard={() => setConfirmDiscard(true)} />{confirmDiscard && <ConfirmDialog title="Discard this workout?" message="All entries from this unfinished session will be removed." confirmLabel="Discard workout" onCancel={() => setConfirmDiscard(false)} onConfirm={onDiscard} />}</section>;
}

export function WorkoutPage({ programs, sessions, lastSelectedProgramId, keepScreenAwake, onStart, onChange, onFinish, onDiscard }: { programs: Program[]; sessions: WorkoutSession[]; lastSelectedProgramId: string | null; keepScreenAwake: boolean; onStart: (programId: string, workoutId: string) => void; onChange: (session: WorkoutSession) => void; onFinish: (sessionId: string) => void; onDiscard: (sessionId: string) => void }) {
  const active = sessions.find((session) => session.completedAt === null);
  if (active) return <ActiveWorkout session={active} keepScreenAwake={keepScreenAwake} onChange={onChange} onFinish={() => onFinish(active.id)} onDiscard={() => onDiscard(active.id)} />;
  return <StartWorkoutDialog programs={programs} initialProgramId={lastSelectedProgramId} onStart={onStart} />;
}

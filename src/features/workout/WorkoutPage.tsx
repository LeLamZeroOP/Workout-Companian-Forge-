import { CustomWorkoutForm } from './CustomWorkoutForm';
import { OverlayPresence } from '../../components/OverlayPresence';
import { useState } from 'react';
import type { ExerciseDefinition, Program, WorkoutPreferences, WorkoutSession, WorkoutTemplate } from '../../domain/models';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useElapsedTime } from '../../hooks/useElapsedTime';
import { useWakeLock } from '../../hooks/useWakeLock';
import { GuidedWorkout } from './GuidedWorkout';
import { StartWorkoutDialog } from './StartWorkoutDialog';
import { WorkoutCompletion } from './WorkoutCompletion';
import { availableExercises } from '../../domain/exerciseCatalog';

function ActiveWorkout({ session, catalog, onChange, onFinish, onDiscard, keepScreenAwake, history, storageScope, restAlertSound, restAlertVibration }: { restAlertSound: boolean; restAlertVibration: boolean; session: WorkoutSession; catalog: ExerciseDefinition[]; onChange: (session: WorkoutSession, newExercises?: ExerciseDefinition[]) => boolean | void; onFinish: () => boolean | void; onDiscard: () => boolean | void; keepScreenAwake: boolean; history: WorkoutSession[]; storageScope: string }) {
  useWakeLock(keepScreenAwake);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [discardError, setDiscardError] = useState('');
  function discard() {
    setDiscardError('');
    let accepted = false;
    try { accepted = onDiscard() !== false; } catch { /* Keep the confirmation available for retry. */ }
    if (accepted) setConfirmDiscard(false);
    else setDiscardError('This workout could not be discarded. Keep the app open and retry.');
  }
  return <section className="active-workout"><div className="workout-heading"><div className="session-live"><span aria-hidden="true" /><div><p className="eyebrow">In progress</p><p>{session.programName}</p></div></div><ElapsedDisplay startedAt={session.startedAt} /></div><GuidedWorkout restAlertSound={restAlertSound} restAlertVibration={restAlertVibration} key={`${storageScope}:${session.id}`} catalog={catalog} storageScope={storageScope} history={history} session={session} onChange={onChange} onFinish={onFinish} onDiscard={() => { setDiscardError(''); setConfirmDiscard(true); }} /><OverlayPresence>{confirmDiscard && <ConfirmDialog error={discardError} title="Discard this workout?" message="All entries from this unfinished session will be removed." confirmLabel="Discard workout" onCancel={() => setConfirmDiscard(false)} onConfirm={discard} />}</OverlayPresence></section>;
}

function ElapsedDisplay({ startedAt }: { startedAt: string }) {
  const elapsed = useElapsedTime(startedAt);
  return <div className="elapsed"><span>Elapsed</span><strong>{elapsed.label}</strong></div>;
}

export function WorkoutPage({ programs, catalog: savedCatalog = [], sessions, lastSelectedProgramId, keepScreenAwake, onStart, onStartCustom, onChange, onFinish, onDiscard, storageScope = 'local', restAlertSound = true, restAlertVibration = true, saveStatus = 'Saved on this device' }: Partial<WorkoutPreferences> & { saveStatus?: string; storageScope?: string; catalog?: ExerciseDefinition[]; programs: Program[]; sessions: WorkoutSession[]; lastSelectedProgramId: string | null; keepScreenAwake: boolean; onStart: (programId: string, workoutId: string) => void; onStartCustom?: (workout: WorkoutTemplate) => boolean | void; onChange: (session: WorkoutSession, newExercises?: ExerciseDefinition[]) => boolean | void; onFinish: (sessionId: string) => boolean | void; onDiscard: (sessionId: string) => boolean | void }) {
  const catalog = availableExercises(savedCatalog);
  const [custom, setCustom] = useState(false);
  const [finished, setFinished] = useState<{ id: string; scope: string } | null>(null);
  const active = sessions.find((session) => session.completedAt === null);
  if (active) return <ActiveWorkout restAlertSound={restAlertSound} restAlertVibration={restAlertVibration} catalog={catalog} history={sessions} storageScope={storageScope} session={active} keepScreenAwake={keepScreenAwake} onChange={onChange} onFinish={() => { const accepted = onFinish(active.id); if (accepted !== false) setFinished({ id: active.id, scope: storageScope }); return accepted; }} onDiscard={() => onDiscard(active.id)} />;
  const completed = finished?.scope === storageScope ? sessions.find(session => session.id === finished.id && session.completedAt !== null) : undefined;
  if (completed) return <WorkoutCompletion session={completed} saveStatus={saveStatus} onNext={() => { setFinished(null); setCustom(false); }} />;
  if (custom && onStartCustom) return <CustomWorkoutForm catalog={catalog} onStart={onStartCustom} onCancel={() => setCustom(false)} />;
  return <StartWorkoutDialog onCustomWorkout={onStartCustom ? () => setCustom(true) : undefined} programs={programs} catalog={catalog} initialProgramId={lastSelectedProgramId} onStart={onStart} />;
}

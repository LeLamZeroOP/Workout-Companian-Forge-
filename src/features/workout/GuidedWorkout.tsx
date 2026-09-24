import type { WorkoutSession } from '../../domain/models';
import { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { completeGuidedSet, extendRest, getRemainingRestSeconds, selectGuidedSet, skipRest } from '../../domain/guidedWorkout';
import { RestTimer } from './RestTimer';

export function GuidedWorkout({ session, onChange, onFinish, onDiscard, now = () => new Date().toISOString() }: { session: WorkoutSession; onChange: (session: WorkoutSession) => void; onFinish: () => void; onDiscard: () => void; now?: () => string }) {
  const [draft, setDraft] = useState(() => structuredClone(session));
  const [tick, setTick] = useState(now());
  const [soundEnabled, setSoundEnabled] = useState(true);
  useEffect(() => setDraft(structuredClone(session)), [session]);
  useEffect(() => { if (!draft.guide.restTimer) return; const timer = window.setInterval(() => setTick(now()), 1000); return () => window.clearInterval(timer); }, [draft.guide.restTimer, now]);
  const exerciseIndex = draft.exercises.findIndex((item) => item.id === draft.guide.currentExerciseId);
  const exercise = draft.exercises[exerciseIndex];
  const setIndex = exercise?.sets.findIndex((item) => item.id === draft.guide.currentSetId) ?? -1;
  const set = exercise?.sets[setIndex];
  const rest = draft.guide.restTimer;
  const remaining = rest ? getRemainingRestSeconds(rest, tick) : 0;
  useEffect(() => { if (rest && remaining === 0) { const updated = skipRest(draft); setDraft(updated); onChange(updated); } }, [remaining]); // eslint-disable-line react-hooks/exhaustive-deps
  const updateSet = (field: 'weightKg'|'reps', value: string) => { const next = structuredClone(draft); const target = next.exercises[exerciseIndex]?.sets[setIndex]; if (!target) return; target[field] = value === '' ? null : Number(value); setDraft(next); onChange(next); };
  const updateKind = (kind: 'working' | 'warmup') => { const next = structuredClone(draft); const target = next.exercises[exerciseIndex]?.sets[setIndex]; if (!target) return; target.kind = kind; setDraft(next); onChange(next); };
  const addSet = () => { const next = structuredClone(draft); const target = next.exercises[exerciseIndex]; if (!target) return; target.sets.push({ id: `set-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`, weightKg: null, reps: null, kind: 'working', completed: false }); setDraft(next); onChange(next); };
  const removeSet = () => { if (!exercise || exercise.sets.length <= 1) return; const next = structuredClone(draft); const target = next.exercises[exerciseIndex]!; target.sets.splice(setIndex, 1); const replacement = target.sets[Math.min(setIndex, target.sets.length - 1)]!; next.guide.currentSetId = replacement.id; setDraft(next); onChange(next); };
  const complete = () => { if (!set || set.weightKg === null || set.reps === null) return; const updated = completeGuidedSet(draft, exercise!.id, set.id, now()); setDraft(updated); onChange(updated); };

  if (rest) return <RestTimer remaining={remaining} soundEnabled={soundEnabled} onToggleSound={() => setSoundEnabled((value) => !value)} onExtend={() => { const updated = extendRest(draft, 30); setDraft(updated); onChange(updated); }} onSkip={() => { const updated = skipRest(draft); setDraft(updated); onChange(updated); }} />;
  if (!exercise || !set) return <section className="finish-panel"><p className="eyebrow">Session complete</p><h2>Every planned set is done.</h2><button className="primary-action" type="button" onClick={onFinish}>Finish workout</button></section>;
  return <div className="guided-layout"><section className="current-set"><div className="set-meta"><span>Exercise {exerciseIndex + 1} of {draft.exercises.length}</span><span>Set {setIndex + 1} of {exercise.sets.length}</span></div><h2>{exercise.exerciseName}</h2><p className="muted">Rest {exercise.restSeconds}s after this set</p><div className="set-tools"><label>Set type<select value={set.kind} onChange={(event) => updateKind(event.target.value as 'working' | 'warmup')}><option value="working">Working</option><option value="warmup">Warm-up</option></select></label><button className="text-action" type="button" onClick={addSet}><Plus size={15}/>Add set</button><button className="text-action danger-text" type="button" disabled={exercise.sets.length <= 1} onClick={removeSet}>Remove set</button></div><div className="set-inputs"><label>Weight in kilograms<input inputMode="decimal" type="number" min="0" value={set.weightKg ?? ''} onChange={(e) => updateSet('weightKg', e.target.value)}/></label><label>Repetitions<input inputMode="numeric" type="number" min="0" value={set.reps ?? ''} onChange={(e) => updateSet('reps', e.target.value)}/></label></div><button className="complete-button" type="button" disabled={set.weightKg === null || set.reps === null} onClick={complete}><Check size={20}/>Complete set</button></section>
    <aside className="exercise-queue"><div className="section-heading"><div><p className="eyebrow">Up next</p><h3>Workout order</h3></div></div>{draft.exercises.map((item, index) => { const isActive = item.id === exercise.id; return <button type="button" key={item.id} className={isActive ? 'queue-item active' : 'queue-item'} aria-current={isActive ? 'step' : undefined} onClick={() => { const target = item.sets.find((candidate) => !candidate.completed) ?? item.sets[0]; if (target) { const updated = selectGuidedSet(draft, item.id, target.id); setDraft(updated); onChange(updated); } }}><span>{index + 1}</span><div><strong>{item.exerciseName}</strong><small>{item.sets.filter((candidate) => candidate.completed).length}/{item.sets.length} sets</small></div></button>; })}<button className="danger-action" type="button" onClick={onDiscard}><Trash2 size={16}/>Discard workout</button></aside>
  </div>;
}

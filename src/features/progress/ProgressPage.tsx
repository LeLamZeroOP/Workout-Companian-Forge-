import { Dumbbell } from 'lucide-react';
import { SegmentedControl } from '../../components/SegmentedControl';
import { SelectControl } from '../../components/SelectControl';
import { useMemo, useState } from 'react';
import type { ExerciseDefinition, Program, WorkoutSession } from '../../domain/models';
import { DailyVolumeProgress } from './DailyVolumeProgress';
import { ExerciseProgress } from './ExerciseProgress';
import { MuscleSummaryPage } from '../muscles/MuscleSummaryPage';
import { countedSet } from '../../domain/trainingMetrics';
import { isCalendarDate } from '../../domain/calendar';

export function ProgressPage({ sessions, programs = [], exerciseCatalog = [], onOpenWorkout }: { sessions: WorkoutSession[]; programs?: Program[]; exerciseCatalog?: ExerciseDefinition[]; onOpenWorkout?: () => void }) {
  const [includeWarmups, setIncludeWarmups] = useState(false);
  const exercises = useMemo(() => {
    const values = new Map<string, string>();
    [...sessions].filter(session => session.completedAt).sort((a, b) => a.completedAt!.localeCompare(b.completedAt!)).forEach(session => session.exercises.forEach(exercise => {
      if (exercise.sets.some(set => countedSet(set, includeWarmups))) values.set(exercise.exerciseId, exercise.exerciseName);
    }));
    return [...values.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [sessions, includeWarmups]);
  const [section, setSection] = useState<'training' | 'muscles'>('training');
  const [view, setView] = useState<'exercise' | 'daily'>('exercise');
  const [exerciseId, setExerciseId] = useState(() => exercises[0]?.id ?? '');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const rangeValid = (!from || isCalendarDate(from)) && (!to || isCalendarDate(to)) && (!from || !to || from <= to);
  const filtered = sessions.filter(session => rangeValid && session.completedAt && (!from || new Date(`${from}T00:00:00`).getTime() <= new Date(session.completedAt).getTime()) && (!to || new Date(`${to}T23:59:59.999`).getTime() >= new Date(session.completedAt).getTime()));
  const selectedExerciseId = exercises.some(item => item.id === exerciseId) ? exerciseId : exercises[0]?.id ?? '';
  return (
    <section className="analytics-stack">
      {section === 'training' && <div className="analytics-filters"><label>From<input type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label><label>Through<input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label>{(from || to) && <button type="button" className="secondary-action" onClick={() => { setFrom(''); setTo(''); }}>Clear date filters</button>}{section === 'training' && <label className="checkbox-label"><input type="checkbox" checked={includeWarmups} onChange={event => setIncludeWarmups(event.target.checked)} />Include warm-up sets</label>}</div>}<p className="field-help">{includeWarmups && section === 'training' ? 'Completed working and warm-up sets' : 'Completed working sets only'} · valid recorded load and positive whole reps.</p><SegmentedControl className="progress-sections" label="Progress section" value={section} onChange={setSection} options={[{ value: 'training', label: 'Training' }, { value: 'muscles', label: 'Muscles' }]} />
      {section === 'muscles' ? <MuscleSummaryPage sessions={sessions} programs={programs} exercises={exerciseCatalog} /> : !rangeValid ? <p className="error-banner" role="alert">Choose valid dates with the start on or before the end.</p> : (from || to) && !filtered.length ? <div className="analytics-card empty-analytics"><p>No completed workouts match this date range.</p></div> : !exercises.length ? <section className="empty-stage"><p className="eyebrow">No progress yet</p><h2>Your training trends start here.</h2><p>Complete a workout with valid recorded sets to unlock exercise and volume charts.</p>{onOpenWorkout && <div className="form-actions"><button className="primary-action" type="button" onClick={onOpenWorkout}><Dumbbell size={18} aria-hidden="true" />Start a workout</button></div>}</section> : <><div className="analytics-toolbar">
        <SegmentedControl label="Progress view" value={view} onChange={setView} options={[{ value: 'exercise', label: 'Exercise' }, { value: 'daily', label: 'Daily volume' }]} />
        {view === 'exercise' && <SelectControl label="Exercise" searchable value={selectedExerciseId} onChange={setExerciseId} options={exercises.map(exercise => ({ value: exercise.id, label: exercise.name }))} />}
      </div>
      {view === 'exercise' ? <ExerciseProgress periodFiltered={Boolean(from || to)} sessions={filtered} exerciseId={selectedExerciseId} includeWarmups={includeWarmups} /> : <DailyVolumeProgress sessions={filtered} includeWarmups={includeWarmups} />}</>}
    </section>
  );
}

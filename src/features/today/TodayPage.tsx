import { useState } from 'react';
import { SelectControl } from '../../components/SelectControl';
import { TodayBalance } from './TodayBalance';
import { ProgressMeter } from '../../components/ProgressMeter';
import type { BodyMeasurement, ExerciseDefinition, FoodLogEntry, NutritionTarget, Program, WorkoutSession } from '../../domain/models';
import { ArrowRight, CalendarCheck, Check, ChevronRight, Dumbbell, Flame } from 'lucide-react';
import { entriesForDate } from '../../domain/foodDiary';
import { useCurrentDay } from '../../hooks/useCurrentDay';
import { localDateString } from '../../domain/calendar';
import { nextWorkoutInProgram, weeklyTrainingActivity } from '../../domain/trainingOverview';
import { validSetValues } from '../../domain/trainingMetrics';

export interface TodayPageProps {
  programs: Program[];
  lastSelectedProgramId?: string | null;
  exercises?: ExerciseDefinition[];
  onStart?: (programId: string, workoutId: string) => void;
  sessions: WorkoutSession[];
  onPrimaryAction: () => void;
  bodyMeasurements?: BodyMeasurement[];
  nutritionEntries?: FoodLogEntry[];
  nutritionTargets?: NutritionTarget[];
  onLogWeight?: () => void;
  onAddFood?: () => void;
  now?: Date;
}

export function TodayPage({ programs, lastSelectedProgramId, exercises = [], onStart, sessions, onPrimaryAction, bodyMeasurements = [], nutritionEntries = [], nutritionTargets = [], onLogWeight = () => undefined, onAddFood = () => undefined, now: fixedNow }: TodayPageProps) {
  const now = useCurrentDay(fixedNow);
  const [chosenProgram, setChosenProgram] = useState(lastSelectedProgramId ?? programs[0]?.id ?? '');
  const program = programs.find(item => item.id === chosenProgram) ?? programs[0];
  const [chosenWorkout, setChosenWorkout] = useState('');
  const suggestion = nextWorkoutInProgram(program, sessions, now);
  const workout = program?.workouts.find(item => item.id === chosenWorkout) ?? suggestion?.workout;
  const active = sessions.find((session) => session.completedAt === null);
  const completed = sessions.filter((session) => session.completedAt !== null);
  const latest = [...completed].filter(item => Date.parse(item.completedAt!) <= now.getTime()).sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!))[0];
  const activity = weeklyTrainingActivity(sessions, now);
  const weeklyCount = activity.reduce((total, day) => total + day.count, 0);
  const activeSets = active?.exercises.flatMap(item => item.sets) ?? [];
  const activeCompleted = activeSets.filter(set => set.completed && validSetValues(set)).length;
  const currentExercise = active?.exercises.find(item => item.id === active.guide.currentExerciseId);
  const currentSetIndex = currentExercise?.sets.findIndex(item => item.id === active?.guide.currentSetId) ?? -1;
  const isFirstUse = programs.length === 0;
  const actionLabel = active ? 'Resume workout' : isFirstUse ? 'Create first program' : 'Start workout';
  const localDate = localDateString(now);
  const todayEntries = entriesForDate(nutritionEntries, localDate);

  return (
    <div className="today-stack">
      <div className="today-layout">
      <section className="session-panel" aria-label="Next training action" data-state={active ? 'active' : isFirstUse ? 'first-use' : 'ready'}>
        <div className="session-card-label"><span><Dumbbell size={18} aria-hidden="true" />Training</span><span className="session-badge">{active ? 'In progress' : isFirstUse ? 'Set up' : 'Ready when you are'}</span></div>
        <div>
          <p className="eyebrow">{now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h2>{active ? `${active.workoutName} is in progress` : isFirstUse ? 'Build your first training plan.' : 'Your next session'}</h2>
          <p>{active ? `${active.programName} · Started ${new Date(active.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : isFirstUse ? 'Choose your exercises, sets and rest times. Then follow your plan, one set at a time.' : 'Your exercises, sets and rest are ready. Choose a workout to begin.'}</p>
        </div>
        {active && <div className="today-resume-preview"><div className="section-heading"><h3>{currentExercise?.exerciseName ?? (activeSets.length && activeCompleted === activeSets.length ? 'All planned sets completed' : 'Your saved session')}</h3>{currentSetIndex >= 0 && <span>Set {currentSetIndex + 1} of {currentExercise!.sets.length}</span>}</div><div className="session-progress"><ProgressMeter label="Active workout completion" value={activeCompleted} max={activeSets.length} /><span><strong>{activeCompleted}</strong> / {activeSets.length} sets done</span></div></div>}
        {!active && program && onStart && <div className="today-session-choice"><SelectControl label="Program" value={program.id} options={programs.map(item => ({ value: item.id, label: item.name }))} onChange={value => { setChosenProgram(value); setChosenWorkout(''); }} /><SelectControl label="Selected workout" value={workout?.id ?? ''} options={program.workouts.map(item => ({ value: item.id, label: item.name, description: `${item.exercises.length} ${item.exercises.length === 1 ? 'exercise' : 'exercises'}` }))} onChange={setChosenWorkout} />{!chosenWorkout && suggestion?.basedOn && <p className="next-workout-hint">Next in program order, after {suggestion.basedOn.workoutName}. You can choose any workout.</p>}</div>}
        <button className="primary-action" type="button" onClick={() => { if (!active && program && workout && onStart) onStart(program.id, workout.id); else onPrimaryAction(); }}>
          {actionLabel}<ArrowRight size={18} aria-hidden="true" />
        </button>
        {!active && workout && onStart && <details className="today-exercises">
          <summary><span><strong>Session preview</strong><small>{workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'} · {workout.exercises.reduce((count, item) => count + item.targetSets, 0)} planned sets</small></span><ChevronRight size={18} aria-hidden="true" /></summary>
          <ol className="today-preview">{workout.exercises.map(item => <li key={item.id}><span>{exercises.find(exercise => exercise.id === item.exerciseId)?.name ?? 'Exercise'}</span><small>{item.targetSets} × {item.targetRepMin}–{item.targetRepMax}</small></li>)}{!workout.exercises.length && <li>Add exercises to this workout in Programs.</li>}</ol>
        </details>}

      </section>

      <aside className="overview-panel" aria-label="Training overview">
        <div className="metrics-strip">
          <section className="stat-block"><span className="metric-icon"><Flame size={18} aria-hidden="true" /></span><p>Sessions this week</p><strong>{weeklyCount}</strong><span>{latest ? `Last on ${new Date(latest.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}` : 'None completed yet'}</span></section>
          <section className="stat-block"><span className="metric-icon"><CalendarCheck size={18} aria-hidden="true" /></span><p>Programs</p><strong>{programs.length}</strong><span>{programs.length > 1 ? `${programs[0]!.name} + ${programs.length - 1} more` : programs[0]?.name ?? 'None yet'}</span></section>
        </div>
        <section className="recent-card">
          <div className="section-heading"><h3>Latest workout</h3><Dumbbell size={20} aria-hidden="true" /></div>
          {latest ? <div className="recent-row"><div><strong>{latest.workoutName}</strong><span>{latest.programName}</span></div><time dateTime={latest.completedAt!}>{new Date(latest.completedAt!).toLocaleDateString([], { month: 'short', day: 'numeric' })}</time></div> : <p className="muted">Completed workouts will appear here.</p>}
        </section>
      </aside>
    </div>
      <section className="activity-band" aria-label="Weekly activity">
        <div className="activity-band-copy"><span className="activity-symbol"><Flame size={24} aria-hidden="true" /></span><div><p className="eyebrow">Completed workouts</p><h2>Your week in motion</h2><p>{weeklyCount} {weeklyCount === 1 ? 'session' : 'sessions'} · {activity.filter(day => day.count > 0).length} active {activity.filter(day => day.count > 0).length === 1 ? 'day' : 'days'} this week</p></div></div>
        <ol className="activity-days" aria-label="Workouts this week">{activity.map(day => <li key={day.date} className={`${day.isToday ? 'is-today ' : ''}${day.count ? 'has-workout' : ''}`}><span aria-hidden="true">{day.day.toLocaleDateString([], { weekday: 'short' })}</span><div aria-hidden="true">{day.count ? <Check size={18} strokeWidth={2.6} /> : day.day.getDate()}</div><span className="sr-only">{day.day.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}: {day.count} completed {day.count === 1 ? 'session' : 'sessions'}{day.isToday ? ', today' : ''}</span></li>)}</ol>
      </section>
<div className="section-heading daily-heading"><h2>Your daily balance</h2><span>Body &amp; nutrition</span></div><TodayBalance measurements={bodyMeasurements} entries={todayEntries} targets={nutritionTargets} date={localDate} onLogWeight={onLogWeight} onAddFood={onAddFood} />
    </div>
  );
}

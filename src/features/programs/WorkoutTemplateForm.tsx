import type { ExerciseDefinition, WorkoutTemplate } from '../../domain/models';

export function WorkoutTemplateForm({ workout, exerciseCatalog, onChange }: { workout: WorkoutTemplate; exerciseCatalog: ExerciseDefinition[]; onChange: (workout: WorkoutTemplate) => void }) {
  return <div className="field"><label htmlFor={`workout-name-${workout.id}`}>Workout name</label><input id={`workout-name-${workout.id}`} value={workout.name} onChange={(event) => onChange({ ...workout, name: event.target.value })} /><small>{workout.exercises.length} exercises · {exerciseCatalog.length} available</small></div>;
}

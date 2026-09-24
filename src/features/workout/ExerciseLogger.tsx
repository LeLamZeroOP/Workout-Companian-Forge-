import type { WorkoutExercise } from '../../domain/models';
import { SetRow } from './SetRow';

export function ExerciseLogger({ exercise, onChange }: { exercise: WorkoutExercise; onChange: (exercise: WorkoutExercise) => void }) {
  return <section className="exercise-logger"><h3>{exercise.exerciseName}</h3>{exercise.sets.map((set, index) => <SetRow key={set.id} set={set} setNumber={index + 1} onChange={(nextSet) => onChange({ ...exercise, sets: exercise.sets.map((item) => item.id === nextSet.id ? nextSet : item) })} />)}</section>;
}

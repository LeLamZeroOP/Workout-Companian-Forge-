import { localDateString } from './calendar';
import type { Program, WorkoutSession } from './models';

export function weeklyTrainingActivity(sessions: WorkoutSession[], now: Date) {
  const start = new Date(now);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  const counts = new Map<string, number>();
  for (const session of sessions) {
    if (!session.completedAt) continue;
    const time = new Date(session.completedAt);
    if (time.getTime() < start.getTime() || time.getTime() > now.getTime()) continue;
    const date = localDateString(time);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start); day.setDate(start.getDate() + index);
    const date = localDateString(day);
    return { day, date, count: counts.get(date) ?? 0, isToday: date === localDateString(now) };
  });
}

/** A suggestion in template order, independent of any calendar schedule. */
export function nextWorkoutInProgram(program: Program | undefined, sessions: WorkoutSession[], now: Date) {
  if (!program?.workouts.length) return undefined;
  const latest = sessions.filter(session => session.programId === program.id && session.completedAt && Date.parse(session.completedAt) <= now.getTime())
    .sort((a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!))[0];
  const index = program.workouts.findIndex(workout => workout.id === latest?.workoutTemplateId);
  return { workout: program.workouts[(index + 1) % program.workouts.length]!, basedOn: index >= 0 ? latest : undefined };
}

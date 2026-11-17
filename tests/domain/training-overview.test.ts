import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { nextWorkoutInProgram, weeklyTrainingActivity } from '../../src/domain/trainingOverview';

const data = createDefaultData();
const program = data.programs[0]!;
const now = new Date(2026, 9, 8, 12);
function finished(workoutIndex: number, time: Date) {
  const session = createSession(program, program.workouts[workoutIndex]!, data.exercises, time.toISOString());
  session.completedAt = time.toISOString(); return session;
}

it('shows Monday through Sunday with local completion counts and excludes future and active sessions', () => {
  const monday = finished(0, new Date(2026, 9, 5, 10));
  const thursday = finished(1, new Date(2026, 9, 8, 10));
  const earlier = finished(0, new Date(2026, 9, 4, 23));
  const future = finished(0, new Date(2026, 9, 8, 13));
  const active = { ...thursday, completedAt: null };
  const days = weeklyTrainingActivity([monday, thursday, thursday, earlier, future, active], now);
  expect(days.map(day => day.date)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
  expect(days.map(day => day.count)).toEqual([1, 0, 0, 2, 0, 0, 0]);
  expect(days.filter(day => day.isToday).map(day => day.date)).toEqual(['2026-10-08']);
});

it('suggests the next workout in template order and wraps after the last workout', () => {
  expect(nextWorkoutInProgram(program, [finished(0, now)], now)?.workout.id).toBe('starter-pull');
  expect(nextWorkoutInProgram(program, [finished(2, now)], now)?.workout.id).toBe('starter-push');
});

it('defaults to the first workout without matching history and ignores future and other-program results', () => {
  const other = { ...finished(2, now), programId: 'other' };
  const deleted = { ...finished(1, now), workoutTemplateId: 'deleted' };
  const future = finished(2, new Date(2026, 9, 8, 13));
  expect(nextWorkoutInProgram(program, [other, future], now)?.workout.id).toBe('starter-push');
  expect(nextWorkoutInProgram(program, [deleted], now)?.basedOn).toBeUndefined();
  expect(nextWorkoutInProgram({ ...program, workouts: [] }, [], now)).toBeUndefined();
});

it('selects the latest actual instant when completion timestamps use different timezone offsets', () => {
  const older = finished(0, now); older.completedAt = '2026-10-08T15:00:00+07:00';
  const latest = finished(1, now); latest.completedAt = '2026-10-08T09:00:00Z';
  expect(nextWorkoutInProgram(program, [older, latest], new Date('2026-10-08T10:00:00Z'))?.workout.id).toBe('starter-legs');
});

import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { previousPerformance } from '../../src/domain/previousPerformance';

function fixture() {
  const data = createDefaultData();
  const program = data.programs[0]!;
  const active = createSession(program, program.workouts[0]!, data.exercises, '2026-10-08T10:00:00Z');
  const previous = structuredClone(active);
  previous.id = 'previous'; previous.startedAt = '2026-10-07T10:00:00Z'; previous.completedAt = '2026-10-07T11:00:00Z';
  previous.exercises[0]!.sets[0] = { ...previous.exercises[0]!.sets[0]!, completed: true, weightKg: 30, reps: 10 };
  return { active, previous };
}

it('matches the same occurrence of a repeated exercise and skips unmatched sessions', () => {
  const { active, previous } = fixture();
  active.exercises.push({ ...structuredClone(active.exercises[0]!), id: 'second-active' });
  const second = active.exercises[1]!;
  expect(previousPerformance(active, second, [previous])).toBeUndefined();
  const older = structuredClone(previous); older.id = 'older'; older.completedAt = '2026-10-06T11:00:00Z';
  older.exercises.push({ ...structuredClone(older.exercises[0]!), id: 'second-previous' });
  older.exercises[1]!.sets[0]!.weightKg = 20;
  expect(previousPerformance(active, second, [older, previous], 'working')?.exercise.sets[0]!.weightKg).toBe(20);
});

it('falls back to older valid working results when the latest session only has warmups', () => {
  const { active, previous } = fixture();
  const warmup = structuredClone(previous); warmup.id = 'warmup'; warmup.completedAt = '2026-10-08T09:00:00Z'; warmup.exercises[0]!.sets[0]!.kind = 'warmup';
  expect(previousPerformance(active, active.exercises[0], [previous, warmup], 'working')?.session.id).toBe('previous');
  expect(previousPerformance(active, active.exercises[0], [previous, warmup], 'warmup')?.session.id).toBe('warmup');
});

it('compares actual instants across timezone offsets and excludes future results', () => {
  const { active, previous } = fixture();
  previous.completedAt = '2026-10-08T15:00:00+07:00'; // 08:00 UTC
  const latest = structuredClone(previous); latest.id = 'latest'; latest.completedAt = '2026-10-08T09:00:00Z';
  const future = structuredClone(previous); future.id = 'future'; future.completedAt = '2026-10-08T12:00:00Z';
  expect(previousPerformance(active, active.exercises[0], [previous, future, latest])?.session.id).toBe('latest');
});

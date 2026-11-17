import { calculateSessionVolume, createSession, validateProgram } from '../../src/domain/workout';
import type { ExerciseDefinition, Program, WorkoutSession } from '../../src/domain/models';

const exercises: ExerciseDefinition[] = [
  {
    id: 'db-press',
    name: 'Dumbbell Chest Press',
    equipment: 'dumbbell',
    muscleContribution: { chest: 1, triceps: 0.5, frontDelts: 0.5 },
    isCustom: false,
  },
];

const program: Program = {
  id: 'push-pull',
  name: 'Push / Pull',
  notes: '',
  createdAt: '2026-09-23T08:00:00.000Z',
  updatedAt: '2026-09-23T08:00:00.000Z',
  workouts: [{
    id: 'push',
    name: 'Push',
    notes: '',
    exercises: [{
      id: 'push-press',
      exerciseId: 'db-press',
      targetSets: 2,
      targetRepMin: 8,
      targetRepMax: 12,
      restSeconds: 90,
      notes: '',
    }],
  }],
};

describe('workout domain', () => {
  it('creates a session that snapshots ordered exercise details', () => {
    const session = createSession(program, program.workouts[0]!, exercises, '2026-09-23T10:00:00.000Z');

    expect(session.programName).toBe('Push / Pull');
    expect(session.workoutName).toBe('Push');
    expect(session.exercises[0]).toMatchObject({
      exerciseName: 'Dumbbell Chest Press',
      targetRepMin: 8, targetRepMax: 12,
      restSeconds: 90,
      muscleContribution: { chest: 1, triceps: 0.5, frontDelts: 0.5 },
    });
    expect(session.exercises[0]?.sets).toHaveLength(2);
    expect(session.guide.currentExerciseId).toBe(session.exercises[0]?.id);
    expect(session.guide.currentSetId).toBe(session.exercises[0]?.sets[0]?.id);
  });

  it('copies workout notes into the session without keeping a template reference', () => {
    const workout = { ...program.workouts[0]!, notes: 'Keep this session easy.' };
    const session = createSession(program, workout, exercises, '2026-09-23T10:00:00.000Z');
    workout.notes = 'A later template edit';
    expect(session.notes).toBe('Keep this session easy.');
  });

  it('counts working-set volume by default with an explicit warm-up option', () => {
    const session = createSession(program, program.workouts[0]!, exercises, '2026-09-23T10:00:00.000Z');
    session.exercises[0]!.sets = [
      { id: 'a', weightKg: 30, reps: 10, kind: 'working', completed: true },
      { id: 'b', weightKg: 25, reps: 8, kind: 'warmup', completed: true },
      { id: 'c', weightKg: 40, reps: 6, kind: 'working', completed: false },
    ];

    expect(calculateSessionVolume(session)).toBe(300);
    expect(calculateSessionVolume(session, true)).toBe(500);
  });

  it('validates program names, workout contents, ranges, and contributions', () => {
    const invalid: Program = {
      ...program,
      name: ' ',
      workouts: [{
        ...program.workouts[0]!,
        name: '',
        exercises: [{
          ...program.workouts[0]!.exercises[0]!,
          targetSets: 0,
          targetRepMin: 12,
          targetRepMax: 8,
          restSeconds: 700,
        }],
      }],
    };

    const errors = validateProgram(invalid, exercises);
    expect(errors).toMatchObject({
      name: expect.any(String),
      'workouts.0.name': expect.any(String),
      'workouts.0.exercises.0.targetSets': expect.any(String),
      'workouts.0.exercises.0.targetRepRange': expect.any(String),
      'workouts.0.exercises.0.restSeconds': expect.any(String),
    });
  });

  it('returns zero volume for a session without valid completed values', () => {
    const empty = { exercises: [] } as unknown as WorkoutSession;
    expect(calculateSessionVolume(empty)).toBe(0);
  });
});

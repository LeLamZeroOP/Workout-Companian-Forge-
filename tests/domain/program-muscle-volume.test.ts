import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { compareMuscleTarget, normalizeVolume, summarizeProgramVolume } from '../../src/domain/programMuscleVolume';
import { readFileSync } from 'node:fs';
import { parseAppData } from '../../src/data/migrations';

describe('program muscle volume', () => {
  it('counts repeated cycle slots independently and excludes rest days', () => {
    const data = createDefaultData();
    const program = structuredClone(data.programs[0]!);
    const workout = program.workouts[0]!;
    program.workouts = [workout];
    workout.exercises = [workout.exercises[0]!];
    workout.exercises[0]!.targetSets = 3;
    const exercise = structuredClone(data.exercises.find(item => item.id === workout.exercises[0]!.exerciseId)!);
    exercise.muscleContribution = { chest: 1, triceps: 0.5 };
    exercise.muscleRoles = { direct: ['chest'], indirect: ['triceps'], reviewedAt: '2026-09-27', source: 'forge-reviewed' };
    program.volumePlan = { goal: 'hypertrophy', targets: [], cycle: { slots: [workout.id, null, workout.id, null] } };
    const summary = summarizeProgramVolume(program, [exercise]);
    expect(summary.performedSets).toBe(6);
    expect(summary.workouts).toHaveLength(2);
    expect(summary.rows.find(row => row.muscle === 'triceps')).toMatchObject({ directSets: 0, indirectSets: 6, weightedSets: 3, directSessions: 0 });
    expect(summary.rows.find(row => row.muscle === 'chest')).toMatchObject({ directSets: 6, directSessions: 2 });
    expect(normalizeVolume(summary)?.performedSets).toBe(10.5);
  });

  it('leaves direct counts unknown when a definition has no reviewed roles', () => {
    const data = createDefaultData();
    delete data.exercises[0]!.muscleRoles;
    const summary = summarizeProgramVolume(data.programs[0]!, data.exercises);
    expect(summary.periodDays).toBeNull();
    expect(normalizeVolume(summary)).toBeNull();
    expect(summary.rows.find(row => row.muscle === 'chest')?.directSets).toBeNull();
    expect(summary.unknownExerciseIds.length).toBeGreaterThan(0);
  });

  it('compares unrounded values at inclusive boundaries', () => {
    const target = { muscle: 'chest' as const, lower: 10, upper: 12, basis: 'direct' as const, period: 'cycle' as const, priority: 'focus' as const };
    expect(compareMuscleTarget(10, target)).toBe('within');
    expect(compareMuscleTarget(12, target)).toBe('within');
    expect(compareMuscleTarget(9.9999, target)).toBe('below');
    expect(compareMuscleTarget(12.0001, target)).toBe('above');
    expect(compareMuscleTarget(null, target)).toBe('unknown');
    expect(compareMuscleTarget(10, undefined)).toBe('no-target');
  });

  it('accounts for the unchanged imported four-day rotation', () => {
    const fixture = parseAppData(JSON.parse(readFileSync('imports/upper-a-lower-upper-b.forge.json', 'utf8')));
    const program = structuredClone(fixture.programs[0]!);
    expect(program.workouts).toHaveLength(3);
    program.volumePlan = { goal: 'custom', targets: [], cycle: { slots: [program.workouts[0]!.id, program.workouts[1]!.id, program.workouts[2]!.id, null] } };
    const summary = summarizeProgramVolume(program, fixture.exercises);
    expect(summary.performedSets).toBe(52);
    expect(summary.periodDays).toBe(4);
    expect(summary.rows.find(row => row.muscle === 'chest')?.weightedSets).toBe(7);
    expect(normalizeVolume(summary)?.performedSets).toBe(91);
    expect(normalizeVolume(summary)?.rows.find(row => row.muscle === 'chest')?.weightedSets).toBe(12.25);
    expect(summary.rows.find(row => row.muscle === 'chest')?.directSets).toBeNull();
  });
});

import { createDefaultData } from '../../src/data/defaults';
import { validateAppData } from '../../src/data/validateAppData';
import { buildProgramExport, programExportFileName } from '../../src/domain/programExport';
import { buildMergePlan, selectableRows } from '../../src/domain/selectiveMerge';
import type { ExerciseDefinition, Program } from '../../src/domain/models';

const custom: ExerciseDefinition = { id: 'custom-landmine-press', name: 'Landmine Press', equipment: 'barbell', isCustom: true, muscleContribution: { frontDelts: 1, chest: 0.5 } };

function fixture() {
  const data = createDefaultData();
  data.exercises = [custom, { ...custom, id: 'custom-unused', name: 'Unused movement' }];
  const program: Program = structuredClone(data.programs[0]!);
  program.workouts[0]!.exercises.push({ id: 'entry-custom', exerciseId: custom.id, targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: 'Half-kneeling.' });
  program.volumePlan = { goal: 'hypertrophy', cycle: { slots: [program.workouts[0]!.id, null, program.workouts[1]!.id] }, targets: [] };
  data.programs = [program, { ...structuredClone(program), id: 'another-program', name: 'Another program' }];
  return { data, program };
}

describe('exporting a workout split', () => {
  it('produces a valid Forge document with only this program and the exercises it uses', () => {
    const { data, program } = fixture();
    const exported = buildProgramExport(program, data.exercises);
    expect(() => validateAppData(exported)).not.toThrow();
    expect(exported.version).toBe(4);
    expect(exported.programs).toEqual([program]);
    expect(exported.exercises.map(e => e.id).sort()).toEqual(['custom-landmine-press', 'db-chest-press', 'lat-pulldown', 'leg-press']);
    expect(exported.exercises.find(e => e.id === custom.id)).toEqual(custom);
    expect(exported.sessions).toEqual([]);
    expect(exported.body).toEqual({ profile: null, measurements: [] });
    expect(exported.nutrition).toEqual({ targets: [], customFoods: [], diary: [] });
    expect(exported.mergeLedger).toBeUndefined();
  });

  it('survives a JSON round trip and does not share objects with the saved program', () => {
    const { data, program } = fixture();
    const exported = buildProgramExport(program, data.exercises);
    expect(validateAppData(JSON.parse(JSON.stringify(exported))).programs[0]).toEqual(program);
    exported.programs[0]!.workouts[0]!.name = 'Changed in the file';
    exported.exercises.find(e => e.id === custom.id)!.name = 'Changed in the file';
    expect(program.workouts[0]!.name).toBe('Push');
    expect(custom.name).toBe('Landmine Press');
  });

  it('can be added to another account through selective merge with its custom exercise', () => {
    const { data, program } = fixture();
    const exported = buildProgramExport(program, data.exercises);
    const account = createDefaultData();
    account.programs = [];
    expect(selectableRows(exported).map(row => row.key)).toEqual(expect.arrayContaining([`programs:${program.id}`, `exercises:${custom.id}`]));
    const plan = buildMergePlan(exported, account, { keys: [`programs:${program.id}`], choices: {} }, 'operation-1');
    expect(plan.data.programs.map(item => item.name)).toEqual([program.name]);
    expect(plan.data.exercises.some(item => item.name === 'Landmine Press')).toBe(true);
    expect(() => validateAppData(plan.data)).not.toThrow();
  });

  it('refuses to export a program that references a missing exercise', () => {
    const { data, program } = fixture();
    expect(() => buildProgramExport(program, data.exercises.filter(e => e.id !== custom.id))).toThrow(/no longer in your library/);
  });

  it('names the file after the program and date', () => {
    const { program } = fixture();
    expect(programExportFileName({ ...program, name: '  Upper / Lower — 4 Day!  ' }, '2026-11-17')).toBe('forge-split-upper-lower-4-day-2026-11-17.forge.json');
    expect(programExportFileName({ ...program, name: 'Đẩy Kéo' }, '2026-11-17')).toMatch(/^forge-split-[a-z0-9-]+-2026-11-17\.forge\.json$/);
    expect(programExportFileName({ ...program, name: '日本語' }, '2026-11-17')).toBe('forge-split-program-2026-11-17.forge.json');
  });
});

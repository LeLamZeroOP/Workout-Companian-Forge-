import type { Program, WorkoutTemplate } from '../domain/models';

export interface TrainingTemplate {
  id: string; name: string; creator: string; source: string; days: number; level: string; summary: string; schedule: string; workouts: WorkoutTemplate[];
  cycleSlots: Array<string | null>;
}
type Prescription = [id: string, sets: number, min: number, max: number, rest: number];
function workout(name: string, lifts: Prescription[]): WorkoutTemplate {
  return { id: name, name, notes: 'Working sets shown; warm up before your first working set. Start with a load that leaves about 2–3 repetitions in reserve. When all sets reach the top of the range with controlled form, increase the load by the smallest practical step.', exercises: lifts.map(([exerciseId, targetSets, targetRepMin, targetRepMax, restSeconds], index) => ({ id: `${name}-${index}`, exerciseId, targetSets, targetRepMin, targetRepMax, restSeconds, notes: exerciseId === 'bulgarian-split-squat' || exerciseId === 'db-row' ? 'Repetitions per side.' : exerciseId === 'push-up' || exerciseId === 'pull-up' || exerciseId === 'hanging-knee-raise' ? 'Log added external weight only; use 0 kg for bodyweight.' : '' })) };
}
const push = workout('Push', [['bench-press',3,6,10,180],['incline-db-press',2,8,12,120],['lateral-raise',3,12,20,60],['triceps-pushdown',2,10,15,90]]);
const pull = workout('Pull', [['lat-pulldown',3,8,12,120],['chest-supported-row',3,8,12,120],['reverse-pec-deck',2,12,20,60],['db-curl',2,10,15,90]]);
const legs = workout('Legs', [['squat',3,6,10,180],['rdl',2,8,12,180],['seated-leg-curl',2,10,15,90],['calf-raise',3,10,15,90]]);
const upperA = workout('Upper A', [['bench-press',3,6,10,180],['seated-cable-row',3,8,12,120],['lat-pulldown',2,10,15,120],['lateral-raise',2,12,20,60],['triceps-pushdown',2,10,15,90]]);
const lowerA = workout('Lower A', [['squat',3,6,10,180],['rdl',3,8,12,180],['leg-extension',2,10,15,90],['calf-raise',3,10,15,90],['cable-crunch',2,10,15,60]]);
const upperB = workout('Upper B', [['incline-db-press',3,8,12,120],['lat-pulldown',3,8,12,120],['db-shoulder-press',2,8,12,120],['reverse-pec-deck',2,12,20,60],['db-curl',2,10,15,90]]);
const lowerB = workout('Lower B', [['leg-press',3,10,15,180],['seated-leg-curl',3,10,15,90],['bulgarian-split-squat',2,8,12,120],['calf-raise',3,10,15,90],['cable-crunch',2,10,15,60]]);
const ethierSource = 'https://builtwithscience.com/fitness-tips/best-workout-split-2025/';
export const trainingTemplates: TrainingTemplate[] = [
  { id: 'full-body', name: 'Full Body Foundation', creator: 'Renaissance Periodization', source: 'https://rpstrength.com/blogs/articles/many-days-train-per-week', days: 3, level: 'Beginner', summary: 'Practice the main movement patterns with recovery days between sessions.', schedule: 'Mon A · Wed B · Fri C', workouts: [
    workout('Full Body A', [['goblet-squat',2,8,12,120],['db-chest-press',2,8,12,120],['seated-cable-row',2,8,12,120],['seated-leg-curl',2,10,15,90],['cable-crunch',2,10,15,60]]),
    workout('Full Body B', [['db-rdl',2,8,12,120],['lat-pulldown',2,8,12,120],['db-shoulder-press',2,8,12,120],['leg-press',2,10,15,120],['calf-raise',2,10,15,90]]),
    workout('Full Body C', [['leg-press',2,10,15,120],['incline-db-press',2,8,12,120],['chest-supported-row',2,8,12,120],['seated-leg-curl',2,10,15,90],['lateral-raise',2,12,20,60]])
  ], cycleSlots: ['Full Body A', null, 'Full Body B', null, 'Full Body C', null, null] },
  { id: 'upper-lower', name: 'Upper / Lower', creator: 'Jeremy Ethier · Built With Science', source: ethierSource, days: 4, level: 'Intermediate', summary: 'Two upper and two lower sessions, with distinct A and B workouts.', schedule: 'Mon Upper A · Tue Lower A · Thu Upper B · Fri Lower B', workouts: [upperA, lowerA, upperB, lowerB], cycleSlots: [upperA.id, lowerA.id, null, upperB.id, lowerB.id, null, null] },
  { id: 'ppl', name: 'Push / Pull / Legs', creator: 'Jeff Nippard', source: 'https://www.youtube.com/watch?v=qVek72z3F1U', days: 6, level: 'Experienced', summary: 'A repeating push, pull and legs rotation for a six-session week.', schedule: 'Mon Push · Tue Pull · Wed Legs · Thu Push · Fri Pull · Sat Legs · Sun rest', workouts: [push, pull, legs], cycleSlots: [push.id, pull.id, legs.id, push.id, pull.id, legs.id, null] },
  { id: 'hybrid', name: 'Upper / Lower + PPL', creator: 'Jeremy Ethier · Built With Science', source: ethierSource, days: 5, level: 'Experienced', summary: 'Combine an upper/lower pair with focused push, pull and legs sessions.', schedule: 'Mon Upper · Tue Lower · Wed rest · Thu Push · Fri Pull · Sat Legs · Sun rest', workouts: [upperA, lowerB, push, pull, legs], cycleSlots: [upperA.id, lowerB.id, null, push.id, pull.id, legs.id, null] },
];

export function createTemplateProgram(template: TrainingTemplate): Program {
  const now = new Date().toISOString();
  const workoutIds = new Map(template.workouts.map(day => [day.id, `workout-${crypto.randomUUID()}`]));
  return { id: `program-${crypto.randomUUID()}`, name: template.name, createdAt: now, updatedAt: now,
    notes: `Forge adaptation inspired by public split guidance from ${template.creator}. Original exercise choices and prescriptions; not an official or endorsed creator program. ${template.schedule}. Source: ${template.source}`,
    workouts: template.workouts.map(day => ({ ...structuredClone(day), id: workoutIds.get(day.id)!, exercises: day.exercises.map(exercise => ({ ...exercise, id: `template-exercise-${crypto.randomUUID()}` })) })),
    volumePlan: { goal: 'hypertrophy', targets: [], cycle: { slots: template.cycleSlots.map(id => id === null ? null : workoutIds.get(id)!) } } };
}

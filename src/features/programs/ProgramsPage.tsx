import { OverlayPresence } from '../../components/OverlayPresence';
import { ExerciseTechnique } from '../../components/ExerciseTechnique';
import { TrainingLibrary } from './TrainingLibrary';
import { availableExercises } from '../../domain/exerciseCatalog';
import { muscleLabels } from '../../domain/muscleSets';
import { useState } from 'react';
import { Copy, Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { buildProgramExport, programExportFileName } from '../../domain/programExport';
import { localDateString } from '../../domain/calendar';
import { validateAppData } from '../../data/validateAppData';
import { downloadJson } from '../settings/backups';
import type { ExerciseDefinition, MuscleGroup, Program } from '../../domain/models';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ActionMenu } from '../../components/ActionMenu';
import { ProgramForm } from './ProgramForm';
import { ExerciseContributionForm } from './ExerciseContributionForm';
import { canonical } from '../../domain/canonical';

function uid(prefix: string) { return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`; }
function createProgram(exerciseId: string): Program { const now = new Date().toISOString(); return { id: uid('program'), name: 'New program', notes: '', createdAt: now, updatedAt: now, workouts: [{ id: uid('workout'), name: 'Workout A', notes: '', exercises: [{ id: uid('template-exercise'), exerciseId, targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' }] }] }; }

export function ProgramsPage({ programs, exerciseCatalog: savedExercises, onSave, onDelete, onSaveExercise }: { programs: Program[]; exerciseCatalog: ExerciseDefinition[]; onSave: (program: Program) => boolean | void; onDelete: (programId: string) => boolean | void; onSaveExercise: (exercise: ExerciseDefinition) => boolean | void }) {
  const exerciseCatalog = availableExercises(savedExercises);
  const [editing, setEditing] = useState<Program | null>(null);
  const [programBase, setProgramBase] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<ExerciseDefinition | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);
  const [query, setQuery] = useState('');
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [equipment, setEquipment] = useState('all');
  const [chestEmphasis, setChestEmphasis] = useState('all');
  const [catalogWindow, setCatalogWindow] = useState({ filters: '', limit: 24 });
  function exportProgram(program: Program) {
    try {
      // Validate first so a downloaded file is always one Forge can read back.
      downloadJson(programExportFileName(program, localDateString(new Date())), validateAppData(buildProgramExport(program, savedExercises)));
      toast.success(`${program.name} exported`);
    } catch (reason) {
      toast.error(reason instanceof Error && reason.message.startsWith('This program') ? reason.message : 'The split could not be exported. Please retry.');
    }
  }
  function openProgram(program: Program) {
    setProgramBase(programs.some(item => item.id === program.id) ? canonical(program) : null);
    setEditing(structuredClone(program));
  }
  const savedProgram = editing ? programs.find(item => item.id === editing.id) : undefined;
  const programConflict = programBase !== null && canonical(savedProgram ?? null) !== programBase;
  const savedExercise = editingExercise ? exerciseCatalog.find(item => item.id === editingExercise.id) : undefined;
  const exerciseConflict = editingExercise !== null && savedExercise !== undefined && canonical(savedExercise) !== canonical(editingExercise);
  if (editing) return <section><div className="section-heading"><div><p className="eyebrow">Program editor</p><h2>{programBase === null ? 'Create program' : 'Edit program'}</h2></div></div>{programConflict && <div className="error-banner" role="alert">{savedProgram ? 'This program changed elsewhere.' : 'This program was deleted elsewhere.'} Your draft is still open. {savedProgram && <button className="secondary-action" type="button" onClick={() => openProgram(savedProgram)}>Load saved program</button>}</div>}<ProgramForm key={programBase ?? editing.id} isNew={programBase === null} saveDisabled={programConflict} initialValue={editing} exerciseCatalog={exerciseCatalog} onSave={(program) => { if (!programConflict && onSave(program) !== false) setEditing(null); }} onCancel={() => setEditing(null)} /></section>;
  if (editingExercise) return <section><div className="section-heading"><div><p className="eyebrow">Exercise editor</p><h2>{editingExercise.name || 'New exercise'}</h2></div></div>{exerciseConflict && <div className="error-banner" role="alert">This exercise changed elsewhere. Your draft is still open. <button className="secondary-action" type="button" onClick={() => setEditingExercise(structuredClone(savedExercise!))}>Load saved exercise</button></div>}<ExerciseContributionForm key={canonical(editingExercise)} saveDisabled={exerciseConflict} exercise={editingExercise} onSave={(exercise) => { if (!exerciseConflict && onSaveExercise(exercise) !== false) setEditingExercise(null); }} onCancel={() => setEditingExercise(null)} /></section>;
  const filtered = programs.filter((program) => program.name.toLowerCase().includes(query.trim().toLowerCase()));
  const exerciseTerms = exerciseQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matchingExercises = exerciseCatalog.filter(exercise => {
    const muscles = Object.keys(exercise.muscleContribution) as MuscleGroup[];
    const searchable = [exercise.name, exercise.equipment, ...muscles, ...muscles.map(muscle => muscleLabels[muscle]), ...(exercise.aliases ?? []), exercise.chestEmphasis ?? ''].join(' ').toLowerCase();
    return (equipment === 'all' || exercise.equipment === equipment)
      && (chestEmphasis === 'all' || (exercise.muscleContribution.chest && (exercise.chestEmphasis ?? 'unspecified') === chestEmphasis))
      && exerciseTerms.every(term => searchable.includes(term));
  });
  const filterKey = JSON.stringify([exerciseTerms, equipment, chestEmphasis]);
  const visibleLimit = catalogWindow.filters === filterKey ? catalogWindow.limit : 24;
  const visibleExercises = matchingExercises.slice(0, visibleLimit);
  return <section className="programs-page">
    <div className="toolbar"><label className="search-field">Search programs<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="primary-action" type="button" onClick={() => openProgram(createProgram(exerciseCatalog[0]!.id))}><Plus size={18} />Create program</button></div>
    {filtered.length === 0 ? <div className="empty-stage compact"><p className="eyebrow">No programs found</p><h2>{programs.length ? 'Try another search.' : 'Create your first training program.'}</h2></div> : <div className="program-card-grid">{filtered.map((program) => <article className="program-card" key={program.id}><div><p className="eyebrow">{program.workouts.length} workouts</p><h2>{program.name}</h2><p className="muted">{program.notes || program.workouts.map((item) => item.name).join(', ')}</p></div><div className="card-actions"><button className="secondary-action" type="button" onClick={() => openProgram(program)}><Pencil size={16}/>Edit</button><button className="icon-button" aria-label={`Duplicate ${program.name}`} type="button" onClick={() => { const copy = structuredClone(program); copy.id = uid('program'); copy.name = `${copy.name.trim().slice(0, 55)} copy`; copy.createdAt = new Date().toISOString(); copy.updatedAt = copy.createdAt; const ids = new Map(copy.workouts.map(workout => [workout.id, uid('workout')])); copy.workouts.forEach(workout => { workout.id = ids.get(workout.id)!; workout.exercises.forEach(exercise => { exercise.id = uid('template-exercise'); }); }); if (copy.volumePlan?.cycle) copy.volumePlan.cycle.slots = copy.volumePlan.cycle.slots.map(slot => slot === null ? null : ids.get(slot)!); onSave(copy); }}><Copy size={17}/></button><button className="icon-button" aria-label={`Export ${program.name}`} title="Export this split as a Forge file" type="button" onClick={() => exportProgram(program)}><Download size={17}/></button><ActionMenu label={`More actions for ${program.name}`} items={[{ label: `Delete ${program.name}`, tone: 'danger', icon: <Trash2 size={16} aria-hidden="true" />, onSelect: () => setDeleting(program) }]} /></div></article>)}</div>}
    <TrainingLibrary exercises={exerciseCatalog} onChoose={openProgram} />
    <section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">Exercise library</p><h2>Common exercises &amp; your own</h2></div><button className="secondary-action" type="button" onClick={() => setEditingExercise({ id: uid('exercise'), name: '', equipment: 'other', muscleContribution: {}, isCustom: true })}><Plus size={16}/>New exercise</button></div><p className="muted">{exerciseCatalog.length} exercises. Muscle contributions are editable estimates for tracking effective sets.</p><label className="search-field">Search exercises<input type="search" placeholder="Name or muscle group" value={exerciseQuery} onChange={event => setExerciseQuery(event.target.value)} /></label><div className="food-filters" aria-label="Exercise equipment">{['all','barbell','dumbbell','machine','cable','bodyweight','band','other'].map(item => <button key={item} type="button" aria-pressed={equipment === item} onClick={() => setEquipment(item)}>{item === 'all' ? 'All equipment' : item}</button>)}</div><div className="food-filters" aria-label="Chest emphasis">{['all','upper','mid','mixed','unspecified'].map(item => <button key={item} type="button" aria-pressed={chestEmphasis === item} onClick={() => setChestEmphasis(item)}>{item === 'all' ? 'All chest emphasis' : item === 'unspecified' ? 'Unspecified chest' : `${item[0]!.toUpperCase() + item.slice(1)} chest`}</button>)}</div><p className="field-help" role="status">{matchingExercises.length} matching {matchingExercises.length === 1 ? 'exercise' : 'exercises'}</p>{matchingExercises.length === 0 && <div className="empty-stage compact"><p>No exercises match these filters.</p><button type="button" className="secondary-action" onClick={() => { setExerciseQuery(''); setEquipment('all'); setChestEmphasis('all'); }}>Clear exercise filters</button></div>}<div className="catalog-list">{visibleExercises.map((exercise) => <div className="catalog-row" key={exercise.id}><button className="catalog-exercise-edit" type="button" onClick={() => setEditingExercise(structuredClone(exercise))}><strong>{exercise.name}<small className="exercise-equipment">{exercise.equipment}</small></strong><span>{Object.entries(exercise.muscleContribution).map(([muscle, value]) => `${muscleLabels[muscle as MuscleGroup]} ${value}`).join(', ')}</span></button><ExerciseTechnique exerciseId={exercise.id} exerciseName={exercise.name} isCustom={exercise.isCustom} /></div>)}</div>{visibleExercises.length < matchingExercises.length && <div className="catalog-more"><p className="field-help">Showing {visibleExercises.length} of {matchingExercises.length} exercises</p><button className="secondary-action" type="button" onClick={() => setCatalogWindow({ filters: filterKey, limit: visibleLimit + 24 })}>Show more exercises</button></div>}</section>
    <OverlayPresence>{deleting && <ConfirmDialog title={`Delete ${deleting.name}?`} message="Completed workout history will remain unchanged." confirmLabel="Delete program" onCancel={() => setDeleting(null)} onConfirm={() => { if (onDelete(deleting.id) !== false) setDeleting(null); }} />}</OverlayPresence>
  </section>;
}

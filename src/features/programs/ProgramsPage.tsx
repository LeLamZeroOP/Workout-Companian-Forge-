import { useState } from 'react';
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import type { ExerciseDefinition, Program } from '../../domain/models';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ProgramForm } from './ProgramForm';
import { ExerciseContributionForm } from './ExerciseContributionForm';

function uid(prefix: string) { return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`; }
function createProgram(exerciseId: string): Program { const now = new Date().toISOString(); return { id: uid('program'), name: 'New program', notes: '', createdAt: now, updatedAt: now, workouts: [{ id: uid('workout'), name: 'Workout A', notes: '', exercises: [{ id: uid('template-exercise'), exerciseId, targetSets: 3, targetRepMin: 8, targetRepMax: 12, restSeconds: 90, notes: '' }] }] }; }

export function ProgramsPage({ programs, exerciseCatalog, onSave, onDelete, onSaveExercise }: { programs: Program[]; exerciseCatalog: ExerciseDefinition[]; onSave: (program: Program) => void; onDelete: (programId: string) => void; onSaveExercise: (exercise: ExerciseDefinition) => void }) {
  const [editing, setEditing] = useState<Program | null>(null);
  const [editingExercise, setEditingExercise] = useState<ExerciseDefinition | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);
  const [query, setQuery] = useState('');
  if (editing) return <section><div className="section-heading"><div><p className="eyebrow">Program editor</p><h2>{programs.some((item) => item.id === editing.id) ? 'Edit program' : 'Create program'}</h2></div></div><ProgramForm initialValue={editing} exerciseCatalog={exerciseCatalog} onSave={(program) => { onSave(program); setEditing(null); }} onCancel={() => setEditing(null)} /></section>;
  if (editingExercise) return <section><div className="section-heading"><div><p className="eyebrow">Muscle mapping</p><h2>{editingExercise.name || 'New exercise'}</h2></div></div><ExerciseContributionForm exercise={editingExercise} onSave={(exercise) => { onSaveExercise(exercise); setEditingExercise(null); }} onCancel={() => setEditingExercise(null)} /></section>;
  const filtered = programs.filter((program) => program.name.toLowerCase().includes(query.toLowerCase()));
  return <section className="programs-page">
    <div className="toolbar"><label className="search-field">Search programs<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label><button className="primary-action" type="button" onClick={() => setEditing(createProgram(exerciseCatalog[0]!.id))}><Plus size={18} />Create program</button></div>
    {filtered.length === 0 ? <div className="empty-stage compact"><p className="eyebrow">No programs found</p><h2>{programs.length ? 'Try another search.' : 'Create your first training program.'}</h2></div> : <div className="program-card-grid">{filtered.map((program) => <article className="program-card" key={program.id}><div><p className="eyebrow">{program.workouts.length} workouts</p><h2>{program.name}</h2><p className="muted">{program.notes || program.workouts.map((item) => item.name).join(' · ')}</p></div><div className="card-actions"><button className="secondary-action" type="button" onClick={() => setEditing(structuredClone(program))}><Pencil size={16}/>Edit</button><button className="icon-button" aria-label={`Duplicate ${program.name}`} type="button" onClick={() => { const copy = structuredClone(program); copy.id = uid('program'); copy.name = `${copy.name} copy`; copy.createdAt = new Date().toISOString(); copy.updatedAt = copy.createdAt; onSave(copy); }}><Copy size={17}/></button><button className="icon-button danger-icon" aria-label={`Delete ${program.name}`} type="button" onClick={() => setDeleting(program)}><Trash2 size={17}/></button></div></article>)}</div>}
    <section className="catalog-section"><div className="section-heading"><div><p className="eyebrow">Exercise library</p><h2>Muscle contributions</h2></div><button className="secondary-action" type="button" onClick={() => setEditingExercise({ id: uid('exercise'), name: '', equipment: 'other', muscleContribution: {}, isCustom: true })}><Plus size={16}/>New exercise</button></div><div className="catalog-list">{exerciseCatalog.map((exercise) => <button type="button" key={exercise.id} onClick={() => setEditingExercise(structuredClone(exercise))}><strong>{exercise.name}</strong><span>{Object.entries(exercise.muscleContribution).map(([muscle, value]) => `${muscle} ${value}`).join(' · ')}</span></button>)}</div></section>
    {deleting && <ConfirmDialog title={`Delete ${deleting.name}?`} message="Completed workout history will remain unchanged." confirmLabel="Delete program" onCancel={() => setDeleting(null)} onConfirm={() => { onDelete(deleting.id); setDeleting(null); }} />}
  </section>;
}

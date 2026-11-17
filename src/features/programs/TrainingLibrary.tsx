import { useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import type { ExerciseDefinition, Program } from '../../domain/models';
import { createTemplateProgram, trainingTemplates } from '../../data/trainingTemplates';
import { ProgramMuscleSummary } from './ProgramMuscleSummary';
import { normalizeVolume, summarizeProgramVolume } from '../../domain/programMuscleVolume';
import { muscleGroups, muscleLabels } from '../../domain/muscleSets';

export function TrainingLibrary({ exercises, onChoose }: { exercises: ExerciseDefinition[]; onChoose: (program: Program) => void }) {
  const [days, setDays] = useState(0);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareNotice, setCompareNotice] = useState('');
  const [openSummaries, setOpenSummaries] = useState<string[]>([]);
  const selected = compareIds.map(id => trainingTemplates.find(template => template.id === id)!).filter(Boolean);
  const comparisons = selected.map(template => normalizeVolume(summarizeProgramVolume({ id: template.id, name: template.name, notes: '', createdAt: '', updatedAt: '', workouts: template.workouts, volumePlan: { goal: 'custom', targets: [], cycle: { slots: template.cycleSlots } } }, exercises))!);
  return <section className="training-library" aria-label="Training split library">
    <div className="section-heading"><div><p className="eyebrow">Find your rhythm</p><h2>Start with a split</h2></div><span className="library-count">4 templates</span></div>
    <p className="muted">Editable Forge templates inspired by public creator guidance. Exercise choices, sets and reps are Forge defaults; these are not official or endorsed programs.</p>
    <div className="food-filters" aria-label="Training days">{[0,3,4,5,6].map(count => <button type="button" key={count} aria-pressed={days === count} onClick={() => setDays(count)}>{count ? `${count} days / week` : 'All schedules'}</button>)}</div>
    {selected.length > 0 && <section className="analytics-card"><div className="section-heading"><h3>Compare splits</h3><button type="button" className="text-action" onClick={() => { setCompareIds([]); setCompareNotice(''); }}>Clear comparison</button></div><p className="field-help">Average per 7 days if each schedule repeats as written. Performed sets are counted once per exercise; weighted muscle rows can overlap.</p><div className="table-scroll"><table className="data-table"><caption>Split comparison, weighted contributions per 7 days</caption><thead><tr><th scope="col">Muscle</th>{selected.map(template => <th key={template.id} scope="col">{template.name}</th>)}</tr></thead><tbody>{muscleGroups.map(muscle => <tr key={muscle}><th scope="row">{muscleLabels[muscle]}</th>{comparisons.map((summary, index) => <td key={selected[index]!.id}>{summary.missingDefinitionIds.length ? 'Partial' : summary.rows.find(row => row.muscle === muscle)!.weightedSets.toFixed(1)}</td>)}</tr>)}</tbody></table></div></section>}
    {compareNotice && <p role="status">{compareNotice}</p>}
    <div className="split-grid">{trainingTemplates.filter(template => !days || days === template.days).map(template => <article className="split-card" key={template.id}>
      <div className="split-meta"><span>{template.days} days / week</span><span>{template.level}</span></div><h3>{template.name}</h3><p className="split-creator">Inspired by {template.creator}</p><p>{template.summary}</p><p className="split-schedule">{template.schedule}</p><small>Equipment: gym machines, cables and free weights</small>
      <details><summary>Preview {template.workouts.length} workouts</summary>{template.workouts.map(day => <div className="split-day" key={day.id}><h4>{day.name}</h4><ul>{day.exercises.map(exercise => <li key={exercise.id}><span>{exercises.find(item => item.id === exercise.exerciseId)?.name ?? exercise.exerciseId}</span><strong>{exercise.targetSets} × {exercise.targetRepMin}–{exercise.targetRepMax}</strong><small>{exercise.restSeconds}s rest</small></li>)}</ul></div>)}</details>
      <details onToggle={event => { const open = event.currentTarget.open; setOpenSummaries(current => open ? current.includes(template.id) ? current : [...current, template.id] : current.filter(id => id !== template.id)); }}><summary>Muscle sets</summary>{openSummaries.includes(template.id) && <ProgramMuscleSummary program={{ id: template.id, name: template.name, notes: '', createdAt: '', updatedAt: '', workouts: template.workouts, volumePlan: { goal: 'custom', targets: [], cycle: { slots: template.cycleSlots } } }} exercises={exercises} />}</details>
      <div className="split-actions"><button className="primary-action" type="button" onClick={() => onChoose(createTemplateProgram(template))}><Plus size={16} />Customize {template.name}</button><button type="button" className="secondary-action" aria-pressed={compareIds.includes(template.id)} onClick={() => { if (compareIds.includes(template.id)) { setCompareIds(compareIds.filter(id => id !== template.id)); setCompareNotice(''); } else if (compareIds.length >= 2) setCompareNotice('Compare two splits at a time.'); else { setCompareIds([...compareIds, template.id]); setCompareNotice(''); } }}>Compare</button><a href={template.source} target="_blank" rel="noreferrer">Public source <ArrowUpRight size={14} aria-hidden="true" /></a></div>
    </article>)}</div>
  </section>;
}

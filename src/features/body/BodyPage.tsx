import { useState } from 'react';
import { Pencil, Plus, Scale, Trash2 } from 'lucide-react';
import type { BodyMeasurement, BodyProfile } from '../../domain/models';
import { getLatestMeasurement, getWeightChange } from '../../domain/bodyMeasurements';
import { calculateMacroGrams, estimateNutritionTarget } from '../../domain/energyEstimate';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MeasurementForm } from './MeasurementForm';
import { BodyProfileForm } from './BodyProfileForm';
import { WeightTrendChart } from './WeightTrendChart';

export interface BodyPageProps {
  profile: BodyProfile | null;
  measurements: BodyMeasurement[];
  onSaveProfile: (profile: BodyProfile) => void;
  onSaveMeasurement: (entry: BodyMeasurement) => void;
  onDeleteMeasurement: (id: string) => void;
  now?: Date;
}

function ageOnDate(birthDate: string, now: Date): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function BodyPage({ profile, measurements, onSaveProfile, onSaveMeasurement, onDeleteMeasurement, now = new Date() }: BodyPageProps) {
  const [mode, setMode] = useState<'summary' | 'measurement' | 'profile'>('summary');
  const [editing, setEditing] = useState<BodyMeasurement | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const latest = getLatestMeasurement(measurements);
  const change = getWeightChange(measurements);
  const sorted = [...measurements].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  const estimate = profile?.targetMode === 'calculated' && latest ? estimateNutritionTarget({ age: ageOnDate(profile.birthDate, now), weightKg: latest.weightKg, heightCm: profile.heightCm, equationSex: profile.equationSex, activityLevel: profile.activityLevel, goal: profile.goal, eligibleAdult: true }) : null;
  const macros = estimate?.status === 'estimated' ? calculateMacroGrams(estimate.midpointKcal, { protein: 25, carbs: 45, fat: 30 }) : null;

  if (mode === 'measurement') return <MeasurementForm initial={editing} now={now} onSave={(entry) => { onSaveMeasurement(entry); setEditing(undefined); setMode('summary'); }} onCancel={() => { setEditing(undefined); setMode('summary'); }} />;
  if (mode === 'profile') return <BodyProfileForm initial={profile} onSave={(value) => { onSaveProfile(value); setMode('summary'); }} onCancel={() => setMode('summary')} />;

  return <section className="analytics-stack body-page">
    {!latest ? <section className="empty-stage body-empty"><p className="eyebrow">Body tracking</p><h2>Start with today's weight.</h2><p>Build a private trend over time, then add a profile if you want calorie and macro estimates.</p><div className="form-actions"><button className="primary-action" type="button" onClick={() => setMode('measurement')}><Scale size={18} aria-hidden="true" />Log weight</button><button className="secondary-action" type="button" onClick={() => setMode('profile')}>Set up profile</button></div></section> : <>
      <div className="body-overview-grid">
        <section className="body-weight-card"><div className="section-heading"><div><p className="eyebrow">Latest weight</p><h2>{latest.weightKg} kg</h2></div><Scale size={22} aria-hidden="true" /></div><p className="muted">{change === null ? 'Add another entry to see change.' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg from previous entry`}</p><button className="primary-action" type="button" onClick={() => setMode('measurement')}><Plus size={17} aria-hidden="true" />Log measurement</button></section>
        <section className="body-target-card"><div className="section-heading"><div><p className="eyebrow">Nutrition estimate</p><h2>{estimate?.status === 'estimated' ? `${estimate.targetLowKcal.toLocaleString()} to ${estimate.targetHighKcal.toLocaleString()} kcal` : 'Profile needed'}</h2></div></div>{estimate?.status === 'estimated' && macros ? <><p>Estimated daily target range</p><div className="macro-inline"><span><strong>{macros.proteinG} g</strong>Protein</span><span><strong>{macros.carbsG} g</strong>Carbs</span><span><strong>{macros.fatG} g</strong>Fat</span></div><p className="estimate-note">Estimate based on Mifflin-St Jeor inputs. Adjust manually if needed.</p></> : <p className="muted">Set up your profile to see an optional estimate, or choose manual targets.</p>}<button className="secondary-action" type="button" onClick={() => setMode('profile')}>{profile ? 'Edit profile' : 'Set up profile'}</button></section>
      </div>
      <section className="analytics-card"><div className="section-heading"><div><p className="eyebrow">Trend</p><h2>Body weight</h2></div></div><WeightTrendChart measurements={measurements} /></section>
      <section className="analytics-card body-history"><div className="section-heading"><div><p className="eyebrow">All entries</p><h2>Measurement history</h2></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Date</th><th scope="col">Weight</th><th scope="col">Body fat</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{sorted.map((entry) => <tr key={entry.id}><td>{new Date(entry.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td><td>{entry.weightKg} kg</td><td>{entry.bodyFatPercent === null ? 'Not logged' : `${entry.bodyFatPercent}%`}</td><td><div className="row-actions"><button className="icon-button" type="button" aria-label="Edit measurement" onClick={() => { setEditing(entry); setMode('measurement'); }}><Pencil size={16} aria-hidden="true" /></button><button className="icon-button danger-icon" type="button" aria-label="Delete measurement" onClick={() => setDeleteId(entry.id)}><Trash2 size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div></section>
    </>}
    {deleteId && <ConfirmDialog title="Delete this measurement?" message="This body entry will be permanently removed from your local history." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={() => { onDeleteMeasurement(deleteId); setDeleteId(null); }} />}
  </section>;
}

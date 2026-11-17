import { OverlayPresence } from '../../components/OverlayPresence';
import { canonical } from '../../domain/canonical';
import { useState } from 'react';
import { Plus, Scale } from 'lucide-react';
import type { BodyMeasurement, BodyProfile, NutritionTarget } from '../../domain/models';
import { getLatestMeasurement, getWeightChange, nextMeasurementOrder, sortMeasurements } from '../../domain/bodyMeasurements';
import { calculateMacroGrams, estimateNutritionTarget } from '../../domain/energyEstimate';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MeasurementForm } from './MeasurementForm';
import { BodyProfileForm } from './BodyProfileForm';
import { WeightTrendChart } from './WeightTrendChart';
import { MeasurementHistory } from './MeasurementHistory';

export interface BodyPageProps {
  profile: BodyProfile | null;
  measurements: BodyMeasurement[];
  onSaveProfile: (profile: BodyProfile) => boolean | void;
  onSaveMeasurement: (entry: BodyMeasurement) => boolean | void;
  onDeleteMeasurement: (id: string) => boolean | void;
  onSaveNutritionTarget?: (target: NutritionTarget) => boolean | void;
  now?: Date;
}

function ageOnDate(birthDate: string, now: Date): number {
  const birth = new Date(`${birthDate}T00:00:00`);
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function BodyPage({ profile, measurements, onSaveProfile, onSaveMeasurement, onDeleteMeasurement, onSaveNutritionTarget, now = new Date() }: BodyPageProps) {
  const [mode, setMode] = useState<'summary' | 'measurement' | 'profile'>('summary');
  const [editing, setEditing] = useState<BodyMeasurement | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const latest = getLatestMeasurement(measurements);
  const change = getWeightChange(measurements);
  const sorted = sortMeasurements(measurements);
  const estimate = profile?.targetMode === 'calculated' && latest ? estimateNutritionTarget({ age: ageOnDate(profile.birthDate, now), weightKg: latest.weightKg, heightCm: profile.heightCm, equationSex: profile.equationSex, activityLevel: profile.activityLevel, goal: profile.goal, eligibleAdult: profile.estimateEligibilityConfirmed === true }) : null;
  const macros = estimate?.status === 'estimated' ? calculateMacroGrams(estimate.midpointKcal, { protein: 25, carbs: 45, fat: 30 }) : null;

  const measurementConflict = editing !== undefined && canonical(measurements.find(item => item.id === editing.id) ?? null) !== canonical(editing);
  if (mode === 'measurement') return <>{measurementConflict && <p className="error-banner" role="alert">This measurement changed elsewhere. Your draft is still open. Cancel and reopen it before editing.</p>}<MeasurementForm saveDisabled={measurementConflict} initial={editing} now={now} entryOrder={editing ? editing.entryOrder ?? measurements.findIndex((entry) => entry.id === editing.id) : nextMeasurementOrder(measurements)} onSave={(entry) => { if (measurementConflict) return; if (onSaveMeasurement(entry) === false) return; setEditing(undefined); setMode('summary'); }} onCancel={() => { setEditing(undefined); setMode('summary'); }} /></>;
  if (mode === 'profile') return <BodyProfileForm initial={profile} onSave={(value) => { if (onSaveProfile(value) === false) return; setMode('summary'); }} onCancel={() => setMode('summary')} />;

  function useEstimate() {
    if (estimate?.status !== 'estimated' || !macros || !onSaveNutritionTarget) return;
    const effectiveFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onSaveNutritionTarget({ id: crypto.randomUUID(), effectiveFrom, mode: 'calculated', caloriesKcal: estimate.midpointKcal, proteinG: macros.proteinG, carbsG: macros.carbsG, fatG: macros.fatG, formulaVersion: estimate.formulaVersion });
  }

  return <section className="analytics-stack body-page">
    {!latest ? <section className="empty-stage body-empty"><p className="eyebrow">Body tracking</p><h2>Start with today's weight.</h2><p>Build a private trend over time, then add a profile if you want calorie and macro estimates.</p><div className="form-actions"><button className="primary-action" type="button" onClick={() => setMode('measurement')}><Scale size={18} aria-hidden="true" />Log weight</button><button className="secondary-action" type="button" onClick={() => setMode('profile')}>Set up profile</button></div></section> : <>
      <div className="body-overview-grid">
        <section className="body-weight-card"><div className="section-heading"><div><p className="eyebrow">Latest weight</p><h2>{latest.weightKg} kg</h2></div><Scale size={22} aria-hidden="true" /></div><p className="muted">{change === null ? 'Add another entry to see change.' : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg from previous entry`}</p><button className="primary-action" type="button" onClick={() => setMode('measurement')}><Plus size={17} aria-hidden="true" />Log measurement</button></section>
        <section className="body-target-card"><div className="section-heading"><div><p className="eyebrow">Nutrition estimate</p><h2>{estimate?.status === 'estimated' ? `${estimate.targetLowKcal.toLocaleString()} to ${estimate.targetHighKcal.toLocaleString()} kcal` : 'Profile needed'}</h2></div></div>{estimate?.status === 'estimated' && macros ? <><p>Estimated daily target range</p><div className="macro-inline"><span><strong>{macros.proteinG} g</strong>Protein</span><span><strong>{macros.carbsG} g</strong>Carbs</span><span><strong>{macros.fatG} g</strong>Fat</span></div><p className="estimate-note">Estimate based on Mifflin-St Jeor, your latest weight, profile activity and goal. Macro split: 25% protein, 45% carbs, 30% fat. Applying this target is optional.</p></> : <p className="muted">Review your profile and confirm eligibility to see an optional estimate, or choose manual targets.</p>}<div className="form-actions">{estimate?.status === 'estimated' && onSaveNutritionTarget && <button className="primary-action" type="button" onClick={useEstimate}>Use this target</button>}<button className="secondary-action" type="button" onClick={() => setMode('profile')}>{profile ? 'Edit profile' : 'Set up profile'}</button></div></section>
      </div>
      <section className="analytics-card"><div className="section-heading"><div><p className="eyebrow">Trend</p><h2>Body weight</h2></div></div><WeightTrendChart measurements={measurements} /></section>
      <MeasurementHistory entries={sorted} onEdit={entry => { setEditing(entry); setMode('measurement'); }} onDelete={setDeleteId} />
    </>}
    <OverlayPresence>{deleteId && <ConfirmDialog title="Delete this measurement?" message="This body entry will be permanently removed from your local history." confirmLabel="Delete" onCancel={() => setDeleteId(null)} onConfirm={() => { if (onDeleteMeasurement(deleteId) !== false) setDeleteId(null); }} />}</OverlayPresence>
  </section>;
}

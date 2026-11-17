import { OverlayPresence } from '../../components/OverlayPresence';
import { useRef, useState, type ChangeEvent } from 'react';
import { Database, Download, RotateCcw, ShieldCheck, Upload } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { parseAppData } from '../../data/migrations';
import type { DataResetScope } from '../../data/localStorageRepository';
import type { AppDataV2 } from '../../domain/models';
import { downloadJson, readBackup } from './backups';
import { localDateString } from '../../domain/calendar';

interface DataManagementProps {
  data: AppDataV2;
  onImport: (data: AppDataV2) => boolean | void;
  onReset: (scope: DataResetScope) => boolean | void;
}

const resetOptions: Array<{ scope: DataResetScope; label: string; description: string; confirmLabel: string }> = [
  { scope: 'workouts', label: 'Workout data', description: 'Programs, custom exercises, and workout history.', confirmLabel: 'Reset workouts' },
  { scope: 'body', label: 'Body data', description: 'Your body profile, weight, and measurements.', confirmLabel: 'Reset body' },
  { scope: 'nutrition', label: 'Nutrition data', description: 'Targets, custom foods, and diary entries.', confirmLabel: 'Reset nutrition' },
  { scope: 'all', label: 'All local data', description: 'All local Forge records, library edits, import metadata, and workout preferences.', confirmLabel: 'Reset everything' },
];

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : pluralLabel}`;
}

export function DataManagement({ data, onImport, onReset }: DataManagementProps) {
  const [preview, setPreview] = useState<AppDataV2 | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmImport, setConfirmImport] = useState(false);
  const [reading, setReading] = useState(false);
  const [previewName, setPreviewName] = useState('');
  const readingRef = useRef(false);
  const [resetScope, setResetScope] = useState<DataResetScope | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function downloadBackup() {
    try {
      downloadJson(`forge-backup-${localDateString(new Date())}.json`, data);
      setExportError(null);
    } catch { setExportError('Could not download your backup. Please retry.'); }
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || readingRef.current) return;
    event.target.value = '';
    readingRef.current = true; setReading(true); setConfirmImport(false); setPreviewName(''); setNotice('');
    setPreview(null);
    setImportError(null);
    try {
      const parsed = parseAppData(JSON.parse(await readBackup(file)));
      setPreview(parsed);
      setPreviewName(file.name);
    } catch (reason) {
      setImportError(reason instanceof Error ? reason.message : 'This backup could not be validated.');
    } finally {
      readingRef.current = false; setReading(false);
    }
  }

  const resetOption = resetOptions.find((option) => option.scope === resetScope);

  return <div className="settings-page">
    <section className="data-hero" aria-labelledby="data-heading">
      <div className="data-hero-icon" aria-hidden="true"><ShieldCheck size={22} /></div>
      <div><p className="eyebrow">Private by default</p><h2 id="data-heading">Your data</h2><p>Forge stores your workouts, body records, and nutrition diary only in this browser. Keep a backup before clearing browser storage or moving devices.</p></div>
    </section>
    {notice && <p role="status">{notice}</p>}

    <div className="data-management-grid">
      <section className="data-card">
        <div className="data-card-heading"><span className="metric-icon"><Download size={18} /></span><div><h3>Export a backup</h3><p>Download one readable JSON file containing every Forge record.</p></div></div>
        <div className="data-counts" aria-label="Current data summary">
          <span><strong>{data.sessions.length}</strong> sessions</span>
          <span><strong>{data.body.measurements.length}</strong> body entries</span>
          <span><strong>{data.nutrition.diary.length}</strong> diary entries</span>
        </div>
        <button className="primary-action" type="button" onClick={downloadBackup}><Download size={16} />Download backup</button>
        {exportError && <p className="field-error" role="alert">{exportError}</p>}
      </section>

      <section className="data-card">
        <div className="data-card-heading"><span className="metric-icon"><Upload size={18} /></span><div><h3>Import a backup</h3><p>The file is checked and summarized before anything is replaced.</p></div></div>
        <label className="import-file">Choose backup file<input ref={fileRef} type="file" disabled={reading} accept="application/json,.json" onChange={chooseBackup} /></label>
        {reading && <p role="status">Reading backup…</p>}
        {importError && <p className="error-banner compact" role="alert">{importError}</p>}
        {preview && <div className="import-preview">
          <div><p className="eyebrow">Validated backup</p><h3>Review import</h3></div>
          <p className="saved-notes">{previewName}</p>
          <div className="preview-counts">
            <span>{plural(preview.programs.length, 'program')}</span>
            <span>{plural(preview.sessions.length, 'workout session')}</span>
            <span>{plural(preview.body.measurements.length, 'body entry', 'body entries')}</span>
            <span>{plural(preview.nutrition.diary.length, 'diary entry', 'diary entries')}</span>
            <span>{plural(preview.nutrition.customFoods.length, 'custom food')}</span>
          </div>
          <button className="secondary-action" type="button" onClick={() => setConfirmImport(true)}>Replace my data</button>
        </div>}
      </section>
    </div>

    <section className="reset-section" aria-labelledby="reset-heading">
      <div className="section-heading"><div><p className="eyebrow">Destructive actions</p><h2 id="reset-heading">Reset by category</h2></div><Database size={20} aria-hidden="true" /></div>
      <p className="muted">Choose exactly what to remove. Other categories stay untouched.</p>
      <div className="reset-grid">{resetOptions.map((option) => <div className={option.scope === 'all' ? 'reset-row reset-all' : 'reset-row'} key={option.scope}><div><strong>{option.label}</strong><span>{option.description}</span></div><button className="danger-action" type="button" onClick={() => setResetScope(option.scope)}><RotateCcw size={15} />Reset {option.scope === 'all' ? 'all data' : option.scope === 'workouts' ? 'workout data' : `${option.scope} data`}</button></div>)}</div>
    </section>

    <OverlayPresence>{confirmImport && preview && <ConfirmDialog title="Replace all local data?" message="This will replace every current Forge record with the validated backup. Export the current data first if you may need it later." confirmLabel="Replace data" onCancel={() => setConfirmImport(false)} onConfirm={() => { if (onImport(preview) === false) return; setPreview(null); setConfirmImport(false); setNotice('Your backup was restored.'); }} />}</OverlayPresence>
    <OverlayPresence>{resetScope && resetOption && <ConfirmDialog title={`Reset ${resetOption.label.toLowerCase()}?`} message={`${resetOption.description} This cannot be undone unless you have a backup.`} confirmLabel={resetOption.confirmLabel} onCancel={() => setResetScope(null)} onConfirm={() => { if (onReset(resetScope) !== false) { setResetScope(null); setNotice(resetScope === 'all' ? 'Your data was reset.' : `${resetOption.label} was reset.`); } }} />}</OverlayPresence>
  </div>;
}

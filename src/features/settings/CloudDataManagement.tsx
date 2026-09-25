import { useState, type ChangeEvent } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { parseAppData } from '../../data/migrations';
import type { OfflineAccountState } from '../../data/offlineStore';
import type { AppDataV2 } from '../../domain/models';

interface CloudDataManagementProps {
  data: AppDataV2;
  pendingCount: number;
  onSignOut: () => void;
  onImport: (data: AppDataV2) => Promise<void>;
  onGetDeviceBackup: () => Promise<OfflineAccountState>;
}

function downloadJson(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsText(file);
  });
}

export function CloudDataManagement({ data, pendingCount, onSignOut, onImport, onGetDeviceBackup }: CloudDataManagementProps) {
  const [preview, setPreview] = useState<AppDataV2 | null>(null);
  const [source, setSource] = useState<'legacy' | 'file' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLegacy = typeof localStorage !== 'undefined' && localStorage.getItem('workout-tracker:data') !== null;

  function reviewLegacy() {
    try {
      const raw = localStorage.getItem('workout-tracker:data');
      if (!raw) return;
      setPreview(parseAppData(JSON.parse(raw)));
      setSource('legacy');
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Local data could not be read.'); }
  }

  async function reviewFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setPreview(parseAppData(JSON.parse(await readFile(file))));
      setSource('file');
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Backup could not be validated.'); }
    event.target.value = '';
  }

  async function exportCloud() {
    try {
      const state = await onGetDeviceBackup();
      downloadJson(`forge-cloud-${new Date().toISOString().slice(0, 10)}.json`, state.snapshot.data);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Export failed.'); }
  }

  async function exportPending() {
    try {
      const state = await onGetDeviceBackup();
      downloadJson(`forge-pending-${new Date().toISOString().slice(0, 10)}.json`, { userId: state.userId, snapshotRevision: state.snapshot.revision, pending: state.pending });
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Export failed.'); }
  }

  async function confirmImport() {
    if (!preview) return;
    setBusy(true);
    try {
      await onImport(preview);
      setPreview(null);
      setConfirm(false);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Import failed.'); setConfirm(false); }
    finally { setBusy(false); }
  }

  return <div className="settings-page cloud-settings">
    <section className="data-hero"><div><p className="eyebrow">Private account</p><h2>Your cloud data</h2><p>Your signed-in account is the shared copy across devices. Export backups regularly, especially before an import.</p></div></section>
    {error && <p className="error-banner" role="alert">{error}</p>}
    <div className="data-management-grid">
      <section className="data-card"><h3>Back up your account</h3><p>Download the last cloud-acknowledged version of your workouts, body log, and meals.</p><div className="data-counts"><span><strong>{data.sessions.length}</strong> sessions</span><span><strong>{data.body.measurements.length}</strong> body entries</span><span><strong>{data.nutrition.diary.length}</strong> meals</span></div><button type="button" className="primary-action" onClick={() => void exportCloud()}>Download cloud backup</button>{pendingCount > 0 && <button type="button" className="secondary-action" onClick={() => void exportPending()}>Export {pendingCount} pending changes</button>}</section>
      <section className="data-card"><h3>Move an existing copy here</h3><p>Choose one browser copy or JSON backup as the canonical version. It replaces the cloud copy; records are not merged.</p>{hasLegacy && <button type="button" className="secondary-action" onClick={reviewLegacy}>Review local data</button>}<label className="import-file">Choose JSON backup<input type="file" accept="application/json,.json" onChange={(event) => void reviewFile(event)} /></label>{preview && <div className="import-preview"><p className="eyebrow">{source === 'legacy' ? 'Local browser copy' : 'JSON backup'}</p><p>{preview.programs.length} programs · {preview.sessions.length} sessions · {preview.body.measurements.length} body entries · {preview.nutrition.diary.length} meals</p><button type="button" className="danger-action" disabled={busy || pendingCount > 0} onClick={() => setConfirm(true)}>Replace cloud data</button>{pendingCount > 0 && <p>Sync or export pending changes first.</p>}</div>}</section>
    </div>
    <section className="data-card cloud-account"><h3>Account</h3><p>Sign out only after pending changes have synced or been exported.</p><button type="button" className="secondary-action" disabled={pendingCount > 0} onClick={onSignOut}>Sign out</button></section>
    {confirm && preview && <ConfirmDialog title="Replace your cloud data?" message="The selected copy will become the canonical version on every device. It is not merged with the current cloud data. Download a cloud backup first. Your old browser copy remains on this device." confirmLabel="Replace cloud data" onCancel={() => setConfirm(false)} onConfirm={() => void confirmImport()} />}
  </div>;
}

import { OverlayPresence } from '../../components/OverlayPresence';
import { SelectiveMerge, type SelectiveMergeProps } from './SelectiveMerge';
import { ConflictRecovery } from './ConflictRecovery';
import type { ConflictReview } from '../../data/cloudSync';
import type { MergeChoice } from '../../domain/selectiveMerge';
import { useRef, useState, type ChangeEvent } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { parseAppData } from '../../data/migrations';
import type { OfflineAccountState } from '../../data/offlineStore';
import type { AppDataV2 } from '../../domain/models';
import { downloadJson, readBackup } from './backups';

interface CloudDataManagementProps {
  data: AppDataV2; accountName?: string; onPrepareMerge?: SelectiveMergeProps['onPrepare']; onCommitMerge?: SelectiveMergeProps['onCommit']; onReviewConflicts?: () => Promise<ConflictReview>; onResolveConflicts?: (review: ConflictReview, choices: Record<string, MergeChoice>) => Promise<void>;
  pendingCount: number;
  onSignOut: () => void;
  onImport: (data: AppDataV2) => Promise<void>;
  onGetDeviceBackup: () => Promise<OfflineAccountState>;
}

export function CloudDataManagement({ data, pendingCount, onSignOut, onImport, onGetDeviceBackup, accountName = 'your account', onPrepareMerge, onCommitMerge, onReviewConflicts, onResolveConflicts }: CloudDataManagementProps) {
  const [preview, setPreview] = useState<AppDataV2 | null>(null);
  const [source, setSource] = useState<'legacy' | 'file' | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  let hasLegacy = false;
  try { hasLegacy = localStorage.getItem('workout-tracker:data') !== null; } catch { /* File imports remain available without browser storage. */ }

  function reviewLegacy() {
    if (inFlight.current) return;
    setPreview(null); setSource(null); setConfirm(false);
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
    if (!file || inFlight.current) return;
    event.target.value = '';
    inFlight.current = true; setReading(true); setPreview(null); setSource(null); setConfirm(false); setError(null);
    try {
      setPreview(parseAppData(JSON.parse(await readBackup(file))));
      setSource('file');
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Backup could not be validated.'); }
    finally { inFlight.current = false; setReading(false); }
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
    if (!preview || pendingCount > 0 || inFlight.current) return;
    inFlight.current = true; setBusy(true);
    try {
      await onImport(preview);
      setPreview(null);
      setConfirm(false);
      setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Import failed.'); setConfirm(false); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <div className="settings-page cloud-settings">
    <section className="data-hero"><div><p className="eyebrow">Private account</p><h2>Your cloud data</h2><p>Your signed-in account is the shared copy across devices. Export backups regularly, especially before an import.</p></div></section>
    {error && <p className="error-banner" role="alert">{error}</p>}
    {onPrepareMerge && onCommitMerge && <SelectiveMerge data={data} accountName={accountName} pendingCount={pendingCount} onPrepare={onPrepareMerge} onCommit={onCommitMerge} />}
    {onReviewConflicts && onResolveConflicts && <ConflictRecovery onReview={onReviewConflicts} onResolve={onResolveConflicts} />}
    <div className="data-management-grid">
      <section className="data-card"><h3>Back up your account</h3><p>Download the last cloud-acknowledged version of your workouts, body log, and meals.</p><div className="data-counts"><span><strong>{data.sessions.length}</strong> sessions</span><span><strong>{data.body.measurements.length}</strong> body entries</span><span><strong>{data.nutrition.diary.length}</strong> meals</span></div><button type="button" className="primary-action" onClick={() => void exportCloud()}>Download cloud backup</button>{pendingCount > 0 && <button type="button" className="secondary-action" onClick={() => void exportPending()}>Export {pendingCount} pending changes</button>}</section>
      <section className="data-card"><h3>Advanced: replace the entire account</h3><p>Choose one browser copy or JSON backup as the canonical version. It replaces the cloud copy; records are not merged.</p>{hasLegacy && <button type="button" className="secondary-action" disabled={busy || reading} onClick={reviewLegacy}>Review local data</button>}<label className="import-file">Choose JSON backup<input type="file" disabled={busy || reading} accept="application/json,.json" onChange={(event) => void reviewFile(event)} /></label>{reading && <p role="status">Reading backup…</p>}{preview && <div className="import-preview"><p className="eyebrow">{source === 'legacy' ? 'Local browser copy' : 'JSON backup'}</p><p>{preview.programs.length} programs · {preview.sessions.length} sessions · {preview.body.measurements.length} body entries · {preview.nutrition.diary.length} meals</p><button type="button" className="danger-action" disabled={busy || reading || pendingCount > 0} onClick={() => setConfirm(true)}>Replace cloud data</button>{pendingCount > 0 && <p>Resolve and sync pending changes first. Exporting is only a backup.</p>}</div>}</section>
    </div>
    <section className="data-card cloud-account"><h3>Account</h3><button className="secondary-action" type="button" onClick={() => void onGetDeviceBackup().then((state) => downloadJson('forge-recovery-backups.json', { userId: state.userId, recovery: state.recovery ?? [] })).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Backup failed.'))}>Download recovery backups and receipts</button><p>Sign out after all pending changes have been resolved and synced. Exports are backups, not queue resolution.</p><button type="button" className="secondary-action" disabled={pendingCount > 0 || busy} onClick={onSignOut}>Sign out</button></section>
    <OverlayPresence>{confirm && preview && <ConfirmDialog busy={busy} disabled={reading || pendingCount > 0} title="Replace your cloud data?" message="The selected copy will become the canonical version on every device. It is not merged with the current cloud data. Download a cloud backup first. Your old browser copy remains on this device." confirmLabel="Replace cloud data" onCancel={() => setConfirm(false)} onConfirm={() => void confirmImport()} />}</OverlayPresence>
  </div>;
}

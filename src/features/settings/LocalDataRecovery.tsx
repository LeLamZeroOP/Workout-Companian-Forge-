import { OverlayPresence } from '../../components/OverlayPresence';
import { useState, type ChangeEvent } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { parseAppData } from '../../data/migrations';
import { STORAGE_KEY } from '../../data/localStorageRepository';
import type { AppDataV2 } from '../../domain/models';
import { readBackup } from './backups';

export function LocalDataRecovery({ error, onRetry, onReplace, onReset }: { error: string; onRetry: () => boolean; onReplace: (data: AppDataV2) => boolean; onReset: () => boolean }) {
  const [preview, setPreview] = useState<AppDataV2 | null>(null);
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<'import' | 'reset' | null>(null);
  const [busy, setBusy] = useState(false);

  function downloadOriginal() {
    try {
      const original = localStorage.getItem(STORAGE_KEY);
      if (original === null) throw new Error('No saved document is available. Try loading again.');
      const url = URL.createObjectURL(new Blob([original], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'forge-original-saved-data.json'; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('Original saved data downloaded. Keep this file before replacing anything.');
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : 'Could not download the original data.'); }
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setBusy(true); setPreview(null); setNotice('');
    try { setPreview(parseAppData(JSON.parse(await readBackup(file)))); }
    catch (reason) { setNotice(reason instanceof Error ? reason.message : 'This backup could not be read.'); }
    finally { setBusy(false); }
  }

  return <section className="analytics-stack" aria-labelledby="recovery-heading">
    <div className="analytics-card"><p className="eyebrow">Local data recovery</p><h2 id="recovery-heading">Your saved data needs attention.</h2><p>Forge could not read the document saved in this browser. Your original data is preserved. Editing is paused until you load it successfully or deliberately replace it.</p><p role="alert" className="error-banner">{error}</p><div className="form-actions"><button type="button" className="primary-action" onClick={downloadOriginal}>Download original saved data</button><button type="button" className="secondary-action" onClick={() => { if (!onRetry()) setNotice('The saved document still cannot be read. Download it before restoring a backup.'); }}>Try loading again</button></div></div>
    <div className="analytics-card"><h3>Restore a readable backup</h3><p>The file is validated before you review and confirm replacement.</p><label className="import-file">Choose recovery backup<input type="file" accept="application/json,.json" disabled={busy} onChange={event => void chooseBackup(event)} /></label>{busy && <p role="status">Reading backup…</p>}{preview && <div className="import-preview"><h3>Validated backup</h3><p>{preview.programs.length} programs · {preview.sessions.length} sessions · {preview.body.measurements.length} body entries · {preview.nutrition.diary.length} diary entries</p><button type="button" className="secondary-action" onClick={() => setConfirm('import')}>Restore this backup</button></div>}</div>
    {notice && <p role="status">{notice}</p>}
    <div className="analytics-card"><h3>Start over</h3><p>Download the original document first if you want to keep it for recovery.</p><button type="button" className="danger-action" onClick={() => setConfirm('reset')}>Reset all local data</button></div>
    <OverlayPresence>{confirm && <ConfirmDialog title={confirm === 'import' ? 'Replace the unreadable document?' : 'Reset all local data?'} message="This overwrites the original document saved in this browser. Keep the downloaded original if you may need to recover it later." confirmLabel={confirm === 'import' ? 'Replace with backup' : 'Reset everything'} onCancel={() => setConfirm(null)} onConfirm={() => { const saved = confirm === 'import' && preview ? onReplace(preview) : onReset(); if (!saved) setNotice('The replacement could not be saved. Your original document is preserved.'); setConfirm(null); }} />}</OverlayPresence>
  </section>;
}

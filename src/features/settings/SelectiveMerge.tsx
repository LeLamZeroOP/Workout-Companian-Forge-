import { ChoiceGroup } from '../../components/ChoiceGroup';
import { useRef, useState, type ChangeEvent } from 'react';
import { parseAppData } from '../../data/migrations';
import type { PreparedMerge } from '../../data/cloudSync';
import type { AppDataV2, MergeReceipt } from '../../domain/models';
import { categoryLabels, collection, mergeCategories, selectableRows, type MergeChoice, type MergeSelection } from '../../domain/selectiveMerge';
import { downloadJson, readBackup } from './backups';
import { RecordComparison } from './RecordComparison';

export interface SelectiveMergeProps {
  accountName: string;
  data: AppDataV2;
  pendingCount: number;
  onPrepare: (source: AppDataV2, selection: MergeSelection) => Promise<PreparedMerge>;
  onCommit: (review: PreparedMerge, currentSource: AppDataV2) => Promise<void>;
}
export function SelectiveMerge({ accountName, data, pendingCount, onPrepare, onCommit }: SelectiveMergeProps) {
  const [source, setSource] = useState<AppDataV2 | null>(null);
  const [sourceKind, setSourceKind] = useState<'local' | 'file'>('file');
  const [sourceName, setSourceName] = useState('');
  const [selection, setSelection] = useState<MergeSelection>({ keys: [], choices: {} });
  const [query, setQuery] = useState('');
  const [review, setReview] = useState<PreparedMerge | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<MergeReceipt | null>(null);
  const inFlight = useRef(false);
  let hasLocal = false;
  try { hasLocal = localStorage.getItem('workout-tracker:data') !== null; } catch { /* A backup file can still be reviewed. */ }
  const rows = source ? selectableRows(source) : [];
  const filtered = rows.filter((row) => `${row.label} ${row.detail}`.toLowerCase().includes(query.toLowerCase()));
  const total = review ? review.counts.added + review.counts.replaced + review.counts.copied : 0;

  function load(value: unknown, name: string, kind: 'local' | 'file') {
    setSource(null); setReview(null); setReceipt(null); setSelection({ keys: [], choices: {} });
    try { setSource(parseAppData(value)); setSourceKind(kind); setSourceName(name); setError(''); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Invalid backup.'); }
  }
  async function fileChanged(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setReceipt(null); setReview(null); setSource(null);
    try { load(JSON.parse(await readBackup(file)), file.name, 'file'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Invalid backup.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function choose(keys: string[], checked: boolean) {
    setSelection((current) => ({ ...current, keys: checked ? [...new Set([...current.keys, ...keys])] : current.keys.filter((key) => !keys.includes(key)) })); setDirty(true); setReceipt(null);
  }
  async function prepare() {
    if (!source || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const currentSource = sourceKind === 'local' ? parseAppData(JSON.parse(localStorage.getItem('workout-tracker:data') ?? 'null')) : source;
      const next = await onPrepare(currentSource, selection);
      setSource(currentSource); setReview(next); setDirty(false);
    } catch (reason) { setReview(null); setError(reason instanceof Error ? reason.message : 'Review failed.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function commit() {
    if (!source || !review || dirty || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const currentSource = sourceKind === 'local' ? parseAppData(JSON.parse(localStorage.getItem('workout-tracker:data') ?? 'null')) : source;
      await onCommit(review, currentSource);
      setReceipt({ id: review.operationId, at: new Date().toISOString(), counts: review.counts }); setReview(null); setSelection({ keys: [], choices: {} });
    } catch (reason) { setDirty(true); setError(reason instanceof Error ? reason.message : 'Merge needs review.'); }
    finally { inFlight.current = false; setBusy(false); }
  }

  return <section className="data-card merge-panel" aria-label="Merge selected data">
    <h2>Merge selected data</h2><p>Add selected records to <strong>{accountName}</strong>. Nothing is selected automatically.</p>
    <p>Only this browser’s signed-out local copy is available here. Use a Forge JSON backup for localhost or another device. Pending-change diagnostic files are not full backups.</p>
    {pendingCount > 0 && <p role="status">Resolve and sync {pendingCount} pending changes before reviewing a merge. A diagnostic export does not clear this requirement.</p>}
    <fieldset disabled={busy}><legend>Choose a source</legend>{hasLocal ? <button className="secondary-action" type="button" onClick={() => { try { load(JSON.parse(localStorage.getItem('workout-tracker:data') ?? 'null'), 'This browser’s local copy', 'local'); } catch { setError('The local copy is not valid JSON.'); } }}>Review local data for merge</button> : <p>No signed-out local copy exists in this browser.</p>}<label className="import-file">Choose merge backup<input type="file" accept="application/json,.json" onChange={(event) => void fileChanged(event)} /></label></fieldset>
    {error && <p className="error-banner" role="alert">{error}</p>}
    {receipt && <div role="status"><h3>Merge acknowledged by the cloud</h3><p>{receipt.counts.added} added · {receipt.counts.replaced} replaced · {receipt.counts.copied} separate copies · {receipt.counts.skipped} skipped</p><button className="secondary-action" type="button" onClick={() => downloadJson('forge-merge-receipt.json', receipt)}>Download receipt</button></div>}
    {source && <fieldset disabled={busy}><legend>{sourceName} · {rows.length} eligible records</legend><p>Unfinished workouts, body profile, targets, preferences, and active session selection are excluded. {source.sessions.filter((session) => !session.completedAt).length} unfinished workouts left untouched.</p><label>Search source records<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, date, meal…" /></label><p>{selection.keys.length} selected</p>
      {mergeCategories.map((category) => {
        const group = filtered.filter((row) => row.category === category);
        return <details key={category} open><summary>{categoryLabels[category]} · {group.length} results</summary><button className="text-action" type="button" disabled={!group.length} onClick={() => choose(group.map((row) => row.key), true)}>Select all {categoryLabels[category].toLowerCase()} results</button><button className="text-action" type="button" onClick={() => choose(rows.filter((row) => row.category === category).map((row) => row.key), false)}>Clear category</button>{group.map((row) => <label className="merge-selection" key={row.key}><input type="checkbox" checked={selection.keys.includes(row.key)} onChange={(event) => choose([row.key], event.target.checked)} /><span><strong>{row.label}</strong><small>{row.detail}</small>{collection(data, category).some((record) => record.id !== row.record.id && (('name' in record && 'name' in row.record && record.name === row.record.name) || ('localDate' in record && 'localDate' in row.record && record.localDate === row.record.localDate))) && <small>Similar name/date exists in the account. Review before adding; this is not automatically treated as a duplicate.</small>}</span></label>)}</details>;
      })}
      <button className="primary-action" type="button" disabled={!selection.keys.length || pendingCount > 0} onClick={() => void prepare()}>{busy ? 'Loading account…' : 'Review selected data'}</button><button className="text-action" type="button" onClick={() => { setSource(null); setReview(null); }}>Cancel merge</button>
    </fieldset>}
    {review && <fieldset disabled={busy}><legend>Review merge into {accountName}</legend><p>{review.counts.added} new · {review.counts.replaced} replacements · {review.counts.copied} copies · {review.counts.skipped} skipped · {review.counts.linked} linked records</p>{review.rows.map((row) => <div className="merge-review-row" key={row.key}><h3>{row.label}{row.linked ? ' (required linked record)' : ''}</h3><p>{row.detail} · {row.action}</p>{row.conflict && <><RecordComparison local={row.record} cloud={row.destination} /><ChoiceGroup label={`Decision for ${row.label}`} value={selection.choices[row.key] ?? (row.linked && row.copyOnly ? 'copy' : 'cloud')} onChange={value => { setSelection(current => ({ ...current, choices: { ...current.choices, [row.key]: value as MergeChoice } })); setDirty(true); }} options={[{ value: 'cloud', label: 'Keep account', description: 'Skip the source version' }, ...(!row.copyOnly ? [{ value: 'local', label: 'Use source', description: 'Replace the account version' }] : []), { value: 'copy', label: 'Keep both', description: 'Create a separate copy' }]} />{row.copyOnly && <p>Definition replacements could affect existing records. A separate copy keeps imported references independent.</p>}</>}</div>)}
      <div className="form-actions"><button className="secondary-action" type="button" onClick={() => downloadJson('forge-merge-source.json', review.source)}>Download source backup</button><button className="secondary-action" type="button" onClick={() => downloadJson('forge-before-merge.json', JSON.parse(review.accountContent))}>Download pre-merge account backup</button></div>
      <p>Both backups will be saved on this device, scoped to this account, before the merge is sent. Your original local copy stays intact.</p>
      {dirty ? <p role="status">Choices changed. Review selected data again before confirming.</p> : total === 0 ? <p>No changes to upload; selected records were skipped or already present.</p> : <button className="primary-action" type="button" disabled={pendingCount > 0} onClick={() => void commit()}>Merge {total} records into {accountName}</button>}
    </fieldset>}
  </section>;
}

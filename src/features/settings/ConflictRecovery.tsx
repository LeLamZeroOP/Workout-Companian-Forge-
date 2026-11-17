import { ChoiceGroup } from '../../components/ChoiceGroup';
import { useRef, useState } from 'react';
import type { ConflictReview } from '../../data/cloudSync';
import type { MergeChoice } from '../../domain/selectiveMerge';
import { RecordComparison } from './RecordComparison';
import { downloadJson } from './backups';

export function ConflictRecovery({ onReview, onResolve }: { onReview: () => Promise<ConflictReview>; onResolve: (review: ConflictReview, choices: Record<string, MergeChoice>) => Promise<void> }) {
  const [review, setReview] = useState<ConflictReview | null>(null);
  const [choices, setChoices] = useState<Record<string, MergeChoice>>({});
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  async function run(action: () => Promise<void>) {
    if (inFlight.current) return; inFlight.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (reason) { setReview(null); setError(reason instanceof Error ? reason.message : 'Review failed.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  return <section className="data-card"><h2>Sync recovery</h2><p>Review all queued edits together. Choosing the account version skips every queued edit to that record; unrelated changes are retained. A recovery backup is saved before resolution.</p>
    <button className="secondary-action" type="button" disabled={busy} onClick={() => void run(async () => { setReview(await onReview()); setChoices({}); })}>Review pending changes</button>
    {error && <p className="error-banner" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {review && <fieldset disabled={busy}><legend>{review.pending.length} queued changes · account revision {review.revision}</legend>{review.rows.map((row) => {
      const value = row.local && typeof row.local === 'object' ? row.local as Record<string, unknown> : null;
      const label = String(value?.name ?? value?.workoutName ?? value?.foodName ?? (value?.weightKg ? `${value.weightKg} kg` : row.scope));
      const copyAllowed = value && (/^(program|exercise|measurement|food|entry):/.test(row.scope) || (row.scope.startsWith('session:') && Boolean(value.completedAt)));
      return <div className="merge-review-row" key={row.scope}><h3>{label}</h3><p>{row.count} linked queued edits · {row.conflict ? 'Conflict needs a decision' : 'Unrelated change will be retained'}</p><RecordComparison local={row.local} cloud={row.cloud} />{row.conflict && <ChoiceGroup label={`Resolution for ${label}`} value={choices[row.scope] ?? 'cloud'} onChange={value => setChoices(current => ({ ...current, [row.scope]: value as MergeChoice }))} options={[{ value: 'cloud', label: 'Use account', description: 'Skip queued edits to this record' }, { value: 'local', label: 'Keep local', description: 'Apply against the reviewed revision' }, ...(copyAllowed ? [{ value: 'copy', label: 'Keep both', description: 'Save local as a separate copy' }] : [])]} />}</div>;
    })}{review.pending.length > 0 ? <><button className="secondary-action" type="button" onClick={() => downloadJson('forge-before-conflict-resolution.json', review.remote.data)}>Download account backup</button><button className="primary-action" type="button" onClick={() => void run(async () => { await onResolve(review, choices); setReview(null); setMessage('Resolution acknowledged by the cloud.'); })}>Apply reviewed resolution to {review.pending.length} queued changes</button></> : <p>No pending edits remain.</p>}</fieldset>}
  </section>;
}

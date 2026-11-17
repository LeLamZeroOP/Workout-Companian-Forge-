import type { AppMutation } from '../domain/appMutations';
import { applyMutation, getConflictScope, readConflictValue } from '../domain/appMutations';
import type { AppDataV2, MergeReceipt } from '../domain/models';
import { canonical } from '../domain/canonical';
import { buildMergePlan, type MergeChoice, type MergePlan, type MergeSelection } from '../domain/selectiveMerge';
import { validateAppData } from './validateAppData';
import { CloudRepository, type CloudSnapshot } from './cloudRepository';
import { OfflineStore, type PendingMutation, type RecoveryOperation } from './offlineStore';
import { accountLock, type AccountLock } from './accountLock';

export interface SyncView { data: AppDataV2; pendingCount: number; conflictCount: number; revision: number }
export interface PreparedMerge extends MergePlan { userId: string; revision: number; source: AppDataV2 }
export interface ConflictRow { scope: string; local: unknown; cloud: unknown; count: number; conflict: boolean }
export interface ConflictReview { userId: string; revision: number; rows: ConflictRow[]; pending: PendingMutation[]; remote: CloudSnapshot }

export class CloudSync {
  constructor(private readonly repository: CloudRepository, private readonly store: OfflineStore, private readonly lock: AccountLock = accountLock) {}

  async open(userId: string, initialData: AppDataV2): Promise<SyncView> {
    return this.lock(userId, async () => {
      const local = await this.store.load(userId);
      try {
        const remote = await this.repository.load(userId) ?? await this.repository.initialize(userId, initialData);
        await this.reconcile(userId, remote);
      } catch (error) { if (!local) throw error; }
      const view = await this.view(userId);
      if (!view) throw new Error('No saved account data is available. Connect once while online.');
      return view;
    });
  }

  async view(userId: string): Promise<SyncView | null> {
    const state = await this.store.load(userId);
    if (!state) return null;
    const data = state.pending.reduce((current, item) => applyMutation(current, item.mutation), state.snapshot.data);
    return { data, pendingCount: state.pending.length, conflictCount: state.pending.filter((item) => item.status === 'conflict').length, revision: state.snapshot.revision };
  }

  async enqueue(userId: string, mutation: AppMutation, expected?: { before: unknown; revision: number }): Promise<SyncView> {
    return this.lock(userId, async () => {
      const state = await this.store.load(userId); const view = await this.view(userId);
      if (!state || !view) throw new Error('Sign in online once before logging offline.');
      if (state.recovery?.some((item) => item.status === 'prepared')) throw new Error('Reconnect and reconcile the previous account operation before editing.');
      const scope = getConflictScope(mutation);
      validateAppData(applyMutation(view.data, mutation));
      const before = expected ? expected.before : readConflictValue(view.data, scope);
      const changed = expected && canonical(before) !== canonical(readConflictValue(view.data, scope));
      await this.store.enqueue(userId, { id: crypto.randomUUID(), userId, createdAt: new Date().toISOString(), baseRevision: expected?.revision ?? state.snapshot.revision, scope, before, mutation, status: changed ? 'conflict' : 'pending' });
      return (await this.view(userId))!;
    });
  }

  async replaceExact(userId: string, nextData: AppDataV2): Promise<SyncView> {
    return this.lock(userId, async () => {
      const state = await this.store.load(userId);
      if (!state) throw new Error('Sign in online before replacing cloud data.');
      if (state.pending.length) throw new Error('Resolve and sync pending changes before replacing cloud data. Exporting is only a backup.');
      const remote = await this.repository.load(userId);
      if (!remote || remote.revision !== state.snapshot.revision) throw new Error('A newer cloud version exists. Refresh and review it before importing.');
      if (state.recovery?.some((item) => item.status === 'prepared')) throw new Error('Reconcile the previous operation before replacing data.');
      const result = await this.repository.save(userId, remote.revision, validateAppData({ ...nextData, mergeLedger: remote.data.mergeLedger }), crypto.randomUUID());
      if ('kind' in result) throw new Error('A newer cloud version exists. Refresh and review it before importing.');
      await this.store.writeSnapshot(userId, result);
      return (await this.view(userId))!;
    }, true);
  }

  /** Prepared operations are retried with the same identity and reviewed revision only. */
  private async reconcile(userId: string, initial: CloudSnapshot): Promise<CloudSnapshot> {
    let remote = initial;
    const state = await this.store.load(userId);
    for (const operation of state?.recovery ?? []) {
      if (operation.status !== 'prepared') continue;
      if (!remote.data.mergeLedger?.receipts.some((receipt) => receipt.id === operation.id) && remote.revision === operation.before.revision) {
        const result = await this.repository.save(userId, operation.before.revision, operation.proposed, operation.id);
        remote = 'kind' in result ? (await this.repository.load(userId))! : result;
      }
      if (remote.data.mergeLedger?.receipts.some((receipt) => receipt.id === operation.id)) await this.store.finishRecovery(userId, operation.id, remote);
      else if (remote.revision !== operation.before.revision) await this.store.finishRecovery(userId, operation.id, null);
      else throw new Error('Previous operation acknowledgement is uncertain. Reconnect to reconcile it.');
    }
    await this.store.writeSnapshot(userId, remote);
    return remote;
  }

  async flush(userId: string): Promise<SyncView | null> {
    return this.lock(userId, async () => {
      for (;;) {
        const initial = await this.repository.load(userId);
        if (!initial) throw new Error('Cloud document is missing.');
        const remote = await this.reconcile(userId, initial);
        const state = await this.store.load(userId);
        if (!state) return null;
        const pending = state.pending[0];
        if (!pending || pending.status === 'conflict') return this.view(userId);
        if (remote.recentMutationIds.includes(pending.id)) { await this.store.acknowledge(userId, pending.id, remote); continue; }
        const startingId = pending.mutation.kind === 'startWorkout' ? pending.mutation.session.id : null;
        const concurrentWorkout = startingId !== null && remote.data.sessions.some((session) => session.completedAt === null && session.id !== startingId);
        if (concurrentWorkout || canonical(readConflictValue(remote.data, pending.scope)) !== canonical(pending.before)) {
          await this.store.markConflict(userId, pending.id); return this.view(userId);
        }
        const result = await this.repository.save(userId, remote.revision, validateAppData(applyMutation(remote.data, pending.mutation)), pending.id);
        if ('kind' in result) continue;
        await this.store.acknowledge(userId, pending.id, result);
      }
    });
  }

  async prepareMerge(userId: string, source: AppDataV2, selection: MergeSelection, operationId = crypto.randomUUID()): Promise<PreparedMerge> {
    return this.lock(userId, async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Connect to review the current account version.');
      const remote = await this.repository.load(userId);
      if (!remote) throw new Error('Sign in online before merging.');
      const current = await this.reconcile(userId, remote);
      const state = await this.store.load(userId);
      if (!state || state.pending.length) throw new Error('Resolve and sync all pending changes before merging.');
      return { ...buildMergePlan(source, current.data, selection, operationId), userId, revision: current.revision, source: structuredClone(source) };
    }, true);
  }

  async commitMerge(review: PreparedMerge, currentSource: AppDataV2, isCurrentAccount: () => boolean = () => true): Promise<SyncView> {
    return this.lock(review.userId, async () => {
      if (!isCurrentAccount()) throw new Error('Account changed. Review again.');
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('Connect before merging.');
      const remote = await this.repository.load(review.userId);
      if (!remote) throw new Error('Cloud document is missing.');
      if (remote.data.mergeLedger?.receipts.some((item) => item.id === review.operationId)) {
        const state = await this.store.load(review.userId);
        if (state?.recovery?.some((item) => item.id === review.operationId)) await this.store.finishRecovery(review.userId, review.operationId, remote);
        else await this.store.writeSnapshot(review.userId, remote);
        return (await this.view(review.userId))!;
      }
      const state = await this.store.load(review.userId);
      if (!state || state.pending.length || state.recovery?.some((item) => item.status === 'prepared')) throw new Error('Sync or reconcile pending work before merging.');
      if (remote.revision !== review.revision || canonical(remote.data) !== review.accountContent) throw new Error('Account data changed. Rebuild the preview and confirm again.');
      if (canonical(validateAppData(currentSource)) !== review.sourceContent) throw new Error('Source data changed. Rebuild the preview and confirm again.');
      const plan = buildMergePlan(review.source, remote.data, review.selection, review.operationId);
      if (canonical(plan.data) !== canonical(review.data)) throw new Error('Preview changed. Review again.');
      if (plan.counts.added + plan.counts.replaced + plan.counts.copied === 0) return (await this.view(review.userId))!;
      const proposed = this.withReceipt(plan.data, { id: review.operationId, at: new Date().toISOString(), counts: plan.counts });
      await this.commitOperation(review.userId, { id: review.operationId, kind: 'merge', before: remote, source: review.source, queue: [], proposed, status: 'prepared' }, isCurrentAccount);
      return (await this.view(review.userId))!;
    }, true);
  }

  private withReceipt(data: AppDataV2, receipt: MergeReceipt): AppDataV2 {
    return validateAppData({ ...data, mergeLedger: { mappings: data.mergeLedger?.mappings ?? [], receipts: [...(data.mergeLedger?.receipts ?? []), receipt] } });
  }

  private async commitOperation(userId: string, operation: RecoveryOperation, isCurrentAccount: () => boolean) {
    if (!isCurrentAccount()) throw new Error('Account changed. Review again.');
    await this.store.prepareRecovery(userId, operation); // Must durably succeed before the first write.
    if (!isCurrentAccount()) { await this.store.finishRecovery(userId, operation.id, null); throw new Error('Account changed. Review again.'); }
    try {
      const result = await this.repository.save(userId, operation.before.revision, operation.proposed, operation.id);
      if ('kind' in result) {
        const remote = await this.repository.load(userId);
        if (remote?.data.mergeLedger?.receipts.some((item) => item.id === operation.id)) { await this.store.finishRecovery(userId, operation.id, remote); return; }
        await this.store.finishRecovery(userId, operation.id, null);
        throw new Error('A newer cloud version exists. Rebuild the preview and confirm again.');
      }
      await this.store.finishRecovery(userId, operation.id, result);
    } catch (error) {
      const state = await this.store.load(userId);
      if (state?.recovery?.some((item) => item.id === operation.id && item.status === 'prepared')) throw new Error('Cloud acknowledgement is uncertain. Your backups and operation identity are saved. Reconnect and Retry sync to reconcile before another import.');
      throw error;
    }
  }

  async reviewConflicts(userId: string): Promise<ConflictReview> {
    return this.lock(userId, async () => {
      const remote = await this.repository.load(userId);
      const state = await this.store.load(userId);
      if (!remote || !state) throw new Error('Connect to review conflicts.');
      const local = state.pending.reduce((data, item) => applyMutation(data, item.mutation), state.snapshot.data);
      const scopes = [...new Set(state.pending.map((item) => item.scope))];
      const rows = scopes.map((scope) => {
        const pending = state.pending.filter((item) => item.scope === scope);
        const cloud = readConflictValue(remote.data, scope);
        return { scope, local: readConflictValue(local, scope), cloud, count: pending.length, conflict: pending.some((item) => item.status === 'conflict') || canonical(cloud) !== canonical(pending[0]!.before) };
      });
      return { userId, revision: remote.revision, rows, pending: state.pending, remote };
    }, true);
  }

  async resolveConflicts(review: ConflictReview, choices: Record<string, MergeChoice>, isCurrentAccount: () => boolean = () => true): Promise<SyncView> {
    return this.lock(review.userId, async () => {
      if (!isCurrentAccount()) throw new Error('Account changed. Review again.');
      const state = await this.store.load(review.userId); const remote = await this.repository.load(review.userId);
      if (!state || !remote || canonical(state.pending) !== canonical(review.pending) || remote.revision !== review.revision) throw new Error('Pending or account data changed. Review again.');
      if (state.recovery?.some((item) => item.status === 'prepared')) throw new Error('Reconcile the previous operation first.');
      const skipped = new Set(review.rows.filter((row) => row.conflict && choices[row.scope] !== 'local').map((row) => row.scope));
      let data = review.pending.reduce((current, item) => skipped.has(item.scope) ? current : applyMutation(current, item.mutation), remote.data);
      const id = crypto.randomUUID();
      const categories: Record<string, string> = { program: 'programs', session: 'sessions', exercise: 'exercises', measurement: 'measurements', food: 'foods', entry: 'diary' };
      const copiedKeys = review.rows.filter((row) => row.conflict && choices[row.scope] === 'copy').map((row) => {
        const separator = row.scope.indexOf(':'); const category = categories[row.scope.slice(0, separator)];
        if (!category) throw new Error('This setting cannot be saved as a separate copy.');
        return `${category}:${row.scope.slice(separator + 1)}`;
      });
      if (copiedKeys.length) {
        const local = review.pending.reduce((current, item) => applyMutation(current, item.mutation), state.snapshot.data);
        data = buildMergePlan(local, data, { keys: copiedKeys, choices: Object.fromEntries(copiedKeys.map((key) => [key, 'copy'])) }, id).data;
      }
      if (data.sessions.filter((session) => session.completedAt === null).length > 1) throw new Error('Another device has an active workout. Use the account version, or finish that workout before keeping this local session.');
      for (const program of data.programs) for (const workout of program.workouts) for (const exercise of workout.exercises) if (!data.exercises.some((item) => item.id === exercise.exerciseId)) throw new Error('A selected program needs a missing exercise. Keep its linked exercise change too.');
      const proposed = this.withReceipt(data, { id, at: new Date().toISOString(), counts: { added: 0, replaced: review.pending.length - review.pending.filter((item) => skipped.has(item.scope)).length, skipped: review.pending.filter((item) => skipped.has(item.scope) && choices[item.scope] !== 'copy').length, copied: copiedKeys.length, linked: 0 } });
      await this.commitOperation(review.userId, { id, kind: 'resolve', before: remote, source: { snapshot: state.snapshot, pending: state.pending }, queue: review.pending, proposed, status: 'prepared' }, isCurrentAccount);
      return (await this.view(review.userId))!;
    }, true);
  }
}

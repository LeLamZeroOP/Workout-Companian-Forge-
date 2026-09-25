import type { AppMutation } from '../domain/appMutations';
import { applyMutation, getConflictScope, readConflictValue } from '../domain/appMutations';
import type { AppDataV2 } from '../domain/models';
import { validateAppData } from './validateAppData';
import { CloudRepository, type CloudSnapshot } from './cloudRepository';
import { OfflineStore } from './offlineStore';

export interface SyncView {
  data: AppDataV2;
  pendingCount: number;
  conflictCount: number;
  revision: number;
}

export class CloudSync {
  constructor(private readonly repository: CloudRepository, private readonly store: OfflineStore) {}

  async open(userId: string, initialData: AppDataV2): Promise<SyncView> {
    const local = await this.store.load(userId);
    try {
      const remote = await this.repository.load(userId) ?? await this.repository.initialize(userId, initialData);
      await this.store.writeSnapshot(userId, remote);
    } catch (error) {
      if (!local) throw error;
    }
    const view = await this.view(userId);
    if (!view) throw new Error('No saved account data is available. Connect once while online.');
    return view;
  }

  async view(userId: string): Promise<SyncView | null> {
    const state = await this.store.load(userId);
    if (!state) return null;
    const data = state.pending.reduce((current, item) => applyMutation(current, item.mutation), state.snapshot.data);
    return { data, pendingCount: state.pending.length, conflictCount: state.pending.filter((item) => item.status === 'conflict').length, revision: state.snapshot.revision };
  }

  async enqueue(userId: string, mutation: AppMutation): Promise<SyncView> {
    const state = await this.store.load(userId);
    const view = await this.view(userId);
    if (!state || !view) throw new Error('Sign in online once before logging offline.');
    const scope = getConflictScope(mutation);
    validateAppData(applyMutation(view.data, mutation));
    await this.store.enqueue(userId, {
      id: crypto.randomUUID(), userId, createdAt: new Date().toISOString(), baseRevision: state.snapshot.revision,
      scope, before: readConflictValue(view.data, scope), mutation, status: 'pending',
    });
    return (await this.view(userId))!;
  }

  async replaceExact(userId: string, nextData: AppDataV2): Promise<SyncView> {
    const state = await this.store.load(userId);
    if (!state) throw new Error('Sign in online before replacing cloud data.');
    if (state.pending.length) throw new Error('Sync or export pending changes before replacing cloud data.');
    const remote = await this.repository.load(userId);
    if (!remote || remote.revision !== state.snapshot.revision) throw new Error('A newer cloud version exists. Refresh and review it before importing.');
    const result = await this.repository.save(userId, remote.revision, validateAppData(nextData), crypto.randomUUID());
    if ('kind' in result) throw new Error('A newer cloud version exists. Refresh and review it before importing.');
    await this.store.writeSnapshot(userId, result);
    return (await this.view(userId))!;
  }

  async flush(userId: string): Promise<SyncView | null> {
    for (;;) {
      const state = await this.store.load(userId);
      if (!state) return null;
      const pending = state.pending[0];
      const remote = await this.repository.load(userId);
      if (!remote) throw new Error('Cloud document is missing.');
      if (!pending) {
        await this.store.writeSnapshot(userId, remote);
        return this.view(userId);
      }
      if (pending.status === 'conflict') {
        await this.store.writeSnapshot(userId, remote);
        return this.view(userId);
      }
      if (remote.recentMutationIds.includes(pending.id)) {
        await this.store.acknowledge(userId, pending.id, remote);
        continue;
      }
      if (JSON.stringify(readConflictValue(remote.data, pending.scope)) !== JSON.stringify(pending.before)) {
        await this.store.writeSnapshot(userId, remote);
        await this.store.markConflict(userId, pending.id);
        return this.view(userId);
      }
      const nextData = validateAppData(applyMutation(remote.data, pending.mutation));
      const result = await this.repository.save(userId, remote.revision, nextData, pending.id);
      if ('kind' in result) continue;
      await this.store.acknowledge(userId, pending.id, result as CloudSnapshot);
    }
  }
}

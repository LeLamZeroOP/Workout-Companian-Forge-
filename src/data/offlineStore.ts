import type { CloudSnapshot } from './cloudRepository';
import type { AppMutation } from '../domain/appMutations';

export interface PendingMutation {
  id: string;
  userId: string;
  createdAt: string;
  baseRevision: number;
  scope: string;
  before: unknown;
  mutation: AppMutation;
  status: 'pending' | 'conflict';
}

export interface OfflineAccountState {
  userId: string;
  snapshot: CloudSnapshot;
  pending: PendingMutation[];
}

export class OfflineStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(private readonly databaseName = 'forge-offline-v1') {}

  private db(): Promise<IDBDatabase> {
    if (!this.dbPromise) this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('accounts', { keyPath: 'userId' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return this.dbPromise;
  }

  async load(userId: string): Promise<OfflineAccountState | null> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('accounts', 'readonly');
      const request = transaction.objectStore('accounts').get(userId);
      request.onsuccess = () => resolve((request.result as OfflineAccountState | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  private async modify(userId: string, update: (state: OfflineAccountState | null) => OfflineAccountState): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('accounts', 'readwrite');
      const store = transaction.objectStore('accounts');
      const request = store.get(userId);
      request.onsuccess = () => {
        try { store.put(update((request.result as OfflineAccountState | undefined) ?? null)); }
        catch (error) { transaction.abort(); reject(error); }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('Offline storage was interrupted.'));
    });
  }

  async writeSnapshot(userId: string, snapshot: CloudSnapshot): Promise<void> {
    if (snapshot.userId !== userId) throw new Error('Snapshot belongs to another account.');
    await this.modify(userId, (state) => ({ userId, snapshot, pending: state?.pending ?? [] }));
  }

  async enqueue(userId: string, mutation: PendingMutation): Promise<void> {
    if (mutation.userId !== userId) throw new Error('Mutation belongs to another account.');
    await this.modify(userId, (state) => {
      if (!state) throw new Error('Open an online session before saving offline.');
      if (state.pending.some((item) => item.id === mutation.id)) return state;
      return { ...state, pending: [...state.pending, mutation] };
    });
  }

  async acknowledge(userId: string, mutationId: string, snapshot: CloudSnapshot): Promise<void> {
    if (snapshot.userId !== userId) throw new Error('Snapshot belongs to another account.');
    await this.modify(userId, (state) => {
      if (!state) throw new Error('Offline account is missing.');
      return { ...state, snapshot, pending: state.pending.filter((item) => item.id !== mutationId) };
    });
  }

  async markConflict(userId: string, mutationId: string): Promise<void> {
    await this.modify(userId, (state) => {
      if (!state) throw new Error('Offline account is missing.');
      return { ...state, pending: state.pending.map((item) => item.id === mutationId ? { ...item, status: 'conflict' } : item) };
    });
  }
}

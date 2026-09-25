import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { OfflineStore } from '../../src/data/offlineStore';

describe('OfflineStore', () => {
  it('retains account-scoped pending work across store instances', async () => {
    const name = `forge-test-${crypto.randomUUID()}`;
    const first = new OfflineStore(name);
    await first.writeSnapshot('alice', { userId: 'alice', revision: 0, data: createDefaultData(), recentMutationIds: [] });
    await first.enqueue('alice', { id: 'm1', userId: 'alice', createdAt: new Date().toISOString(), baseRevision: 0, scope: 'program:starter-program', before: createDefaultData().programs[0], mutation: { kind: 'deleteProgram', programId: 'starter-program' }, status: 'pending' });
    const second = new OfflineStore(name);
    expect((await second.load('alice'))?.pending).toHaveLength(1);
    expect(await second.load('bob')).toBeNull();
  });

  it('acknowledges only the specified mutation', async () => {
    const store = new OfflineStore(`forge-test-${crypto.randomUUID()}`);
    await store.writeSnapshot('alice', { userId: 'alice', revision: 0, data: createDefaultData(), recentMutationIds: [] });
    for (const id of ['m1', 'm2']) await store.enqueue('alice', { id, userId: 'alice', createdAt: new Date().toISOString(), baseRevision: 0, scope: 'program:starter-program', before: null, mutation: { kind: 'deleteProgram', programId: 'starter-program' }, status: 'pending' });
    await store.acknowledge('alice', 'm1', { userId: 'alice', revision: 1, data: createDefaultData(), recentMutationIds: ['m1'] });
    expect((await store.load('alice'))?.pending.map((item) => item.id)).toEqual(['m2']);
  });
});

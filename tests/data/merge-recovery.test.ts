import 'fake-indexeddb/auto';
import { vi } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { CloudRepository, type CloudDocumentRow, type DocumentGateway } from '../../src/data/cloudRepository';
import { CloudSync } from '../../src/data/cloudSync';
import { OfflineStore } from '../../src/data/offlineStore';
import type { AccountLock } from '../../src/data/accountLock';
import type { BodyMeasurement } from '../../src/domain/models';

function system() {
  const rows = new Map<string, CloudDocumentRow>(); let loseResponse = false;
  const gateway: DocumentGateway = {
    async read(id) { return rows.has(id) ? structuredClone(rows.get(id)!) : null; },
    async insert(row) { if (rows.has(row.user_id)) return false; rows.set(row.user_id, structuredClone(row)); return true; },
    async compareAndSwap(row, revision) { if (rows.get(row.user_id)?.revision !== revision) return false; rows.set(row.user_id, structuredClone(row)); if (loseResponse) { loseResponse = false; throw new Error('Response lost'); } return true; },
  };
  const repository = new CloudRepository(gateway); const store = new OfflineStore(`merge-${crypto.randomUUID()}`);
  let tail: Promise<unknown> = Promise.resolve();
  const lock: AccountLock = (_user, action) => { const next = tail.catch(() => {}).then(action); tail = next; return next; };
  const sync = new CloudSync(repository, store, lock);
  return { rows, repository, store, sync, lock, loseNextResponse: () => { loseResponse = true; } };
}
const measurement: BodyMeasurement = { id: 'm', recordedAt: '2026-09-27T12:00:00Z', entryOrder: 10, localDate: '2026-09-27', weightKg: 100, bodyFatPercent: null, waistCm: null, chestCm: null, hipsCm: null, upperArmCm: null, thighCm: null, notes: '' };
const selection = { keys: ['measurements:m'], choices: {} };
function sourceData() { const data = createDefaultData(); data.body.measurements = [measurement]; return data; }

describe('revision-safe merge and recovery', () => {
  it('preview makes no writes; acknowledged merge reaches a second device exactly once', async () => {
    const { sync, repository, store } = system(); await sync.open('alice', createDefaultData());
    const source = sourceData(); const review = await sync.prepareMerge('alice', source, selection);
    expect((await repository.load('alice'))!.revision).toBe(0); expect((await store.load('alice'))!.recovery).toBeUndefined();
    await sync.commitMerge(review, source);
    const secondDevice = new CloudSync(repository, new OfflineStore(`device-${crypto.randomUUID()}`));
    expect((await secondDevice.open('alice', createDefaultData())).data.body.measurements).toEqual([measurement]);
    const repeated = await sync.prepareMerge('alice', source, selection); await sync.commitMerge(repeated, source);
    expect((await repository.load('alice'))!.revision).toBe(1);
    expect((await store.load('alice'))!.recovery?.[0]).toMatchObject({ status: 'acknowledged', source, before: { revision: 0 } });
  });
  it('empty selection makes no mutation', async () => {
    const { sync, repository } = system(); await sync.open('alice', createDefaultData());
    const source = sourceData(); await sync.commitMerge(await sync.prepareMerge('alice', source, { keys: [], choices: {} }), source);
    expect((await repository.load('alice'))!.revision).toBe(0);
  });
  it('serializes double confirmations without duplicating records', async () => {
    const { sync, repository } = system(); await sync.open('alice', createDefaultData()); const source = sourceData();
    const review = await sync.prepareMerge('alice', source, selection);
    await Promise.all([sync.commitMerge(review, source), sync.commitMerge(review, source)]);
    expect((await repository.load('alice'))!.revision).toBe(1); expect((await repository.load('alice'))!.data.body.measurements).toHaveLength(1);
  });
  it('rejects a newer cloud revision and preserves unrelated edits', async () => {
    const { sync, repository } = system(); await sync.open('alice', createDefaultData()); const source = sourceData();
    const review = await sync.prepareMerge('alice', source, selection); const remote = (await repository.load('alice'))!;
    await repository.save('alice', remote.revision, { ...remote.data, programs: [] }, 'other-device');
    await expect(sync.commitMerge(review, source)).rejects.toThrow(/account data changed/i);
    expect((await repository.load('alice'))!.data.programs).toHaveLength(0); expect((await repository.load('alice'))!.data.body.measurements).toHaveLength(0);
  });
  it('rejects changed source, switched account, and newly pending local edits', async () => {
    const { sync, repository } = system(); await sync.open('alice', createDefaultData()); const source = sourceData();
    const review = await sync.prepareMerge('alice', source, selection);
    await expect(sync.commitMerge(review, { ...source, programs: [] })).rejects.toThrow(/source data changed/i);
    await expect(sync.commitMerge(review, source, () => false)).rejects.toThrow(/account changed/i);
    await sync.enqueue('alice', { kind: 'deleteProgram', programId: 'starter-program' });
    await expect(sync.commitMerge(review, source)).rejects.toThrow(/pending work/i);
    await expect(sync.prepareMerge('alice', source, selection)).rejects.toThrow(/pending changes/i);
    expect((await repository.load('alice'))!.revision).toBe(0);
  });
  it('fails before upload when recovery snapshots cannot persist', async () => {
    const { sync, repository, store } = system(); await sync.open('alice', createDefaultData()); const source = sourceData();
    const review = await sync.prepareMerge('alice', source, selection);
    vi.spyOn(store, 'prepareRecovery').mockRejectedValueOnce(new Error('Storage full'));
    await expect(sync.commitMerge(review, source)).rejects.toThrow(/storage full/i);
    expect((await repository.load('alice'))!.revision).toBe(0);
  });
  it('reconciles a lost acknowledgement after restart using the durable receipt', async () => {
    const { sync, repository, store, lock, loseNextResponse } = system(); await sync.open('alice', createDefaultData()); const source = sourceData();
    const review = await sync.prepareMerge('alice', source, selection); loseNextResponse();
    await expect(sync.commitMerge(review, source)).rejects.toThrow(/acknowledgement is uncertain/i);
    expect((await store.load('alice'))!.recovery?.[0]?.status).toBe('prepared');
    await expect(sync.enqueue('alice', { kind: 'deleteProgram', programId: 'starter-program' })).rejects.toThrow(/reconcile/i);
    const restarted = new CloudSync(repository, store, lock); await restarted.open('alice', createDefaultData());
    expect((await store.load('alice'))!.recovery?.[0]?.status).toBe('acknowledged');
    await restarted.commitMerge(review, source);
    expect((await repository.load('alice'))!.revision).toBe(1);
  });
  it('retains mappings and operation receipts beyond the recent-mutation window', async () => {
    const { sync, repository } = system(); await sync.open('alice', createDefaultData()); const source = sourceData();
    const review = await sync.prepareMerge('alice', source, selection); await sync.commitMerge(review, source);
    for (let i = 0; i < 102; i++) { const remote = (await repository.load('alice'))!; await repository.save('alice', remote.revision, remote.data, `later-${i}`); }
    expect((await repository.load('alice'))!.recentMutationIds).not.toContain(review.operationId);
    await sync.commitMerge(review, source);
    expect((await repository.load('alice'))!.data.body.measurements).toHaveLength(1);
  });
  it('does not expose an account cache as another account’s data', async () => {
    const { sync, store } = system(); await sync.open('alice', sourceData()); await sync.open('bob', createDefaultData());
    expect((await sync.view('bob'))!.data.body.measurements).toHaveLength(0);
    expect((await store.load('bob'))!.recovery).toBeUndefined();
  });
});

describe('atomic conflict resolution', () => {
  async function conflicted() {
    const result = system(); const { sync, repository } = result; await sync.open('alice', createDefaultData());
    const program = createDefaultData().programs[0]!;
    await sync.enqueue('alice', { kind: 'saveProgram', program: { ...program, name: 'First local edit' } });
    await sync.enqueue('alice', { kind: 'saveProgram', program: { ...program, name: 'Final local edit' } });
    await sync.enqueue('alice', { kind: 'saveBodyMeasurement', measurement });
    const remote = (await repository.load('alice'))!; await repository.save('alice', remote.revision, { ...remote.data, programs: [{ ...program, name: 'Cloud edit' }] }, 'remote');
    await sync.flush('alice'); return result;
  }
  it.each(['cloud', 'local', 'copy'] as const)('resolves dependent edits with %s and retains unrelated work', async (choice) => {
    const { sync, repository, store } = await conflicted();
    const review = await sync.reviewConflicts('alice'); expect(review.rows[0]!.count).toBe(2);
    await sync.resolveConflicts(review, { 'program:starter-program': choice });
    const remote = (await repository.load('alice'))!;
    expect(remote.data.programs.map((program) => program.name)).toEqual(choice === 'cloud' ? ['Cloud edit'] : choice === 'local' ? ['Final local edit'] : ['Cloud edit', 'Final local edit']);
    expect(remote.data.body.measurements).toEqual([measurement]); expect((await store.load('alice'))!.pending).toHaveLength(0);
    expect(remote.revision).toBe(2);
  });
  it('rejects stale conflict choices when new local edits arrive', async () => {
    const { sync, store } = await conflicted(); const review = await sync.reviewConflicts('alice');
    await sync.enqueue('alice', { kind: 'deleteBodyMeasurement', measurementId: 'm' });
    await expect(sync.resolveConflicts(review, {})).rejects.toThrow(/changed/i);
    expect((await store.load('alice'))!.pending).toHaveLength(4);
  });
  it('reconciles lost resolution responses without replaying dependent mutations', async () => {
    const { sync, repository, store, loseNextResponse } = await conflicted(); const review = await sync.reviewConflicts('alice'); loseNextResponse();
    await expect(sync.resolveConflicts(review, { 'program:starter-program': 'local' })).rejects.toThrow(/uncertain/i);
    await sync.flush('alice');
    expect((await store.load('alice'))!.pending).toHaveLength(0); expect((await repository.load('alice'))!.revision).toBe(2);
  });
});

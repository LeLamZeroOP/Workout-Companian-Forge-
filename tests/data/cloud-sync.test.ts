import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { CloudRepository, type CloudDocumentRow, type DocumentGateway } from '../../src/data/cloudRepository';
import { CloudSync } from '../../src/data/cloudSync';
import { OfflineStore } from '../../src/data/offlineStore';

function testSystem() {
  const rows = new Map<string, CloudDocumentRow>();
  const gateway: DocumentGateway = {
    async read(id) { return rows.get(id) ?? null; },
    async insert(row) { if (rows.has(row.user_id)) return false; rows.set(row.user_id, structuredClone(row)); return true; },
    async compareAndSwap(row, revision) { if (rows.get(row.user_id)?.revision !== revision) return false; rows.set(row.user_id, structuredClone(row)); return true; },
  };
  const repository = new CloudRepository(gateway);
  const store = new OfflineStore(`forge-test-${crypto.randomUUID()}`);
  return { rows, repository, store, sync: new CloudSync(repository, store) };
}

describe('CloudSync', () => {
  it('persists offline work and uploads it on reconnect', async () => {
    const { repository, store, sync } = testSystem();
    await sync.open('alice', createDefaultData());
    await sync.enqueue('alice', { kind: 'deleteProgram', programId: 'starter-program' });
    expect((await store.load('alice'))?.pending).toHaveLength(1);
    const reloaded = new CloudSync(repository, store);
    expect((await reloaded.view('alice'))?.data.programs).toHaveLength(0);
    await reloaded.flush('alice');
    expect((await store.load('alice'))?.pending).toHaveLength(0);
    expect((await repository.load('alice'))?.data.programs).toHaveLength(0);
  });

  it('rebases a different record but holds a same-record conflict', async () => {
    const { repository, store, sync } = testSystem();
    await sync.open('alice', createDefaultData());
    await sync.enqueue('alice', { kind: 'deleteProgram', programId: 'starter-program' });
    const remote = (await repository.load('alice'))!;
    await repository.save('alice', remote.revision, { ...remote.data, body: { ...remote.data.body, profile: { birthDate: '1990-01-01', heightCm: 175, equationSex: 'male', activityLevel: 'moderate', goal: 'maintain', targetMode: 'calculated' } } }, 'remote-1');
    await sync.flush('alice');
    expect((await repository.load('alice'))?.data.programs).toHaveLength(0);
    expect((await store.load('alice'))?.pending).toHaveLength(0);

    await sync.enqueue('alice', { kind: 'saveBodyProfile', profile: { birthDate: '1991-01-01', heightCm: 180, equationSex: 'male', activityLevel: 'moderate', goal: 'maintain', targetMode: 'calculated' } });
    const latest = (await repository.load('alice'))!;
    await repository.save('alice', latest.revision, { ...latest.data, body: { ...latest.data.body, profile: { ...latest.data.body.profile!, heightCm: 190 } } }, 'remote-2');
    await sync.flush('alice');
    expect((await store.load('alice'))?.pending[0]?.status).toBe('conflict');
    expect((await repository.load('alice'))?.data.body.profile?.heightCm).toBe(190);
  });

  it('recognizes a lost response without duplicating the mutation', async () => {
    const { repository, store, sync } = testSystem();
    await sync.open('alice', createDefaultData());
    await sync.enqueue('alice', { kind: 'deleteProgram', programId: 'starter-program' });
    const pending = (await store.load('alice'))!.pending[0]!;
    const remote = (await repository.load('alice'))!;
    await repository.save('alice', remote.revision, { ...remote.data, programs: [] }, pending.id);
    await sync.flush('alice');
    expect((await repository.load('alice'))?.revision).toBe(1);
    expect((await store.load('alice'))?.pending).toHaveLength(0);
  });

  it('requires an exact revision for a full backup replacement', async () => {
    const { repository, sync } = testSystem();
    await sync.open('alice', createDefaultData());
    const remote = (await repository.load('alice'))!;
    await repository.save('alice', remote.revision, { ...remote.data, programs: [] }, 'remote-edit');
    await expect(sync.replaceExact('alice', createDefaultData())).rejects.toThrow(/newer cloud/i);
    expect((await repository.load('alice'))?.data.programs).toHaveLength(0);
  });
});

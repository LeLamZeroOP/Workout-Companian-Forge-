import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { CloudRepository, type CloudDocumentRow, type DocumentGateway } from '../../src/data/cloudRepository';

function memoryGateway(): DocumentGateway {
  const rows = new Map<string, CloudDocumentRow>();
  return {
    async read(userId) { return rows.get(userId) ?? null; },
    async insert(row) {
      if (rows.has(row.user_id)) return false;
      rows.set(row.user_id, structuredClone(row));
      return true;
    },
    async compareAndSwap(row, expectedRevision) {
      if (rows.get(row.user_id)?.revision !== expectedRevision) return false;
      rows.set(row.user_id, structuredClone(row));
      return true;
    },
  };
}

describe('CloudRepository', () => {
  it('initializes one private document per account without overwriting another', async () => {
    const repository = new CloudRepository(memoryGateway());
    const first = await repository.initialize('alice', createDefaultData());
    const second = await repository.initialize('bob', createDefaultData());
    expect(first.userId).toBe('alice');
    expect(second.userId).toBe('bob');
    expect(await repository.load('other')).toBeNull();
  });

  it('does not overwrite a concurrently initialized document', async () => {
    const repository = new CloudRepository(memoryGateway());
    await repository.initialize('alice', createDefaultData());
    const different = createDefaultData();
    different.programs = [];
    const existing = await repository.initialize('alice', different);
    expect(existing.data.programs).toHaveLength(1);
  });

  it('rejects stale revisions and recognizes a retried mutation', async () => {
    const repository = new CloudRepository(memoryGateway());
    await repository.initialize('alice', createDefaultData());
    const next = createDefaultData();
    next.programs = [];
    const saved = await repository.save('alice', 0, next, 'mutation-1');
    expect(saved).toMatchObject({ revision: 1, recentMutationIds: ['mutation-1'] });
    expect(await repository.save('alice', 0, createDefaultData(), 'mutation-2')).toEqual({ kind: 'conflict' });
    expect(await repository.save('alice', 0, next, 'mutation-1')).toMatchObject({ revision: 1 });
  });
});

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppDataV2 } from '../domain/models';
import { validateAppData } from './validateAppData';

export interface CloudDocumentRow {
  user_id: string;
  revision: number;
  data: AppDataV2;
  recent_mutation_ids: string[];
  updated_at: string;
}

export interface CloudSnapshot {
  userId: string;
  revision: number;
  data: AppDataV2;
  recentMutationIds: string[];
}

export interface DocumentGateway {
  read(userId: string): Promise<CloudDocumentRow | null>;
  insert(row: CloudDocumentRow): Promise<boolean>;
  compareAndSwap(row: CloudDocumentRow, expectedRevision: number): Promise<boolean>;
}

function snapshot(row: CloudDocumentRow): CloudSnapshot {
  if (!Number.isSafeInteger(row.revision) || row.revision < 0) throw new Error('Invalid cloud revision.');
  if (!Array.isArray(row.recent_mutation_ids) || row.recent_mutation_ids.some((id) => typeof id !== 'string')) throw new Error('Invalid cloud mutation history.');
  return { userId: row.user_id, revision: row.revision, data: validateAppData(row.data), recentMutationIds: row.recent_mutation_ids };
}

export class CloudRepository {
  constructor(private readonly gateway: DocumentGateway) {}

  async load(userId: string): Promise<CloudSnapshot | null> {
    const row = await this.gateway.read(userId);
    return row ? snapshot(row) : null;
  }

  async initialize(userId: string, initialData: AppDataV2): Promise<CloudSnapshot> {
    const existing = await this.load(userId);
    if (existing) return existing;
    const data = validateAppData(initialData);
    const row: CloudDocumentRow = { user_id: userId, revision: 0, data, recent_mutation_ids: [], updated_at: new Date().toISOString() };
    if (await this.gateway.insert(row)) return snapshot(row);
    const concurrent = await this.load(userId);
    if (!concurrent) throw new Error('Cloud document could not be initialized.');
    return concurrent;
  }

  async save(userId: string, expectedRevision: number, nextData: AppDataV2, mutationId: string): Promise<CloudSnapshot | { kind: 'conflict' }> {
    const current = await this.load(userId);
    if (!current) throw new Error('Cloud document is missing.');
    if (current.recentMutationIds.includes(mutationId)) return current;
    if (current.revision !== expectedRevision) return { kind: 'conflict' };
    const row: CloudDocumentRow = {
      user_id: userId,
      revision: current.revision + 1,
      data: validateAppData(nextData),
      recent_mutation_ids: [...current.recentMutationIds, mutationId].slice(-100),
      updated_at: new Date().toISOString(),
    };
    if (!(await this.gateway.compareAndSwap(row, expectedRevision))) return { kind: 'conflict' };
    return snapshot(row);
  }
}

export function createSupabaseDocumentGateway(client: SupabaseClient): DocumentGateway {
  return {
    async read(userId) {
      const { data, error } = await client.from('user_documents').select('user_id, revision, data, recent_mutation_ids, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data as CloudDocumentRow | null;
    },
    async insert(row) {
      const { error } = await client.from('user_documents').insert(row);
      if (error?.code === '23505') return false;
      if (error) throw error;
      return true;
    },
    async compareAndSwap(row, expectedRevision) {
      const { data, error } = await client.from('user_documents')
        .update({ revision: row.revision, data: row.data, recent_mutation_ids: row.recent_mutation_ids, updated_at: row.updated_at })
        .eq('user_id', row.user_id).eq('revision', expectedRevision).select('revision');
      if (error) throw error;
      return Array.isArray(data) && data.length === 1;
    },
  };
}

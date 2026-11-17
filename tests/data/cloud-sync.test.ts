import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { createDefaultData } from '../../src/data/defaults';
import { CloudRepository, type CloudDocumentRow, type DocumentGateway } from '../../src/data/cloudRepository';
import { CloudSync } from '../../src/data/cloudSync';
import { OfflineStore } from '../../src/data/offlineStore';
import { createCustomSession, createSession } from '../../src/domain/workout';
import { addSessionExercise } from '../../src/domain/sessionEditing';

function testSystem() {
  const rows = new Map<string, CloudDocumentRow>();
  const gateway: DocumentGateway = {
    async read(id) { return rows.get(id) ?? null; },
    async insert(row) { if (rows.has(row.user_id)) return false; rows.set(row.user_id, structuredClone(row)); return true; },
    async compareAndSwap(row, revision) { if (rows.get(row.user_id)?.revision !== revision) return false; rows.set(row.user_id, structuredClone(row)); return true; },
  };
  const repository = new CloudRepository(gateway);
  const store = new OfflineStore(`forge-test-${crypto.randomUUID()}`);
  return { rows, repository, store, sync: new CloudSync(repository, store, async (_id, action) => action()) };
}

describe('CloudSync', () => {
  it('queues, restores, and syncs a standalone workout without creating a program', async () => {
    const { repository, store, sync } = testSystem();
    const data = createDefaultData();
    const template = data.programs[0]!.workouts[0]!;
    data.programs = [];
    data.settings.lastSelectedProgramId = null;
    const session = createCustomSession(template, data.exercises, '2026-10-29T05:00:00Z');
    await sync.open('alice', data);
    await sync.enqueue('alice', { kind: 'startWorkout', session, programId: null });
    expect((await store.load('alice'))!.pending).toHaveLength(1);
    expect((await sync.view('alice'))!.data.sessions).toEqual([session]);
    const restored = await sync.open('alice', data);
    expect(restored.data.sessions).toEqual([session]);
    await sync.flush('alice');
    const remote = (await repository.load('alice'))!.data;
    expect(remote.sessions).toEqual([session]);
    expect(remote.programs).toEqual([]);
    expect(remote.settings.lastSelectedProgramId).toBeNull();
    expect((await store.load('alice'))!.pending).toHaveLength(0);
  });
  it.each(['cloud', 'local'] as const)('resolves custom workout creation with the %s conflict choice', async choice => {
    const { repository, store, sync } = testSystem();
    const data = createDefaultData();
    const original = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
    data.sessions = [original];
    const definition = { id: 'conflicted-custom', name: 'My custom row', equipment: 'cable' as const, muscleContribution: { upperBack: 1 }, isCustom: true };
    await sync.open('alice', data);
    await sync.enqueue('alice', { kind: 'updateSession', session: addSessionExercise(original, definition), newExercises: [definition] });
    const remote = (await repository.load('alice'))!;
    await repository.save('alice', remote.revision, { ...data, sessions: [{ ...original, notes: 'Edited on another device' }] }, 'remote-edit');
    await sync.flush('alice');
    const review = await sync.reviewConflicts('alice');
    await sync.resolveConflicts(review, { [`session:${original.id}`]: choice });
    const saved = (await repository.load('alice'))!.data;
    expect(saved.exercises.some(item => item.name === definition.name)).toBe(choice !== 'cloud');
    expect(saved.sessions.some(session => session.exercises.some(item => item.exerciseName === definition.name))).toBe(choice !== 'cloud');
    expect(saved.sessions).toHaveLength(1);
    expect((await store.load('alice'))!.pending).toHaveLength(0);
  });
  it('keeps custom exercise creation and workout addition together through offline replay and sync', async () => {
    const { repository, store, sync } = testSystem();
    const data = createDefaultData();
    const original = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
    data.sessions = [original];
    const newExercise = { id: 'custom-workout', name: 'My cable row', equipment: 'cable' as const, muscleContribution: { upperBack: 1 }, isCustom: true };
    await sync.open('alice', data);
    const mutation = { kind: 'updateSession' as const, session: addSessionExercise(original, newExercise), newExercises: [newExercise] };
    await sync.enqueue('alice', mutation);
    expect((await store.load('alice'))!.pending).toHaveLength(1);
    const view = (await sync.view('alice'))!;
    expect(view.data.exercises.find(item => item.id === newExercise.id)).toEqual(newExercise);
    expect(view.data.sessions[0]!.exercises.at(-1)!.exerciseId).toBe(newExercise.id);
    await sync.flush('alice');
    const remote = (await repository.load('alice'))!;
    expect(remote.data.exercises.find(item => item.id === newExercise.id)).toEqual(newExercise);
    expect(remote.data.sessions).toEqual(view.data.sessions);
    expect((await store.load('alice'))!.pending).toHaveLength(0);
  });
  it('queues history deletion offline and reviews a concurrent edit before deleting remotely', async () => {
    const { repository, store, sync } = testSystem();
    const data = createDefaultData();
    const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-10-08T09:00:00.000Z');
    session.completedAt = '2026-10-08T10:00:00.000Z';
    data.sessions = [session];
    await sync.open('alice', data);
    await sync.enqueue('alice', { kind: 'deleteSession', sessionId: session.id });
    expect((await sync.view('alice'))?.data.sessions).toHaveLength(0);
    const remote = (await repository.load('alice'))!;
    await repository.save('alice', remote.revision, { ...data, sessions: [{ ...session, notes: 'Edited on another device' }] }, 'edit-session');
    await sync.flush('alice');
    expect((await store.load('alice'))?.pending[0]?.status).toBe('conflict');
    expect((await repository.load('alice'))?.data.sessions[0]?.notes).toBe('Edited on another device');
  });

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

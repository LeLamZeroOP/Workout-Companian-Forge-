import { act, renderHook } from '@testing-library/react';
import { useWorkoutDraft } from '../../src/hooks/useWorkoutDraft';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';
import { editSessionExercise, removeSessionExercise, replaceSessionExercise } from '../../src/domain/sessionEditing';
const data = createDefaultData();
const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, '2026-09-23T10:00:00.000Z');
function changed(weight: number) { const draft = structuredClone(session); draft.exercises[0]!.sets[0]!.weightKg = weight; return draft; }
describe('workout drafts', () => {
  it('keeps structural changes pending until saving succeeds and returns a retryable result', () => {
    const save = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const hook = renderHook(() => useWorkoutDraft(session, 'pending-editor', save));
    act(() => hook.result.current.changeCurrent(() => changed(42)));
    let result: boolean | void;
    act(() => { result = hook.result.current.commitCurrent(latest => removeSessionExercise(latest, latest.exercises[0]!.id)); });
    expect(result!).toBe(false);
    expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(42);
    expect(JSON.parse(localStorage.getItem(`forge:workout-draft:pending-editor:${session.id}`)!).draft.exercises).toHaveLength(1);
    act(() => { result = hook.result.current.commitCurrent(latest => removeSessionExercise(latest, latest.exercises[0]!.id)); });
    expect(result!).toBe(true);
    expect(hook.result.current.draft.exercises).toHaveLength(0);
  });

  it('retains entered set values and reports thrown persistence errors', () => {
    const save = vi.fn(() => { throw new Error('Storage unavailable'); });
    const hook = renderHook(() => useWorkoutDraft(session, 'throwing-save', save));
    let saved: boolean | undefined;
    act(() => { saved = hook.result.current.commit(changed(42)); });
    expect(saved).toBe(false);
    expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(42);
    expect(hook.result.current.error).toContain('could not be saved');
  });

  it('clears a device-draft storage error after the saved session acknowledges the same values', () => {
    const hook = renderHook(({ incoming }) => useWorkoutDraft(incoming, 'acknowledged', vi.fn()), { initialProps: { incoming: session } });
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Storage full'); });
    act(() => hook.result.current.commit(changed(42)));
    expect(hook.result.current.error).toContain('could not be saved on this device');
    storage.mockRestore();
    hook.rerender({ incoming: changed(42) });
    expect(hook.result.current.error).toBe('');
    expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(42);
  });

  it('reports persistence rejection while resolving a conflict without mislabeling it as invalid values', () => {
    const save = vi.fn(() => { throw new Error('Storage unavailable'); });
    const hook = renderHook(({ incoming }) => useWorkoutDraft(incoming, 'resolve-rejection', save), { initialProps: { incoming: session } });
    act(() => hook.result.current.changeCurrent(() => changed(35)));
    hook.rerender({ incoming: changed(50) });
    act(() => hook.result.current.resolve(true));
    expect(hook.result.current.error).toContain('could not be saved');
    expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(35);
  });
  it('commits exercise details against the latest unrendered typed input', () => {
    const save = vi.fn();
    const hook = renderHook(() => useWorkoutDraft(session, 'atomic', save));
    act(() => {
      hook.result.current.changeCurrent(latest => {
        const next = structuredClone(latest); next.exercises[0]!.sets[0]!.weightKg = 42; return next;
      });
      hook.result.current.commitCurrent(latest => editSessionExercise(latest, latest.exercises[0]!.id, { restSeconds: 60, notes: 'Test' }));
    });
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ exercises: [expect.objectContaining({ notes: 'Test', restSeconds: 60, sets: expect.arrayContaining([expect.objectContaining({ weightKg: 42 })]) })] }));
  });
  it('restores replacement and removal after remount', () => {
    const save = vi.fn();
    const hook = renderHook(() => useWorkoutDraft(session, 'structural', save));
    const replacement = data.exercises.find(e => e.id !== session.exercises[0]!.exerciseId)!;
    act(() => hook.result.current.commitCurrent(latest => replaceSessionExercise(latest, latest.exercises[0]!.id, replacement)));
    hook.unmount();
    const restored = renderHook(() => useWorkoutDraft(session, 'structural', save));
    expect(restored.result.current.draft.exercises[0]!.exerciseId).toBe(replacement.id);
    act(() => restored.result.current.commitCurrent(latest => removeSessionExercise(latest, latest.exercises[0]!.id)));
    restored.unmount();
    const empty = renderHook(() => useWorkoutDraft(session, 'structural', save));
    expect(empty.result.current.draft.exercises).toEqual([]);
  });
  it('blocks structural mutation during a draft conflict', () => {
    const save = vi.fn();
    const hook = renderHook(({ incoming }) => useWorkoutDraft(incoming, 'conflicted', save), { initialProps: { incoming: session } });
    act(() => hook.result.current.changeCurrent(() => changed(35)));
    hook.rerender({ incoming: changed(50) });
    act(() => hook.result.current.commitCurrent(latest => removeSessionExercise(latest, latest.exercises[0]!.id)));
    expect(hook.result.current.draft.exercises).toHaveLength(1);
    expect(save).not.toHaveBeenCalled();
  });
  it('combines rapid weight and reps edits against the latest draft', () => {
    const hook = renderHook(() => useWorkoutDraft(session, 'rapid-fields', vi.fn()));
    act(() => {
      hook.result.current.changeCurrent(latest => {
        const next = structuredClone(latest);
        next.exercises[0]!.sets[0]!.weightKg = 70;
        return next;
      });
      hook.result.current.changeCurrent(latest => {
        const next = structuredClone(latest);
        next.exercises[0]!.sets[0]!.reps = 12;
        return next;
      });
    });
    expect(hook.result.current.draft.exercises[0]!.sets[0]).toMatchObject({ weightKg: 70, reps: 12 });
  });
  it('recovers typing after remount without uploading each keystroke and isolates accounts', () => {
    const save = vi.fn(); const first = renderHook(() => useWorkoutDraft(session, 'account-a', save));
    act(() => first.result.current.change(changed(42)));
    expect(save).not.toHaveBeenCalled(); first.unmount();
    const restored = renderHook(() => useWorkoutDraft(session, 'account-a', save));
    expect(restored.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(42);
    const other = renderHook(() => useWorkoutDraft(session, 'account-b', save));
    expect(other.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBeNull();
  });
  it('accepts an earlier own acknowledgement without overwriting newer typing', () => {
    const save = vi.fn(); const hook = renderHook(({ incoming }) => useWorkoutDraft(incoming, 'local', save), { initialProps: { incoming: session } });
    act(() => hook.result.current.commit(changed(30)));
    act(() => hook.result.current.change(changed(35)));
    hook.rerender({ incoming: changed(30) });
    expect(hook.result.current.conflict).toBe(false);
    expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(35);
    hook.unmount();
    const restored = renderHook(() => useWorkoutDraft(changed(30), 'local', save));
    expect(restored.result.current.conflict).toBe(false);
    expect(restored.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(35);
  });
  it('requires a decision for an external session change', () => {
    const save = vi.fn(); const hook = renderHook(({ incoming }) => useWorkoutDraft(incoming, 'local', save), { initialProps: { incoming: session } });
    act(() => hook.result.current.change(changed(35)));
    hook.rerender({ incoming: changed(50) });
    expect(hook.result.current.conflict).toBe(true);
    act(() => hook.result.current.commit()); expect(save).not.toHaveBeenCalled();
    act(() => hook.result.current.resolve(false));
    expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(50);
  });
});

it('recognizes an acknowledgement with reordered JSON properties', () => {
  const hook = renderHook(({ incoming }) => useWorkoutDraft(incoming, 'local', vi.fn()), { initialProps: { incoming: session } });
  act(() => hook.result.current.commit(changed(30)));
  act(() => hook.result.current.change(changed(35)));
  hook.rerender({ incoming: Object.fromEntries(Object.entries(changed(30)).reverse()) as typeof session });
  expect(hook.result.current.conflict).toBe(false);
  expect(hook.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(35);
});
it('retains invalid input for correction after reload without sending it to saved data', () => {
  const save = vi.fn(); const hook = renderHook(() => useWorkoutDraft(session, 'local', save));
  act(() => hook.result.current.commit(changed(-10)));
  expect(save).not.toHaveBeenCalled(); expect(hook.result.current.error).toMatch(/invalid/);
  hook.unmount(); const restored = renderHook(() => useWorkoutDraft(session, 'local', save));
  expect(restored.result.current.draft.exercises[0]!.sets[0]!.weightKg).toBe(-10);
});

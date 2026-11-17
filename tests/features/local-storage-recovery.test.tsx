import { act, renderHook, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { useAppData } from '../../src/hooks/useAppData';
import { createDefaultData } from '../../src/data/defaults';
import { createSession } from '../../src/domain/workout';

const key = 'workout-tracker:data';

it('shows a recovery screen instead of editable starter data and resets only after confirmation', async () => {
  const original = '{"version":99}';
  localStorage.setItem(key, original);
  const user = userEvent.setup();
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Your saved data needs attention.' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Start workout' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Reset all local data' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(localStorage.getItem(key)).toBe(original);
  await user.click(screen.getByRole('button', { name: 'Reset all local data' }));
  await user.click(screen.getByRole('button', { name: 'Reset everything' }));
  expect(screen.getByRole('button', { name: 'Create first program' })).toBeInTheDocument();
});

it('preserves unreadable storage until an explicit full replacement', () => {
  const original = '{"version":99,"irreplaceable":"saved records"}';
  localStorage.setItem(key, original);
  const { result } = renderHook(() => useAppData());
  act(() => result.current.deleteProgram('starter-program'));
  expect(localStorage.getItem(key)).toBe(original);
  expect(result.current.loadError).toBeTruthy();
  act(() => result.current.resetData('body'));
  expect(localStorage.getItem(key)).toBe(original);
  act(() => result.current.replaceData(createDefaultData()));
  expect(JSON.parse(localStorage.getItem(key)!).version).toBe(4);
  expect(result.current.loadError).toBeNull();
});

it('refuses a stale edit when another tab has changed storage before its event arrives', () => {
  const initial = createDefaultData();
  localStorage.setItem(key, JSON.stringify(initial));
  const { result } = renderHook(() => useAppData());
  const external = { ...initial, programs: [{ ...initial.programs[0]!, name: 'Changed in another tab' }] };
  localStorage.setItem(key, JSON.stringify(external));
  act(() => result.current.deleteProgram('starter-program'));
  expect(JSON.parse(localStorage.getItem(key)!).programs[0].name).toBe('Changed in another tab');
  expect(result.current.data.programs[0]!.name).toBe('Changed in another tab');
  expect(result.current.error).toMatch(/another tab/);
  act(() => result.current.deleteProgram('starter-program'));
  expect(JSON.parse(localStorage.getItem(key)!).programs).toHaveLength(0);
});

it('receives valid cross-tab updates and never discards its displayed data for corrupt updates', () => {
  const initial = createDefaultData();
  localStorage.setItem(key, JSON.stringify(initial));
  const { result } = renderHook(() => useAppData());
  const external = { ...initial, programs: [] };
  localStorage.setItem(key, JSON.stringify(external));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(external), storageArea: localStorage })));
  expect(result.current.data.programs).toHaveLength(0);
  localStorage.setItem(key, 'bad json');
  act(() => window.dispatchEvent(new StorageEvent('storage', { key, newValue: 'bad json', storageArea: localStorage })));
  expect(result.current.data.programs).toHaveLength(0);
  expect(result.current.loadError).toBeTruthy();
  act(() => result.current.startWorkout('starter-program', 'starter-push'));
  expect(localStorage.getItem(key)).toBe('bad json');
});

it('retains displayed records after a quota failure and supports retry', () => {
  const initial = createDefaultData();
  localStorage.setItem(key, JSON.stringify(initial));
  const { result } = renderHook(() => useAppData());
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new DOMException('Storage full', 'QuotaExceededError'); });
  act(() => result.current.deleteProgram('starter-program'));
  expect(result.current.data.programs).toHaveLength(1);
  expect(result.current.error).toMatch(/Storage full/);
  save.mockRestore();
  act(() => result.current.deleteProgram('starter-program'));
  expect(result.current.data.programs).toHaveLength(0);
});

it('clears an active device draft only after finishing or discarding its saved session', () => {
  const data = createDefaultData();
  const session = createSession(data.programs[0]!, data.programs[0]!.workouts[0]!, data.exercises, new Date().toISOString());
  Object.assign(session.exercises[0]!.sets[0]!, { completed: true, weightKg: 30, reps: 10 });
  data.sessions = [session];
  localStorage.setItem(key, JSON.stringify(data));
  const draftKey = `forge:workout-draft:local:${session.id}`;
  localStorage.setItem(draftKey, 'saved draft');
  const { result } = renderHook(() => useAppData());
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('Storage full'); });
  act(() => result.current.finishWorkout(session.id));
  expect(localStorage.getItem(draftKey)).toBe('saved draft');
  save.mockRestore();
  act(() => result.current.finishWorkout(session.id));
  expect(localStorage.getItem(draftKey)).toBeNull();
  const other = { ...session, id: 'discarded', completedAt: null };
  act(() => result.current.replaceData({ ...data, sessions: [other] }));
  localStorage.setItem('forge:workout-draft:local:discarded', 'draft');
  act(() => result.current.discardWorkout(other.id));
  expect(localStorage.getItem('forge:workout-draft:local:discarded')).toBeNull();
});

it('cleans only local workout drafts on a confirmed workout reset', () => {
  localStorage.setItem('forge:workout-draft:local:old', 'draft');
  localStorage.setItem('forge:workout-draft:account:old', 'account draft');
  const { result } = renderHook(() => useAppData());
  act(() => result.current.resetData('nutrition'));
  expect(localStorage.getItem('forge:workout-draft:local:old')).toBe('draft');
  act(() => result.current.resetData('workouts'));
  expect(localStorage.getItem('forge:workout-draft:local:old')).toBeNull();
  expect(localStorage.getItem('forge:workout-draft:account:old')).toBe('account draft');
});

it('enters recovery when a pre-save read finds corruption before a storage event arrives', () => {
  localStorage.setItem(key, JSON.stringify(createDefaultData()));
  const { result } = renderHook(() => useAppData());
  localStorage.setItem(key, 'unreadable original');
  act(() => result.current.deleteProgram('starter-program'));
  expect(localStorage.getItem(key)).toBe('unreadable original');
  expect(result.current.loadError).toBeTruthy();
  expect(result.current.data.programs[0]!.id).toBe('starter-program');
});

import { useState } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutPreferencesForm } from '../../src/features/settings/WorkoutPreferencesForm';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { useWakeLock } from '../../src/hooks/useWakeLock';
import { useRestAlerts } from '../../src/hooks/useRestAlerts';
import { createDefaultData } from '../../src/data/defaults';
import { applyMutation, getConflictScope, readConflictValue } from '../../src/domain/appMutations';
import type { WorkoutPreferences } from '../../src/domain/models';

const preferences: WorkoutPreferences = { restAlertSound: true, restAlertVibration: true, keepScreenAwake: true };

it('saves each switch immediately without changing program selection or weight units', async () => {
  const saved = vi.fn();
  function Harness() {
    const [settings, setSettings] = useState(preferences);
    return <WorkoutPreferencesForm settings={settings} onSave={next => { saved(next); setSettings(next); }} />;
  }
  render(<Harness />);
  const user = userEvent.setup();
  expect(screen.queryByRole('button', { name: 'Save workout preferences' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('switch', { name: /Sound when rest ends/ }));
  expect(saved).toHaveBeenLastCalledWith({ restAlertSound: false, restAlertVibration: true, keepScreenAwake: true });
  await user.click(screen.getByLabelText(/Keep the screen awake/));
  expect(saved).toHaveBeenLastCalledWith({ restAlertSound: false, restAlertVibration: true, keepScreenAwake: false });
  expect(saved).toHaveBeenCalledTimes(2);
  const data = createDefaultData();
  const mutation = { kind: 'saveWorkoutPreferences' as const, preferences: saved.mock.calls[1]![0] };
  const next = applyMutation(data, mutation);
  expect(next.settings.lastSelectedProgramId).toBe(data.settings.lastSelectedProgramId);
  expect(next.settings.weightUnit).toBe('kg');
  expect(readConflictValue(next, getConflictScope(mutation))).toEqual(saved.mock.calls[1]![0]);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('keeps the previous value and explains when a switch cannot be saved', async () => {
  const onSave = vi.fn(() => false);
  render(<WorkoutPreferencesForm settings={preferences} onSave={onSave} />);
  await userEvent.click(screen.getByLabelText(/Vibrate when rest ends/));
  expect(onSave).toHaveBeenCalledWith({ ...preferences, restAlertVibration: false });
  expect(screen.getByLabelText(/Vibrate when rest ends/)).toBeChecked();
  expect(screen.getByRole('alert')).toHaveTextContent('Vibrate when rest ends could not be saved');
});

it('shows changes from a reset or another tab straight away', () => {
  const onSave = vi.fn();
  const view = render(<WorkoutPreferencesForm settings={{ ...preferences, restAlertSound: false }} onSave={onSave} />);
  expect(screen.getByLabelText(/Sound when rest ends/)).not.toBeChecked();
  view.rerender(<WorkoutPreferencesForm settings={preferences} onSave={onSave} />);
  expect(screen.getByLabelText(/Sound when rest ends/)).toBeChecked();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

it('keeps dialog keyboard focus across parent updates and uses the latest cancel callback', async () => {
  const oldCancel = vi.fn();
  const newCancel = vi.fn();
  const { rerender } = render(<ConfirmDialog title="Test" message="Review" confirmLabel="Confirm" onConfirm={vi.fn()} onCancel={oldCancel} />);
  const confirm = screen.getByRole('button', { name: 'Confirm' });
  confirm.focus();
  rerender(<ConfirmDialog title="Test" message="Updated review" confirmLabel="Confirm" onConfirm={vi.fn()} onCancel={newCancel} />);
  expect(confirm).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  expect(newCancel).toHaveBeenCalledOnce();
  expect(oldCancel).not.toHaveBeenCalled();
});

it('reacquires a released screen wake lock when the workout becomes visible again', async () => {
  const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  const sentinel = { released: false, release: vi.fn().mockResolvedValue(undefined) };
  const request = vi.fn().mockResolvedValue(sentinel);
  const prior = Object.getOwnPropertyDescriptor(navigator, 'wakeLock');
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  try {
    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});
    expect(request).toHaveBeenCalledOnce();
    sentinel.released = true;
    visibility.mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(request).toHaveBeenCalledOnce();
    visibility.mockReturnValue('visible');
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    expect(request).toHaveBeenCalledTimes(2);
    unmount();
    expect(sentinel.release).toHaveBeenCalledOnce();
  } finally {
    visibility.mockRestore();
    if (prior) Object.defineProperty(navigator, 'wakeLock', prior);
    else Reflect.deleteProperty(navigator, 'wakeLock');
  }
});

it('deduplicates rest vibration and handles unavailable or denied sound', () => {
  const vibrate = vi.fn();
  const prior = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
  Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
  try {
    const { result, rerender } = renderHook(({ sound, vibration }) => useRestAlerts(sound, vibration), { initialProps: { sound: false, vibration: true } });
    result.current.prepare();
    result.current.notify('rest-1');
    result.current.notify('rest-1');
    expect(vibrate).toHaveBeenCalledOnce();
    rerender({ sound: true, vibration: false });
    result.current.prepare();
    expect(() => result.current.notify('rest-2')).not.toThrow();
    expect(vibrate).toHaveBeenCalledOnce();
  } finally {
    if (prior) Object.defineProperty(navigator, 'vibrate', prior);
    else Reflect.deleteProperty(navigator, 'vibrate');
  }
});

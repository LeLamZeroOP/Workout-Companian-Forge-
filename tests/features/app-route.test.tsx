import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { useAppRoute } from '../../src/hooks/useAppRoute';

it('opens a linked section and retains it when the app mounts again', async () => {
  window.history.replaceState(null, '', '#history');
  const { unmount } = render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
  await userEvent.tab();
  expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(screen.getByRole('main')).toHaveFocus();
  expect(window.location.hash).toBe('#history');
  await userEvent.click(screen.getByRole('button', { name: 'Programs' }));
  expect(window.location.hash).toBe('#programs');
  unmount();
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Programs' })).toBeInTheDocument();
});

it('follows browser Back and Forward without adding duplicate history entries', async () => {
  const { result } = renderHook(() => useAppRoute());
  act(() => result.current[1]('history'));
  act(() => result.current[1]('body'));
  act(() => result.current[1]('body'));
  act(() => window.history.back());
  await waitFor(() => expect(result.current[0]).toBe('history'));
  act(() => window.history.forward());
  await waitFor(() => expect(result.current[0]).toBe('body'));
});

it('preserves skip-link anchors and unrelated authentication hashes', () => {
  window.history.replaceState(null, '', '#auth-callback');
  const { result } = renderHook(() => useAppRoute());
  expect(result.current[0]).toBe('today');
  expect(window.location.hash).toBe('#auth-callback');
  act(() => result.current[1]('workout'));
  act(() => { window.history.replaceState(null, '', '#main-content'); window.dispatchEvent(new HashChangeEvent('hashchange')); });
  expect(result.current[0]).toBe('workout');
});

import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
const auth = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })) }));
vi.mock('../../src/data/cloudClient', () => ({ cloudClient: { auth }, isCloudConfigured: true }));
import { useCloudAppData } from '../../src/hooks/useCloudAppData';

it('treats an ordinary signed-out session as ready without an authentication error', async () => {
  auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
  const { result } = renderHook(() => useCloudAppData());
  await waitFor(() => expect(result.current.authReady).toBe(true));
  expect(result.current.user).toBeNull(); expect(result.current.error).toBeNull();
});
it('retains a real authentication failure', async () => {
  auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: { message: 'Session storage unavailable' } });
  const { result } = renderHook(() => useCloudAppData());
  await waitFor(() => expect(result.current.error).toBe('Session storage unavailable'));
});

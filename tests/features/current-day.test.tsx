import { act, renderHook } from '@testing-library/react';
import { useCurrentDay } from '../../src/hooks/useCurrentDay';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('changes to the new local day without an unrelated app edit', () => {
  vi.setSystemTime(new Date('2026-10-08T23:59:59.900'));
  const { result } = renderHook(() => useCurrentDay());
  expect(result.current.getDate()).toBe(8);
  act(() => vi.advanceTimersByTime(150));
  expect(result.current.getDate()).toBe(9);
});

it('catches up after a suspended browser returns days later', () => {
  vi.setSystemTime(new Date('2026-10-08T12:00:00'));
  const { result } = renderHook(() => useCurrentDay());
  act(() => { vi.setSystemTime(new Date('2026-10-12T08:00:00')); window.dispatchEvent(new Event('pageshow')); });
  expect(result.current.getDate()).toBe(12);
});

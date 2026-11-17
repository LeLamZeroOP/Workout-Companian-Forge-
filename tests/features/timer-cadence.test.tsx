import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useElapsedTime } from '../../src/hooks/useElapsedTime';
import { RestTimer } from '../../src/features/workout/RestTimer';

describe('workout timer cadence', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime('2026-09-29T10:00:00.750Z'); });
  afterEach(() => { vi.useRealTimers(); });

  it('updates elapsed time at the next true second boundary', () => {
    const { result } = renderHook(() => useElapsedTime('2026-09-29T10:00:00.000Z'));
    expect(result.current.label).toBe('0:00');
    act(() => { vi.advanceTimersByTime(260); });
    expect(result.current.label).toBe('0:01');
  });

  it('updates rest time at the next true second boundary', () => {
    render(<RestTimer rest={{ exerciseId: 'exercise', afterSetId: 'set', startedAt: '2026-09-29T10:00:00.000Z', endsAt: '2026-09-29T10:00:02.000Z', durationSeconds: 2 }} now={() => new Date().toISOString()} onElapsed={vi.fn()} onExtend={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText('0:02')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(260); });
    expect(screen.getByText('0:01')).toBeInTheDocument();
  });

  it('catches up immediately when a suspended page returns', () => {
    const { result } = renderHook(() => useElapsedTime('2026-09-29T10:00:00.000Z'));
    act(() => {
      vi.setSystemTime('2026-09-29T10:00:15.000Z');
      window.dispatchEvent(new Event('pageshow'));
    });
    expect(result.current.label).toBe('0:15');
  });
});

import { useEffect, useState } from 'react';
import type { RestTimerState } from '../domain/models';
import { getRemainingRestSeconds } from '../domain/guidedWorkout';

export function useRestTimer(rest: RestTimerState | null, onElapsed: () => void) {
  const [now, setNow] = useState(() => new Date().toISOString());
  const remaining = rest ? getRemainingRestSeconds(rest, now) : 0;
  useEffect(() => {
    if (!rest) return;
    const refresh = () => setNow(new Date().toISOString());
    refresh();
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [rest]);
  useEffect(() => { if (rest && remaining === 0) onElapsed(); }, [rest, remaining, onElapsed]);
  return remaining;
}

import { useEffect } from 'react';

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let released = false;
    let lock: { release: () => Promise<void> } | undefined;
    void (navigator as Navigator & { wakeLock: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock.request('screen').then((result) => { if (released) void result.release(); else lock = result; }).catch(() => undefined);
    return () => { released = true; if (lock) void lock.release(); };
  }, [enabled]);
}

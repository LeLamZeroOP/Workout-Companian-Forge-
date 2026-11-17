import { useEffect } from 'react';

export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;
    let disposed = false;
    let requesting = false;
    let lock: WakeLockSentinel | undefined;
    async function acquire() {
      if (disposed || requesting || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      requesting = true;
      try {
        const result = await navigator.wakeLock.request('screen');
        if (disposed || document.visibilityState !== 'visible') await result.release();
        else lock = result;
      } catch { /* Screen wake lock is optional and can be denied by the device. */ }
      finally { requesting = false; }
    }
    const resume = () => { void acquire(); };
    resume();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    return () => { disposed = true; document.removeEventListener('visibilitychange', resume); window.removeEventListener('pageshow', resume); if (lock) void lock.release().catch(() => undefined); };
  }, [enabled]);
}

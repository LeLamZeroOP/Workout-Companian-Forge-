import { useEffect, useState } from 'react';

/** Refresh day-based summaries at local midnight and after browser suspension. */
export function useCurrentDay(fixed?: Date): Date {
  const [, setCurrent] = useState(() => fixed ?? new Date());
  useEffect(() => {
    if (fixed) return;
    let timer: number | undefined;
    function refresh() {
      window.clearTimeout(timer);
      if (document.hidden) return;
      const now = new Date();
      setCurrent(now);
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = window.setTimeout(refresh, midnight.getTime() - now.getTime() + 25);
    }
    refresh();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('pageshow', refresh); window.removeEventListener('focus', refresh); };
  }, [fixed]);
  // Parent updates (such as cross-tab saves) can arrive later on the same day.
  // Use the current instant on every render; the timer still refreshes midnight.
  return fixed ?? new Date();
}

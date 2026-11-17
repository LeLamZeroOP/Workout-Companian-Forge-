import { useEffect, useState } from 'react';

export function useElapsedTime(startedAt: string) {
  const [now, setNow] = useState(() => Date.now());
  const startedAtMs = new Date(startedAt).getTime();
  useEffect(() => {
    let timer: number | undefined;
    const refresh = () => {
      if (document.hidden) return;
      const current = Date.now();
      setNow(current);
      const elapsed = Math.max(0, current - startedAtMs);
      const nextSecond = startedAtMs + (Math.floor(elapsed / 1000) + 1) * 1000;
      timer = window.setTimeout(refresh, Math.max(16, nextSecond - current + 10));
    };
    const resume = () => { window.clearTimeout(timer); refresh(); };
    resume();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume); window.removeEventListener('pageshow', resume); };
  }, [startedAtMs]);
  const seconds = Math.max(0, Math.floor((now - startedAtMs) / 1000));
  return { seconds, label: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` };
}

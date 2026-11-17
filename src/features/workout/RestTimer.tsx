import { useEffect, useState } from 'react';
import { Check, Clock3 } from 'lucide-react';
import type { RestTimerState } from '../../domain/models';
import { getRemainingRestSeconds } from '../../domain/guidedWorkout';

export function RestTimer({ rest, now, onElapsed, onExtend, onSkip }: { rest: RestTimerState; now: () => string; onElapsed: () => void; onExtend: () => void; onSkip: () => void }) {
  const [tick, setTick] = useState(now);
  const remaining = getRemainingRestSeconds(rest, tick);
  useEffect(() => {
    let timer: number | undefined;
    const endMs = new Date(rest.endsAt).getTime();
    const refresh = () => {
      if (document.hidden) return;
      const current = now();
      setTick(current);
      const currentMs = new Date(current).getTime();
      const seconds = getRemainingRestSeconds(rest, current);
      if (seconds > 0) {
        const nextSecond = endMs - (seconds - 1) * 1000;
        timer = window.setTimeout(refresh, Math.max(16, nextSecond - currentMs + 10));
      }
    };
    const resume = () => { window.clearTimeout(timer); refresh(); };
    resume();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('pageshow', resume);
    return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume); window.removeEventListener('pageshow', resume); };
  }, [rest, now]);
  useEffect(() => { if (remaining === 0) onElapsed(); }, [remaining, onElapsed]);
  return <section className="rest-panel inline-rest" aria-label="Rest timer" data-ready={remaining === 0 || undefined}>{remaining === 0 ? <Check size={22} aria-hidden="true" /> : <Clock3 size={22} aria-hidden="true" />}<div><p className="eyebrow">{remaining === 0 ? 'Rest complete' : 'Resting'}</p><strong aria-live="off">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong></div><div className="form-actions"><button className="secondary-action" type="button" onClick={onExtend}>+30 sec</button><button data-rest-skip className="primary-action" type="button" onClick={onSkip}>{remaining === 0 ? 'Next set' : 'Skip rest'}</button></div><small>The timer resumes from its saved end time. Alerts while the browser is suspended are not guaranteed.</small></section>;
}

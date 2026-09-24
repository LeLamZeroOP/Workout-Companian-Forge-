import { Clock3 } from 'lucide-react';

export function RestTimer({ remaining, onExtend, onSkip, soundEnabled, onToggleSound }: { remaining: number; onExtend: () => void; onSkip: () => void; soundEnabled: boolean; onToggleSound: () => void }) {
  return <section className="rest-panel" aria-live="polite"><Clock3 size={28}/><p className="eyebrow">Rest</p><strong>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</strong><p>Next set is ready when you are.</p><div className="rest-options"><button className="text-action" type="button" aria-pressed={soundEnabled} onClick={onToggleSound}>Sound {soundEnabled ? 'on' : 'off'}</button></div><div className="form-actions"><button className="secondary-action" type="button" onClick={onExtend}>+30 sec</button><button className="primary-action" type="button" onClick={onSkip}>Skip rest</button></div></section>;
}

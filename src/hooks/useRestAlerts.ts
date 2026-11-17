import { useEffect, useRef } from 'react';

export function useRestAlerts(sound: boolean, vibration: boolean) {
  const context = useRef<AudioContext | null>(null);
  const lastAlert = useRef('');
  useEffect(() => () => { void context.current?.close().catch(() => undefined); }, []);

  function prepare() {
    if (!sound || typeof AudioContext === 'undefined') return;
    try {
      context.current ??= new AudioContext();
      if (context.current.state === 'suspended') void context.current.resume().catch(() => undefined);
    } catch { /* Optional alert; logging and rest timing stay available. */ }
  }

  function notify(restId: string) {
    if (lastAlert.current === restId) return;
    lastAlert.current = restId;
    if (vibration && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate([100, 70, 100]); } catch { /* Unsupported or denied. */ }
    }
    const audio = context.current;
    if (!sound || !audio || audio.state !== 'running') return;
    try {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime;
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.linearRampToValueAtTime(0, start + 0.2);
      oscillator.connect(gain); gain.connect(audio.destination);
      oscillator.start(start); oscillator.stop(start + 0.22);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* A failed alert must not interrupt the next set. */ }
  }

  return { prepare, notify };
}

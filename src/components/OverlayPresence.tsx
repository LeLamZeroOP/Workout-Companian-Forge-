import { useEffect, useState, type ReactNode } from 'react';
import { OverlayPresenceContext } from './overlayPresenceContext';

/** Retain only the visual surface briefly; interaction and focus end immediately. */
export function OverlayPresence({ children }: { children: ReactNode }) {
  const open = Boolean(children);
  const [retained, setRetained] = useState(children);
  const [wasOpen, setWasOpen] = useState(open);
  const [generation, setGeneration] = useState(0);
  if (open && retained !== children) setRetained(children);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setGeneration(generation + 1);
  }
  const animate = document.documentElement.dataset.input === 'pointer' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches !== true;
  useEffect(() => {
    if (open || !retained) return;
    const timer = window.setTimeout(() => setRetained(null), animate ? 150 : 0);
    return () => window.clearTimeout(timer);
  }, [open, retained, animate]);
  const content = open ? children : animate ? retained : null;
  if (!content) return null;
  return <OverlayPresenceContext.Provider key={generation} value={open}><div className="overlay-presence" data-exiting={!open || undefined} aria-hidden={!open || undefined} inert={!open}>{content}</div></OverlayPresenceContext.Provider>;
}

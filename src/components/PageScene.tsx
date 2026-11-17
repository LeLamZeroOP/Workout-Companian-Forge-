import { useLayoutEffect, useRef, type ReactNode } from 'react';

const surfaces = '.activity-band, .session-panel, .overview-panel, .today-compact-card, .program-card, .training-library, .catalog-list, .analytics-card, .body-weight-card, .body-target-card, .macro-metric, .meal-card, .data-card, .data-hero, .reset-section, .more-list, .empty-stage, .start-selection, .start-preview';

/** Stagger the first page entrance, without replaying motion on edits or scrolling. */
export function PageScene({ children }: { children: ReactNode }) {
  const scene = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const cards = scene.current?.querySelectorAll<HTMLElement>(surfaces) ?? [];
    let index = 0;
    for (const card of cards) {
      if (card.parentElement?.closest(surfaces)) continue;
      card.style.setProperty('--entrance-delay', `${Math.min(index++, 4) * 40}ms`);
      card.classList.add('motion-enter');
    }
    // No retained transform: fixed dialogs inside a card keep their viewport origin.
    return () => cards.forEach(card => card.classList.remove('motion-enter'));
  }, []);
  return <div ref={scene} className="page-scene">{children}</div>;
}

import { useLayoutEffect, useRef } from 'react';

/** One interruptible selection surface moves between desktop and mobile destinations. */
export function SelectionHighlight({ value, selector, className }: { value: string; selector: string; className: string }) {
  const highlight = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = highlight.current;
    const navigation = element?.parentElement;
    if (!element || !navigation) return;
    const align = () => {
      const active = navigation.querySelector<HTMLElement>(selector);
      if (!active) { element.style.opacity = '0'; return; }
      element.style.width = `${active.offsetWidth}px`;
      element.style.height = `${active.offsetHeight}px`;
      element.style.transform = `translate3d(${active.offsetLeft}px, ${active.offsetTop}px, 0)`;
      element.style.opacity = '1';
    };
    align();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(align);
    observer?.observe(navigation);
    navigation.querySelectorAll('button').forEach(button => observer?.observe(button));
    return () => observer?.disconnect();
  }, [value, selector]);
  return <span ref={highlight} className={className} aria-hidden="true" />;
}

export function NavigationHighlight({ destination }: { destination: string }) {
  return <SelectionHighlight value={destination} selector="[aria-current='page']" className="nav-highlight" />;
}

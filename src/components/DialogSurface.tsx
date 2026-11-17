import { useContext, useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { OverlayPresenceContext } from './overlayPresenceContext';

const dialogStack: HTMLElement[] = [];
let previousOverflow = '';
const focusable = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], iframe, [tabindex="0"]';
function availableFocus(element: HTMLElement | null) { return element?.isConnected && !element.closest('[inert], [hidden], [aria-hidden="true"]') ? element : null; }

/** One focus, dismissal and scrolling contract for all modal editors. */
export function DialogSurface({ title, eyebrow, closeLabel = 'Close dialog', onClose, dismissDisabled = false, role = 'dialog', describedBy, initialFocusSelector = 'input:not(:disabled), textarea:not(:disabled), button:not(:disabled)', restoreFocusSelector, focusKey, className = '', children, footer }: {
  title: string; eyebrow?: string; closeLabel?: string; onClose: () => void;
  dismissDisabled?: boolean; role?: 'dialog' | 'alertdialog'; describedBy?: string;
  initialFocusSelector?: string; restoreFocusSelector?: string; focusKey?: string;
  className?: string; children: ReactNode; footer?: ReactNode;
}) {
  const titleId = useId();
  const present = useContext(OverlayPresenceContext);
  const dialogRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const closeAction = useRef(onClose);
  const blocked = useRef(dismissDisabled);
  const returnFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => { closeAction.current = onClose; blocked.current = dismissDisabled; }, [onClose, dismissDisabled]);
  useLayoutEffect(() => {
    if (!present) {
      // Restore after DOM mutations too: React can otherwise restore focus to
      // the old input while its inert visual surface is retained for exit.
      const target = availableFocus(returnFocus.current) ?? (restoreFocusSelector ? document.querySelector<HTMLElement>(restoreFocusSelector) : null);
      target?.focus({ preventScroll: true });
      return;
    }
    const dialog = dialogRef.current!;
    const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previous = availableFocus(returnFocus.current) ?? (current && !dialog.contains(current) ? availableFocus(current) : null) ?? (restoreFocusSelector ? document.querySelector<HTMLElement>(restoreFocusSelector) : null);
    returnFocus.current = previous;
    if (!dialogStack.length) { previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    dialogStack.push(dialog);
    const controls = () => [...dialog.querySelectorAll<HTMLElement>(focusable)].filter(element => !element.closest('[inert], [hidden], [aria-hidden="true"]') && !element.matches(':disabled'));
    const isTop = () => dialogStack.at(-1) === dialog;
    const keydown = (event: KeyboardEvent) => {
      if (!isTop() || event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!blocked.current) closeAction.current(); }
      if (event.key !== 'Tab') return;
      const available = controls(); const first = available[0]; const last = available.at(-1);
      if (!first) { event.preventDefault(); dialog.focus({ preventScroll: true }); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    const viewport = window.visualViewport;
    const resize = () => {
      backdropRef.current?.style.setProperty('--dialog-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      backdropRef.current?.style.setProperty('--dialog-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
    };
    resize(); viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize); window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('keydown', keydown);
      viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); window.removeEventListener('resize', resize);
      const index = dialogStack.indexOf(dialog); if (index >= 0) dialogStack.splice(index, 1);
      if (!dialogStack.length) document.body.style.overflow = previousOverflow;
      const target = availableFocus(previous) ?? (restoreFocusSelector ? document.querySelector<HTMLElement>(restoreFocusSelector) : null);
      target?.focus({ preventScroll: true });
    };
  }, [restoreFocusSelector, present]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!present) return;
    if (dismissDisabled) dialog?.focus({ preventScroll: true });
    else (dialog?.querySelector('.dialog-body')?.querySelector<HTMLElement>(initialFocusSelector) ?? dialog?.querySelector<HTMLElement>(initialFocusSelector) ?? dialog)?.focus({ preventScroll: true });
  }, [dismissDisabled, initialFocusSelector, focusKey, present]);
  return createPortal(<div ref={backdropRef} className="dialog-backdrop" data-exiting={!present || undefined} aria-hidden={!present || undefined} inert={!present} role="presentation" onMouseDown={event => { if (present && event.target === event.currentTarget && !dismissDisabled) onClose(); }}>
    <section ref={dialogRef} tabIndex={-1} className={`dialog-surface ${className}`} role={role} aria-modal="true" aria-busy={dismissDisabled || undefined} aria-labelledby={titleId} aria-describedby={describedBy}>
      <header className="dialog-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 id={titleId}>{title}</h2></div><button className="icon-button" type="button" aria-label={closeLabel} disabled={dismissDisabled} onClick={onClose}><X size={18} aria-hidden="true" /></button></header>
      <div className="dialog-body">{children}</div>
      {footer && <footer className="dialog-footer">{footer}</footer>}
    </section>
  </div>, document.body);
}

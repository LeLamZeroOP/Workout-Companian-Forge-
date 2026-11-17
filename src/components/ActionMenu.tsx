import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Ellipsis } from 'lucide-react';

export interface ActionMenuItem { label: string; icon?: ReactNode; tone?: 'danger'; onSelect: () => void }

/** A small "⋯" menu for less frequent card actions. Arrow keys move, Escape and Tab close, focus returns to the trigger. */
export function ActionMenu({ label, items }: { label: string; items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const menuItems = () => [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];

  useEffect(() => {
    if (!open) return;
    menuItems()[0]?.focus({ preventScroll: true });
    const close = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  function dismiss() { setOpen(false); trigger.current?.focus(); }

  return <div className="action-menu">
    <button ref={trigger} type="button" className="icon-button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setOpen(true); } }}><Ellipsis size={17} aria-hidden="true" /></button>
    {open && <div ref={menu} id={id} className="action-menu-list" role="menu" aria-label={label} onKeyDown={event => {
      const all = menuItems();
      const index = all.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); dismiss(); }
      else if (event.key === 'Tab') setOpen(false);
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); all[(index + (event.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length]?.focus(); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); all[event.key === 'Home' ? 0 : all.length - 1]?.focus(); }
    }}>
      {items.map(item => <button key={item.label} type="button" role="menuitem" className={item.tone === 'danger' ? 'is-danger' : undefined} onClick={() => {
        // Return focus first so a dialog opened by the action restores focus to the trigger.
        dismiss();
        item.onSelect();
      }}>{item.icon}{item.label}</button>)}
    </div>}
  </div>;
}

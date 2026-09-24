import { useEffect, useRef } from 'react';

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('keydown', closeOnEscape); previous?.focus(); };
  }, [onCancel]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section ref={dialogRef} className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message" onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <p className="eyebrow">Please confirm</p>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-message" className="muted">{message}</p>
      <div className="form-actions"><button ref={cancelRef} className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="danger-action" type="button" onClick={onConfirm}>{confirmLabel}</button></div>
    </section>
  </div>;
}

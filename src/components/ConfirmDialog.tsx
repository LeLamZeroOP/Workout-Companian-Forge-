import { useEffect, useRef } from 'react';

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <p className="eyebrow">Please confirm</p>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-message" className="muted">{message}</p>
      <div className="form-actions"><button ref={cancelRef} className="secondary-action" type="button" onClick={onCancel}>Cancel</button><button className="danger-action" type="button" onClick={onConfirm}>{confirmLabel}</button></div>
    </section>
  </div>;
}

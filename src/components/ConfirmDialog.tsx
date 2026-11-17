import { useId } from 'react';
import { DialogSurface } from './DialogSurface';

export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel, disabled = false, busy = false, restoreFocusSelector, confirmTone = 'danger', error }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void; disabled?: boolean; busy?: boolean; restoreFocusSelector?: string; confirmTone?: 'danger' | 'primary'; error?: string }) {
  const messageId = useId();
  return <DialogSurface title={title} eyebrow="Please confirm" closeLabel="Close confirmation" onClose={onCancel} dismissDisabled={busy} role="alertdialog" describedBy={messageId} initialFocusSelector="[data-dialog-cancel]" restoreFocusSelector={restoreFocusSelector} className="confirm-dialog" footer={
    <div className="form-actions"><button data-dialog-cancel className="secondary-action" type="button" disabled={busy} onClick={onCancel}>Cancel</button><button className={confirmTone === 'primary' ? 'primary-action' : 'danger-action'} type="button" disabled={disabled || busy} onClick={onConfirm}>{confirmLabel}</button></div>
  }>
    <p id={messageId} className="muted">{message}</p>
    {busy && <p role="status">Saving changes…</p>}
    {error && <p role="alert" className="error-banner">{error}</p>}
  </DialogSurface>;
}

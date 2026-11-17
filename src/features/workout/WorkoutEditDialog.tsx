import type { ReactNode } from 'react';
import { DialogSurface } from '../../components/DialogSurface';

export function WorkoutEditDialog({ title, onCancel, children, saveError }: { title: string; onCancel: () => void; children: ReactNode; saveError?: string }) {
  return <DialogSurface title={title} eyebrow="Current workout" closeLabel="Close workout editor" onClose={onCancel} restoreFocusSelector="[data-workout-edit-trigger]" className="confirm-dialog workout-edit-dialog">
    {saveError && <p role="alert" className="error-banner">{saveError}</p>}{children}
  </DialogSurface>;
}

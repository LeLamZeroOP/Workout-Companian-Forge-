import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { UnsavedFormsContext, type UnsavedForm } from '../hooks/useUnsavedForm';
import { DialogSurface } from './DialogSurface';

export function UnsavedChanges({ children }: { children: (guard: (proceed: () => void) => void) => ReactNode }) {
  const [forms] = useState(() => new Map<object, UnsavedForm>());
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [error, setError] = useState('');
  const descriptionId = useId();
  const guard = useCallback((proceed: () => void) => {
    if ([...forms.values()].some(entry => entry.dirty)) {
      setError('');
      setPending(() => proceed);
    } else proceed();
  }, [forms]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (![...forms.values()].some(entry => entry.dirty)) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [forms]);
  function leave() { setPending(null); pending?.(); }
  function save() {
    for (const entry of [...forms.values()].filter(item => item.dirty)) {
      const form = entry.form.current;
      const submitter = form && [...form.elements].find(element => element instanceof HTMLButtonElement && element.type === 'submit' && !element.matches(':disabled'));
      if (form && submitter instanceof HTMLButtonElement) flushSync(() => form.requestSubmit(submitter));
    }
    if ([...forms.values()].some(entry => entry.dirty)) {
      setError('Your changes have not been saved. Keep editing to check the form or resolve the save error.');
    } else leave();
  }
  return <UnsavedFormsContext.Provider value={forms}>
    {children(guard)}
    {pending && <DialogSurface title="Save your changes?" role="alertdialog" describedBy={descriptionId} onClose={() => setPending(null)} initialFocusSelector="[data-keep-editing]" footer={<div className="form-actions">
      <button data-keep-editing type="button" className="secondary-action" onClick={() => setPending(null)}>Keep editing</button>
      <button type="button" className="text-action danger-text" onClick={leave}>Discard changes</button>
      <button type="button" className="primary-action" onClick={save}>Save and leave</button>
    </div>}>
      <p id={descriptionId}>You have unsaved changes. Save them before moving to another tab?</p>
      {error && <p role="alert" className="error-banner">{error}</p>}
    </DialogSurface>}
  </UnsavedFormsContext.Provider>;
}

import { useLayoutEffect, useRef } from 'react';

export function useValidationFocus(errors: Record<string, string | undefined>) {
  const formRef = useRef<HTMLFormElement>(null);
  useLayoutEffect(() => {
    if (!Object.values(errors).some(Boolean)) return;
    const field = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ?? formRef.current?.querySelector<HTMLElement>('[role="alert"][tabindex="-1"]');
    if (!field) return;
    let parent = field.parentElement;
    while (parent && parent !== formRef.current) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    field.focus();
  }, [errors]);
  return formRef;
}

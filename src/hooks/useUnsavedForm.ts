import { createContext, useContext, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { canonical } from '../domain/canonical';
import { OverlayPresenceContext } from '../components/overlayPresenceContext';

export type UnsavedForm = { form: RefObject<HTMLFormElement | null>; dirty: boolean };
export const UnsavedFormsContext = createContext<Map<object, UnsavedForm> | null>(null);

/** Track editor data, including changes made through buttons and custom controls. */
export function useUnsavedForm(value: unknown, existingRef?: RefObject<HTMLFormElement | null>, dirtyOverride?: boolean) {
  const ownRef = useRef<HTMLFormElement>(null);
  const form = existingRef ?? ownRef;
  const registry = useContext(UnsavedFormsContext);
  const present = useContext(OverlayPresenceContext);
  const [key] = useState(() => ({}));
  const [baseline] = useState(() => canonical(value));
  const dirty = dirtyOverride ?? canonical(value) !== baseline;
  useLayoutEffect(() => {
    if (present) registry?.set(key, { form, dirty });
    return () => { registry?.delete(key); };
  }, [registry, key, form, dirty, present]);
  return form;
}

import { NumberInput } from './NumberInput';
import { useId, type ComponentProps } from 'react';

export function ValidatedField({ label, error, ...input }: ComponentProps<'input'> & { label: string; error?: string }) {
  const id = useId();
  const Input = input.type === 'number' ? NumberInput : 'input';
  return <div className="validated-field"><label htmlFor={id}>{label}</label><Input {...input} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />{error && <p id={`${id}-error`} className="field-error" role="alert">{error}</p>}</div>;
}

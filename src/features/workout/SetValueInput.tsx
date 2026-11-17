import { useEffect, useRef, useState } from 'react';

export function SetValueInput({ label, displayLabel = label, unit, value, field, onChange, onBlur }: {
  label: string;
  displayLabel?: string;
  unit?: string;
  value: number | null;
  field: 'weightKg' | 'reps';
  onChange: (field: 'weightKg' | 'reps', value: string) => void;
  onBlur: () => void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (document.activeElement !== input.current) setText(value === null ? '' : String(value));
  }, [value]);
  return <label><span>{displayLabel}{unit && <small>{unit}</small>}</span><input data-set-entry={field} ref={input} aria-label={label} placeholder="—" autoComplete="off" inputMode={field === 'reps' ? 'numeric' : 'decimal'} type="text" value={text} onChange={event => {
    const next = event.target.value.replace(/^0+(?=\d)/, '');
    setText(next);
    onChange(field, next);
  }} onFocus={event => { if (value === 0) event.currentTarget.select(); }} onBlur={onBlur} /></label>;
}

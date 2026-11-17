import { useEffect, useRef, useState, type ComponentProps } from 'react';

/** Keep the editable text separate from the numeric value held by the form. */
export function NumberInput({ value, onChange, onFocus, onBlur, ...props }: ComponentProps<'input'>) {
  const [text, setText] = useState(String(value ?? ''));
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (document.activeElement !== input.current) setText(String(value ?? ''));
  }, [value]);
  return <input {...props} ref={input} value={text} onFocus={event => {
    if (Number(text) === 0) event.currentTarget.select();
    onFocus?.(event);
  }} onChange={event => {
    const next = event.target.value.replace(/^(-?)0+(?=\d)/, '$1');
    event.target.value = next;
    setText(next);
    onChange?.(event);
  }} onBlur={event => {
    setText(String(value ?? ''));
    onBlur?.(event);
  }} />;
}

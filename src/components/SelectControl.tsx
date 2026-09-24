import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectControlProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  help?: string;
  disabled?: boolean;
}

export function SelectControl({ label, value, options, onChange, help, disabled = false }: SelectControlProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open]);

  function openMenu() {
    if (disabled || options.length === 0) return;
    setActiveIndex(selectedIndex);
    setOpen(true);
  }

  function closeMenu(restoreFocus = true) {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }

  function selectOption(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu();
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index - 1 + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(index);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return <div className="select-control" ref={rootRef}>
    <span className="select-control-label" id={`${id}-label`}>{label}</span>
    <div className="select-control-shell">
      <button
        aria-controls={`${id}-listbox`}
        aria-describedby={help ? `${id}-help` : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-labelledby={`${id}-label`}
        className="select-control-trigger"
        disabled={disabled}
        onClick={() => open ? closeMenu(false) : openMenu()}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span>{selectedOption?.label ?? 'Choose an option'}</span>
        <span aria-hidden="true" className="select-control-chevron"><ChevronDown size={16} /></span>
      </button>
      {open && <div aria-labelledby={`${id}-label`} className="select-control-listbox" id={`${id}-listbox`} role="listbox">
        {options.map((option, index) => <button
          aria-selected={option.value === value}
          className="select-control-option"
          key={option.value}
          onClick={() => selectOption(index)}
          onFocus={() => setActiveIndex(index)}
          onKeyDown={(event) => handleOptionKeyDown(event, index)}
          ref={(node) => { optionRefs.current[index] = node; }}
          role="option"
          tabIndex={index === activeIndex ? 0 : -1}
          type="button"
        >
          <span aria-hidden="true" className="select-control-check">{option.value === value && <Check size={14} strokeWidth={2.4} />}</span>
          <span className="select-control-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        </button>)}
      </div>}
    </div>
    {help && <span className="field-help" id={`${id}-help`}>{help}</span>}
  </div>;
}

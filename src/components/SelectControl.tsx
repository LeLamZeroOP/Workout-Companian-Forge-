import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { OverlayPresence } from './OverlayPresence';

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
  error?: string;
  disabled?: boolean;
  searchable?: boolean;
  displayLabel?: string;
  compact?: boolean;
}

export function SelectControl({ label, value, options, onChange, help, error, disabled = false, searchable = false, displayLabel, compact = false }: SelectControlProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ text: '', time: 0 });
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedOption = options[selectedIndex];
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const visibleOptions = useMemo(() => {
    if (!query) return options;
    const normalizedQuery = query.toLowerCase();
    return options.filter(option => `${option.label} ${option.description ?? ''}`.toLowerCase().includes(normalizedQuery));
  }, [options, query]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  useLayoutEffect(() => {
    if (!open) return;
    const popup = popupRef.current;
    const trigger = triggerRef.current;
    if (!popup || !trigger) return;
    const position = () => {
      const bounds = trigger.getBoundingClientRect();
      const dock = document.querySelector<HTMLElement>('.sidebar');
      const dockBounds = dock?.getBoundingClientRect();
      // The mobile dock is visible chrome, so menus must fit above it.
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop ?? 0;
      const viewportBottom = top + (viewport?.height ?? window.innerHeight);
      const bottom = dock && dockBounds && getComputedStyle(dock).position === 'fixed' && dockBounds.top > window.innerHeight / 2 ? Math.min(dockBounds.top - 8, viewportBottom) : viewportBottom;
      const below = bottom - bounds.bottom - 16;
      const above = bounds.top - top - 16;
      const inline = getComputedStyle(popup).position === 'relative';
      const side = !inline && below < Math.min(240, popup.scrollHeight) && above > below ? 'top' : 'bottom';
      const available = inline ? Math.min(280, (viewport?.height ?? window.innerHeight) * .35) : Math.max(40, Math.min(bottom - top - 32, side === 'top' ? above : below));
      popup.dataset.side = side;
      popup.style.maxHeight = `${available}px`;
      const list = popup.querySelector<HTMLElement>('.select-control-listbox');
      const searchHeight = popup.querySelector<HTMLElement>('.select-search')?.offsetHeight ?? 0;
      if (list) list.style.maxHeight = `${Math.max(24, Math.min(320, available - searchHeight - 16))}px`;
      popup.style.translate = 'none';
      if (!inline) {
        const popupBounds = popup.getBoundingClientRect();
        const shift = popupBounds.top < top + 8 ? top + 8 - popupBounds.top : popupBounds.bottom > bottom - 8 ? bottom - 8 - popupBounds.bottom : 0;
        popup.style.translate = `0 ${shift}px`;
      }
      const focusedOption = list?.querySelector<HTMLElement>(':focus');
      if (focusedOption) revealOption(focusedOption);
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position);
    window.visualViewport?.addEventListener('scroll', position);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position);
      window.visualViewport?.removeEventListener('scroll', position);
    };
  }, [open, visibleOptions.length]);

  useEffect(() => {
    if (!open) return;
    if (activeIndex < 0) searchRef.current?.focus({ preventScroll: true });
    else {
      const option = optionRefs.current[activeIndex];
      option?.focus({ preventScroll: true });
      if (option) revealOption(option);
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open]);

  useEffect(() => {
    const closeOtherMenu = (event: Event) => { if ((event as CustomEvent<string>).detail !== id) setOpen(false); };
    document.addEventListener('forge:select-open', closeOtherMenu);
    return () => document.removeEventListener('forge:select-open', closeOtherMenu);
  }, [id]);

  function openMenu() {
    if (disabled || options.length === 0) return;
    setQuery('');
    typeahead.current = { text: '', time: 0 };
    setActiveIndex(searchable ? -1 : Math.max(0, selectedIndex));
    setOpen(true);
    document.dispatchEvent(new CustomEvent('forge:select-open', { detail: id }));
  }

  function closeMenu(restoreFocus = true) {
    setOpen(false);
    typeahead.current = { text: '', time: 0 };
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }

  function selectOption(index: number) {
    const option = visibleOptions[index];
    if (!option) return;
    onChange(option.value);
    closeMenu();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu();
    } else if (isTypeaheadKey(event)) {
      event.preventDefault();
      openMenu();
      matchTypedOption(event.key, selectedIndex, options);
    }
  }

  function isTypeaheadKey(event: KeyboardEvent<HTMLButtonElement>) {
    return !searchable && !disabled && options.length > 0 && event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.nativeEvent.isComposing;
  }

  function matchTypedOption(key: string, index: number, items: SelectOption[]) {
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
    const time = Date.now();
    const text = (time - typeahead.current.time < 700 ? typeahead.current.text : '') + normalize(key);
    typeahead.current = { text, time };
    const prefix = [...text].every(character => character === text[0]) ? text[0]! : text;
    const start = prefix.length === 1 ? index + 1 : index;
    for (let offset = 0; offset < items.length; offset++) {
      const candidate = (Math.max(0, start) + offset) % items.length;
      if (normalize(items[candidate]!.label.trimStart()).startsWith(prefix)) { setActiveIndex(candidate); return; }
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index + 1) % visibleOptions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index - 1 + visibleOptions.length) % visibleOptions.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(visibleOptions.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOption(index);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    } else if (isTypeaheadKey(event)) {
      event.preventDefault();
      matchTypedOption(event.key, index, visibleOptions);
    }
  }

  return <div className={`select-control${compact ? ' select-control-compact' : ''}`} data-open={open || undefined} ref={rootRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <span className="select-control-label" id={`${id}-label`}>{displayLabel ?? label}</span>
    <div className="select-control-shell">
      <button
        aria-controls={`${id}-listbox`}
        aria-describedby={`${id}-value${help ? ` ${id}-help` : ''}${error ? ` ${id}-error` : ''}`}
        aria-invalid={Boolean(error)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={displayLabel ? label : undefined}
        aria-labelledby={displayLabel ? undefined : `${id}-label`}
        className="select-control-trigger"
        disabled={disabled}
        onClick={() => open ? closeMenu(false) : openMenu()}
        onKeyDown={handleTriggerKeyDown}
        ref={triggerRef}
        type="button"
      >
        <span className="select-control-copy" id={`${id}-value`}><strong>{selectedOption?.label ?? 'Choose an option'}</strong>{selectedOption?.description && <small>{selectedOption.description}</small>}</span>
        <span aria-hidden="true" className="select-control-chevron"><ChevronDown size={16} /></span>
      </button>
      <OverlayPresence>{open && <div className="select-control-popup" ref={popupRef}>
        {searchable && <label className="select-search"><Search size={16} aria-hidden="true" /><input ref={searchRef} aria-label={`Search ${label.toLowerCase()}`} placeholder="Type to find an option…" value={query} onChange={event => { setQuery(event.target.value); setActiveIndex(-1); }} onKeyDown={event => { if (event.key === 'ArrowDown' && visibleOptions.length) { event.preventDefault(); setActiveIndex(0); } if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); } }} /></label>}
        <div aria-label={label} className="select-control-listbox" id={`${id}-listbox`} role="listbox">
        {visibleOptions.map((option, index) => <button
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
        </div>
        {!visibleOptions.length && <p className="select-empty" role="status">No matches. Try another search.</p>}
      </div>}</OverlayPresence>
    </div>
    {help && <span className="field-help" id={`${id}-help`}>{help}</span>}
    {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}

function revealOption(option: HTMLElement) {
  const list = option.parentElement;
  if (!list) return;
  const itemBounds = option.getBoundingClientRect();
  const listBounds = list.getBoundingClientRect();
  if (itemBounds.top < listBounds.top) list.scrollTop += itemBounds.top - listBounds.top;
  else if (itemBounds.bottom > listBounds.bottom) list.scrollTop += itemBounds.bottom - listBounds.bottom;
}

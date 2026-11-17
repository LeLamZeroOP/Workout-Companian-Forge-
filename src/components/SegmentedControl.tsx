import { SelectionHighlight } from './NavigationHighlight';

export function SegmentedControl<T extends string>({ label, value, options, onChange, className = '' }: {
  label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (value: T) => void; className?: string;
}) {
  return <div className={`segmented-control ${className}`} role="group" aria-label={label}>
    <SelectionHighlight value={value} selector="[aria-pressed='true']" className="tab-highlight" />
    {options.map((option, index) => <button type="button" key={option.value} className={value === option.value ? 'active' : ''} aria-pressed={value === option.value} onClick={() => onChange(option.value)} onKeyDown={event => {
      const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!direction && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + direction + options.length) % options.length;
      onChange(options[next]!.value);
      event.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus();
    }}>{option.label}</button>)}
  </div>;
}

import { useId } from 'react';
import { Check } from 'lucide-react';
import type { SelectOption } from './SelectControl';
export function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void }) {
  const name = useId();
  return <fieldset className="choice-group"><legend>{label}</legend><div className="choice-options">{options.map(option => <label className="choice-card" key={option.value}><input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} /><span className="choice-card-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span><Check size={16} className="choice-check" aria-hidden="true" /></label>)}</div></fieldset>;
}

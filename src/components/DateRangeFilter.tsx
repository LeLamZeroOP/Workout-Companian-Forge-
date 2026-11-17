import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { formatDisplayDate } from '../domain/calendar';

/**
 * From/Through dates behind a disclosure. The summary always shows the active range, so a
 * collapsed filter never hides that results are filtered; an invalid range opens it.
 */
export function DateRangeFilter({ from, to, invalid = false, onFrom, onTo }: { from: string; to: string; invalid?: boolean; onFrom: (value: string) => void; onTo: (value: string) => void }) {
  const [open, setOpen] = useState(Boolean(from || to));
  const summary = from || to ? `${from ? formatDisplayDate(from) : 'Any start'} – ${to ? formatDisplayDate(to) : 'today'}` : 'All dates';
  return <details className="date-range-filter" open={open || invalid} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary><CalendarRange size={16} aria-hidden="true" /><span>Date range</span><strong>{summary}</strong></summary>
    <div className="date-range-fields">
      <label>From<input type="date" value={from} max={to || undefined} aria-invalid={invalid || undefined} onChange={event => onFrom(event.target.value)} /></label>
      <label>Through<input type="date" value={to} min={from || undefined} aria-invalid={invalid || undefined} onChange={event => onTo(event.target.value)} /></label>
    </div>
  </details>;
}

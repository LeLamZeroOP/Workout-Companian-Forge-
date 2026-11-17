export function ProgressMeter({ label, value, max, valueText }: { label: string; value: number; max: number; valueText?: string }) {
  const limit = Math.max(1, max);
  const fraction = Math.max(0, Math.min(1, value / limit));
  return <div className="progress-meter"><progress aria-label={label} aria-valuetext={valueText} value={value} max={limit} /><div className="progress-meter-track" aria-hidden="true"><span style={{ transform: `scaleX(${fraction})` }} /></div></div>;
}

import { Fragment, useId } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { BodyMeasurement } from '../../domain/models';
import { CsvExportButton } from '../../components/CsvExportButton';
import { bodyMeasurementsCsv } from '../../domain/recordExports';
import { localDateString } from '../../domain/calendar';

const measurements = [
  ['waistCm', 'Waist'], ['chestCm', 'Chest'], ['hipsCm', 'Hips'],
  ['upperArmCm', 'Upper arm'], ['thighCm', 'Thigh'],
] as const;

function MeasurementRow({ entry, onEdit, onDelete }: { entry: BodyMeasurement; onEdit: (entry: BodyMeasurement) => void; onDelete: (id: string) => void }) {
  const descriptionId = useId();
  const date = new Date(entry.localDate ? `${entry.localDate}T12:00:00` : entry.recordedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  const additional = measurements.filter(([key]) => entry[key] !== null);
  return <Fragment>
    <tr><td>{date}</td><td>{entry.weightKg} kg</td><td>{entry.bodyFatPercent === null ? 'Not logged' : `${entry.bodyFatPercent}%`}</td><td><span className="sr-only" id={descriptionId}>{date}, {entry.weightKg} kg</span><div className="row-actions"><button className="icon-button" type="button" aria-label="Edit measurement" aria-describedby={descriptionId} onClick={() => onEdit(entry)}><Pencil size={16} aria-hidden="true" /></button><button className="icon-button danger-icon" type="button" aria-label="Delete measurement" aria-describedby={descriptionId} onClick={() => onDelete(entry.id)}><Trash2 size={16} aria-hidden="true" /></button></div></td></tr>
    {(additional.length > 0 || entry.notes) && <tr><td colSpan={4}><details className="measurement-details"><summary>Measurements and notes · {date}</summary>{additional.length > 0 && <dl>{additional.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{entry[key]} cm</dd></div>)}</dl>}{entry.notes && <p className="saved-notes">{entry.notes}</p>}</details></td></tr>}
  </Fragment>;
}

export function MeasurementHistory({ entries, onEdit, onDelete }: { entries: BodyMeasurement[]; onEdit: (entry: BodyMeasurement) => void; onDelete: (id: string) => void }) {
  return <section className="analytics-card body-history"><div className="section-heading"><div><p className="eyebrow">All entries</p><h2>Measurement history</h2></div><CsvExportButton label="Export measurements CSV" fileName={`forge-measurements-${localDateString(new Date())}.csv`} disabled={!entries.length} buildCsv={() => bodyMeasurementsCsv(entries)} /></div><div className="table-scroll"><table className="data-table"><thead><tr><th scope="col">Date</th><th scope="col">Weight</th><th scope="col">Body fat</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{entries.map(entry => <MeasurementRow key={entry.id} entry={entry} onEdit={onEdit} onDelete={onDelete} />)}</tbody></table></div></section>;
}

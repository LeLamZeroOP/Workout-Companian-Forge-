import { useRef, useState } from 'react';
import { Download } from 'lucide-react';

export function CsvExportButton({ label, fileName, buildCsv, disabled = false }: { label: string; fileName: string; buildCsv: () => string; disabled?: boolean }) {
  const [error, setError] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  function download() {
    let url: string | undefined;
    const anchor = document.createElement('a');
    try {
      setError('');
      url = URL.createObjectURL(new Blob(['\uFEFF', buildCsv()], { type: 'text/csv;charset=utf-8' }));
      anchor.href = url; anchor.download = fileName; anchor.hidden = true;
      document.body.append(anchor); anchor.click();
    } catch {
      setError('The export could not be downloaded. Please retry.');
    } finally {
      anchor.remove();
      trigger.current?.focus({ preventScroll: true });
      if (url) { const createdUrl = url; window.setTimeout(() => URL.revokeObjectURL(createdUrl), 1000); }
    }
  }
  return <div className="csv-export"><button ref={trigger} className="secondary-action" type="button" disabled={disabled} onClick={download} title="Download saved records for spreadsheets"><Download size={16} aria-hidden="true" />{label}</button>{error && <p className="field-error" role="alert">{error}</p>}</div>;
}

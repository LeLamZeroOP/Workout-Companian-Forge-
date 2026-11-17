import { Component, lazy, Suspense, type ReactNode } from 'react';
import { formatDisplayDate } from '../domain/calendar';
const TrendPlot = lazy(() => import('./TrendPlot'));
class ChartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="chart-placeholder">The chart could not load. Your data table is available below.</p> : this.props.children; }
}

export interface TrendSeries { key: string; label: string; unit: string; singularUnit?: string; integer?: boolean }

/** `zeroBaseline: false` fits the value axis to the data, for measurements such as body weight that never approach zero. */
export interface TrendChartProps { data: Array<Record<string, string | number>>; series: TrendSeries[]; tableLabel: string; sharedAxis?: boolean; zeroBaseline?: boolean }

export function TrendChart({ data, series, tableLabel, sharedAxis = false, zeroBaseline = true }: TrendChartProps) {
  const units = [...new Set(series.map(item => item.unit))];
  return (
    <div className="trend-visual">
      <div className="chart-frame" aria-hidden="true">
        <div className="chart-key">
          {series.length > 1 && <ul className="chart-legend">{series.map((item, index) => <li key={item.key}><span className={index === 0 ? 'chart-swatch' : 'chart-swatch is-secondary'} />{item.label}</li>)}</ul>}
          <span className="chart-units">{sharedAxis || units.length === 1 ? units[0] : units.join(' · ')}</span>
        </div>
        <ChartBoundary><Suspense fallback={<p className="chart-placeholder">Loading chart…</p>}><TrendPlot data={data} series={series} tableLabel={tableLabel} sharedAxis={sharedAxis} zeroBaseline={zeroBaseline} /></Suspense></ChartBoundary>
      </div>
      <div className="table-scroll">
        <table className="data-table" aria-label={tableLabel}>
          <thead><tr><th scope="col">Date</th>{series.map((item) => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead>
          <tbody>{data.map((row) => <tr key={String(row.date)}><td><time dateTime={String(row.date)}>{formatDisplayDate(String(row.date))}</time></td>{series.map((item) => <td key={item.key}>{row[item.key]} {row[item.key] === 1 && item.singularUnit ? item.singularUnit : item.unit}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

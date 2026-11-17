import { Component, lazy, Suspense, type ReactNode } from 'react';
const TrendPlot = lazy(() => import('./TrendPlot'));
class ChartBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className="chart-placeholder">The chart could not load. Your data table is available below.</p> : this.props.children; }
}

export interface TrendSeries { key: string; label: string; unit: string; singularUnit?: string; integer?: boolean }

export interface TrendChartProps { data: Array<Record<string, string | number>>; series: TrendSeries[]; tableLabel: string; sharedAxis?: boolean }

export function TrendChart({ data, series, tableLabel, sharedAxis = false }: TrendChartProps) {
  return (
    <div className="trend-visual">
      <div className="chart-frame" aria-hidden="true">
        <ChartBoundary><Suspense fallback={<p className="chart-placeholder">Loading chart…</p>}><TrendPlot data={data} series={series} tableLabel={tableLabel} sharedAxis={sharedAxis} /></Suspense></ChartBoundary>
      </div>
      <div className="table-scroll">
        <table className="data-table" aria-label={tableLabel}>
          <thead><tr><th scope="col">Date</th>{series.map((item) => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead>
          <tbody>{data.map((row) => <tr key={String(row.date)}><td>{String(row.date)}</td>{series.map((item) => <td key={item.key}>{row[item.key]} {row[item.key] === 1 && item.singularUnit ? item.singularUnit : item.unit}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

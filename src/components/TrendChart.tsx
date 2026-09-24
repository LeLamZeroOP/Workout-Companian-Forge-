import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface TrendSeries { key: string; label: string; unit: string }

export function TrendChart({ data, series, tableLabel }: { data: Array<Record<string, string | number>>; series: TrendSeries[]; tableLabel: string }) {
  return (
    <div className="trend-visual">
      <div className="chart-frame" aria-hidden="true">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e5e5" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: '#686868', fontSize: 12 }} />
            <YAxis yAxisId="primary" tickLine={false} axisLine={false} width={42} tick={{ fill: '#686868', fontSize: 12 }} />
            {series.length > 1 && <YAxis yAxisId="secondary" orientation="right" tickLine={false} axisLine={false} width={48} tick={{ fill: '#686868', fontSize: 12 }} />}
            <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#e5e5e5', boxShadow: '0 2px 10px rgb(0 0 0 / .08)' }} />
            {series.map((item, index) => <Line key={item.key} yAxisId={index === 0 ? 'primary' : 'secondary'} type="monotone" dataKey={item.key} name={`${item.label} (${item.unit})`} stroke={index === 0 ? '#0a0a0a' : '#737373'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="table-scroll">
        <table className="data-table" aria-label={tableLabel}>
          <thead><tr><th scope="col">Date</th>{series.map((item) => <th scope="col" key={item.key}>{item.label}</th>)}</tr></thead>
          <tbody>{data.map((row) => <tr key={String(row.date)}><td>{String(row.date)}</td>{series.map((item) => <td key={item.key}>{row[item.key]} {item.unit}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

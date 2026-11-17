import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendChartProps } from './TrendChart';

export default function TrendPlot({ data, series, sharedAxis }: TrendChartProps) {
  return (<ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.map(row => ({ ...row, timestamp: new Date(`${row.date}T12:00:00`).getTime() }))} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="timestamp" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={value => new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' })} tickLine={false} axisLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            <YAxis yAxisId="primary" allowDecimals={sharedAxis ? !series.every(item => item.integer) : !series[0]?.integer} tickLine={false} axisLine={false} width={42} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
            {series.length > 1 && !sharedAxis && <YAxis yAxisId="secondary" allowDecimals={!series[1]?.integer} orientation="right" tickLine={false} axisLine={false} width={48} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />}
            <Tooltip labelFormatter={value => new Date(Number(value)).toLocaleDateString()} contentStyle={{ borderRadius: 10, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 2px 10px rgb(0 0 0 / .08)' }} />
            {series.map((item, index) => <Line key={item.key} yAxisId={index === 0 || sharedAxis ? 'primary' : 'secondary'} type="linear" isAnimationActive={false} dataKey={item.key} name={`${item.label} (${item.unit})`} stroke={index === 0 ? 'var(--accent)' : 'var(--chart-secondary)'} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
          </LineChart>
        </ResponsiveContainer>);
}

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TrendChartProps } from './TrendChart';
import { formatDisplayDate } from '../domain/calendar';

const tick = { fill: 'var(--text-muted)', fontSize: 12 };
// A fitted axis keeps one unit of headroom and lands on whole numbers.
const fitted: [(min: number) => number, (max: number) => number] = [min => Math.floor(min - 1), max => Math.ceil(max + 1)];

export default function TrendPlot({ data, series, sharedAxis, zeroBaseline = true }: TrendChartProps) {
  const domain = zeroBaseline ? undefined : fitted;
  return (<ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.map(row => ({ ...row, timestamp: new Date(`${row.date}T12:00:00`).getTime() }))} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="timestamp" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={value => formatDisplayDate(new Date(value), { year: false })} tickLine={false} axisLine={false} tick={tick} />
            <YAxis yAxisId="primary" domain={domain} allowDecimals={sharedAxis ? !series.every(item => item.integer) : !series[0]?.integer} tickLine={false} axisLine={false} width={42} tick={tick} />
            {series.length > 1 && !sharedAxis && <YAxis yAxisId="secondary" domain={domain} allowDecimals={!series[1]?.integer} orientation="right" tickLine={false} axisLine={false} width={48} tick={tick} />}
            <Tooltip labelFormatter={value => formatDisplayDate(new Date(Number(value)))} contentStyle={{ borderRadius: 10, borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)', boxShadow: '0 2px 10px rgb(0 0 0 / .08)' }} />
            {series.map((item, index) => <Line key={item.key} yAxisId={index === 0 || sharedAxis ? 'primary' : 'secondary'} type="linear" isAnimationActive={false} dataKey={item.key} name={`${item.label} (${item.unit})`} stroke={index === 0 ? 'var(--accent)' : 'var(--chart-secondary)'} strokeWidth={2} strokeDasharray={index === 0 ? undefined : '5 4'} dot={{ r: 3 }} activeDot={{ r: 5 }} />)}
          </LineChart>
        </ResponsiveContainer>);
}

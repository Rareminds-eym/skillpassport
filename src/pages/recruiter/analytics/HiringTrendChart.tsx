import { Area, CartesianGrid, ComposedChart, Bar, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartType } from './model';

export interface TrendPoint { period: string; hires: number }

export default function HiringTrendChart({ data, type }: { data: TrendPoint[]; type: ChartType }) {
  return (
    <div className="min-w-0" role="img" aria-label={`Hiring trend ${type} chart. ${data.reduce((sum, point) => sum + point.hires, 0)} hires across ${data.length} periods. Exact values are available under View chart data.`}>
      <ResponsiveContainer width="100%" height={260} minWidth={0}>
        <ComposedChart data={data} margin={{ top: 16, right: 12, bottom: 8, left: -12 }} accessibilityLayer>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickMargin={12} minTickGap={24} />
          <YAxis allowDecimals={false} domain={[0, 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} width={44} />
          <Tooltip formatter={(value: number) => [value, 'Hires']} contentStyle={{ borderRadius: 10, borderColor: '#e5e7eb', fontSize: 13 }} />
          {type === 'line' && <Line type="linear" dataKey="hires" name="Hires" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={false} />}
          {type === 'area' && <Area type="linear" dataKey="hires" name="Hires" stroke="#2563eb" fill="#dbeafe" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />}
          {type === 'column' && <Bar dataKey="hires" name="Hires" fill="#2563eb" maxBarSize={40} radius={[4, 4, 0, 0]} isAnimationActive={false} />}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Hiring Trend Chart Component
 * Line chart showing hiring trends over time
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { HiringTrendPoint } from '../types';

interface HiringTrendChartProps {
  data: HiringTrendPoint[];
}

export function HiringTrendChart({ data }: HiringTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-sm">No hiring trend data available</p>
          <p className="text-xs text-gray-400 mt-1">Data will appear as you make hires</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6B7280"
          style={{ fontSize: '12px' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey="hires"
          stroke="#10B981"
          strokeWidth={3}
          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6 }}
          name="Hires"
        />
        {data.some((d) => d.jobs !== undefined) && (
          <Line
            type="monotone"
            dataKey="jobs"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
            name="Jobs Posted"
            strokeDasharray="5 5"
          />
        )}
        {data.some((d) => d.candidates !== undefined) && (
          <Line
            type="monotone"
            dataKey="candidates"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
            name="Candidates Added"
            strokeDasharray="5 5"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

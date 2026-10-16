/**
 * Trends Analytics Tab Component
 * Displays historical trends with multi-line charts and comparisons
 */

import { useState } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTrendsData } from '../hooks/useTrendsData';

interface TrendsTabProps {
  orgId: string;
}

type TimeGranularity = 'monthly' | 'weekly';

export function TrendsTab({ orgId }: TrendsTabProps) {
  const [granularity, setGranularity] = useState<TimeGranularity>('monthly');
  const { data, isLoading, isError, error } = useTrendsData({ orgId, granularity });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-80 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Trends</h3>
        <p className="text-red-700 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { trendData, timeToHireTrend, monthOverMonth, yearOverYear } = data;

  return (
    <div className="space-y-6">
      {/* Granularity Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Historical Trends</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setGranularity('weekly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              granularity === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setGranularity('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              granularity === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Hiring Velocity Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Hiring Velocity</h3>
        {trendData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p className="text-sm">No trend data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="jobsPosted"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                name="Jobs Posted"
              />
              <Line
                type="monotone"
                dataKey="candidatesAdded"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
                name="Candidates Added"
              />
              <Line
                type="monotone"
                dataKey="hires"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
                name="Hires"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Time to Hire Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Time to Hire Trend</h3>
        {timeToHireTrend.length === 0 || timeToHireTrend.every((d) => d.avg === 0) ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p className="text-sm">No time-to-hire data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={timeToHireTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} allowDecimals={false} label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="max"
                stroke="#EF4444"
                fill="#FEE2E2"
                strokeWidth={1}
                name="Max Time"
              />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="#F59E0B"
                fill="#FEF3C7"
                strokeWidth={2}
                name="Avg Time"
              />
              <Area
                type="monotone"
                dataKey="min"
                stroke="#10B981"
                fill="#D1FAE5"
                strokeWidth={1}
                name="Min Time"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 Lower is better. Track how your hiring speed improves over time.</p>
        </div>
      </div>

      {/* Conversion Rate Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Conversion & Application Rates</h3>
        {trendData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p className="text-sm">No conversion data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} allowDecimals={false} label={{ value: 'Percentage', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="conversionRate" fill="#8B5CF6" name="Conversion Rate %" />
              <Bar dataKey="applicationRate" fill="#3B82F6" name="Application Rate %" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Month-over-Month Comparison */}
      {monthOverMonth.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Month-over-Month Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthOverMonth.map((item) => (
              <div key={item.metric} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{item.metric}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{item.currentValue}</span>
                  <span className="text-sm text-gray-500">vs {item.previousValue}</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    item.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.isPositive ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  {Math.abs(item.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year-over-Year (if available) */}
      {yearOverYear.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Year-over-Year Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {yearOverYear.map((item) => (
              <div key={item.metric} className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{item.metric}</div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{item.currentValue}</span>
                  <span className="text-sm text-gray-500">vs {item.previousValue}</span>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    item.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.isPositive ? (
                    <ArrowTrendingUpIcon className="h-4 w-4" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                  )}
                  {Math.abs(item.change)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Trend Insights</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {trendData.length > 0 && (
            <>
              {trendData[trendData.length - 1]?.hires > 0 && (
                <li>
                  • Latest period had {trendData[trendData.length - 1].hires} hire
                  {trendData[trendData.length - 1].hires !== 1 ? 's' : ''}
                </li>
              )}
              {monthOverMonth.some((m) => m.isPositive && m.metric === 'Hires') && (
                <li>• Hiring is trending upward - great momentum!</li>
              )}
              {monthOverMonth.some((m) => m.isPositive && m.metric === 'Time to Hire') && (
                <li>• Time to hire is improving - hiring process is getting faster</li>
              )}
              {monthOverMonth.some((m) => !m.isPositive && m.metric === 'Conversion Rate') && (
                <li>• Conversion rate declined - review screening criteria</li>
              )}
            </>
          )}
          {trendData.length < 3 && (
            <li>• More data will be available as you continue using the system</li>
          )}
        </ul>
      </div>
    </div>
  );
}

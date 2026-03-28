/**
 * Add-On Analytics Dashboard
 * 
 * Displays analytics for add-on subscriptions including revenue,
 * adoption rates, churn, and feature usage metrics.
 * 
 * @requirement Task 9.1 - Create analytics dashboard
 */

import {
    ArrowDownRight,
    ArrowUpRight,
    DollarSign,
    Package,
    RefreshCw,
    TrendingDown,
    Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import addOnAnalyticsService from '../../services/addOnAnalyticsService';

/**
 * Metric Card Component
 */
const MetricCard = ({ title, value, change, changeType, icon: Icon, loading }) => {
  const isPositive = changeType === 'positive' || (changeType === 'auto' && change >= 0);
  const isNegative = changeType === 'negative' || (changeType === 'auto' && change < 0);
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : isNegative ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : null}
              <span>{Math.abs(change)}% vs last period</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
    </div>
  );
};

/**
 * Revenue Chart Component
 */
const RevenueChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-64 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  const chartData = Object.entries(data || {}).map(([period, info]) => ({
    period,
    revenue: info.revenue || 0
  })).slice(-12);

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
      <div className="h-64 flex items-end gap-2">
        {chartData.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div 
              className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer"
              style={{ height: `${(item.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
              title={`₹${item.revenue.toLocaleString()}`}
            />
            <span className="text-xs text-gray-500 truncate w-full text-center">
              {item.period.slice(-5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Add-On Breakdown Component
 */
const AddOnBreakdown = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const items = Object.entries(data || {}).map(([key, info]) => ({
    feature_key: key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    subscribers: info.count || 0,
    revenue: info.revenue || 0
  }));

  const total = items.reduce((sum, item) => sum + item.subscribers, 0) || 1;
  const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-On Distribution</h3>
      <div className="space-y-4">
        {items.map((item, index) => {
          const percentage = (item.subscribers / total) * 100;
          return (
            <div key={item.feature_key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.name}</span>
                <span className="text-gray-500">{item.subscribers} subscribers</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Churn Analysis Component
 */
const ChurnAnalysis = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Analysis</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-600 font-medium">Monthly Churn</p>
          <p className="text-2xl font-bold text-red-700">{data?.churnRate || 0}%</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-600 font-medium">Retention Rate</p>
          <p className="text-2xl font-bold text-green-700">{data?.retentionRate || 0}%</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">New Activations</p>
          <p className="text-lg font-semibold text-gray-900">{data?.newActivations || 0}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">Cancellations</p>
          <p className="text-lg font-semibold text-gray-900">{data?.cancellations || 0}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Feature Usage Component
 */
const FeatureUsage = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">Total Events</span>
          <span className="font-semibold text-blue-900">{data?.totalEvents || 0}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
          <span className="text-sm text-purple-700">Unique Users</span>
          <span className="font-semibold text-purple-900">{data?.uniqueUsers || 0}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-sm text-green-700">Conversion Rate</span>
          <span className="font-semibold text-green-900">{data?.conversionRate || 0}%</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
          <span className="text-sm text-orange-700">Upgrade Prompts</span>
          <span className="font-semibold text-orange-900">{data?.upgradePromptShown || 0}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Analytics Dashboard Component
 */
const AddOnAnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [revenueData, setRevenueData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [adoptionData, setAdoptionData] = useState(null);
  const [usageData, setUsageData] = useState(null);

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const getDateRange = (range) => {
    const end = new Date();
    const start = new Date();
    switch (range) {
      case '7d': start.setDate(start.getDate() - 7); break;
      case '30d': start.setDate(start.getDate() - 30); break;
      case '90d': start.setDate(start.getDate() - 90); break;
      case '1y': start.setFullYear(start.getFullYear() - 1); break;
      default: start.setDate(start.getDate() - 30);
    }
    return { startDate: start, endDate: end };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange(dateRange);

      const [revenue, churn, adoption, usage] = await Promise.all([
        addOnAnalyticsService.getAddOnRevenue({ startDate, endDate, groupBy: 'day' }),
        addOnAnalyticsService.getChurnRate(null, { startDate, endDate }),
        addOnAnalyticsService.getAdoptionMetrics(),
        addOnAnalyticsService.getFeatureUsage(null, { startDate, endDate })
      ]);

      if (revenue.success) setRevenueData(revenue.data);
      if (churn.success) setChurnData(churn.data);
      if (adoption.success) setAdoptionData(adoption.data);
      if (usage.success) setUsageData(usage.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const metrics = useMemo(() => [
    {
      title: 'Total Revenue',
      value: `₹${(revenueData?.totalRevenue || 0).toLocaleString()}`,
      change: 12.5,
      changeType: 'positive',
      icon: DollarSign
    },
    {
      title: 'Active Subscriptions',
      value: adoptionData?.totalActiveEntitlements || 0,
      change: 8.3,
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'Bundle Adoption',
      value: `${adoptionData?.bundleVsIndividualRatio || 0}%`,
      change: 5.2,
      changeType: 'positive',
      icon: Package
    },
    {
      title: 'Churn Rate',
      value: `${churnData?.churnRate || 0}%`,
      change: -2.1,
      changeType: 'negative',
      icon: TrendingDown
    }
  ], [revenueData, adoptionData, churnData]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add-On Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor add-on subscription performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            {dateRangeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueData?.revenueByPeriod} loading={loading} />
        <AddOnBreakdown data={revenueData?.revenueByFeature} loading={loading} />
      </div>

      {/* Analysis Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChurnAnalysis data={churnData} loading={loading} />
        <FeatureUsage data={usageData} loading={loading} />
      </div>

      {/* Top Add-Ons Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Add-Ons</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Add-On</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Subscribers</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Monthly</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Annual</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Bundle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-gray-100">
                    <td colSpan={5} className="py-4 px-4">
                      <div className="h-6 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (
                (adoptionData?.topAddOns || []).map((addOn, index) => (
                  <tr key={addOn.featureKey} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{addOn.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">{addOn.activeSubscribers}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{addOn.monthlySubscribers}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{addOn.annualSubscribers}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{addOn.bundleSubscribers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddOnAnalyticsDashboard;

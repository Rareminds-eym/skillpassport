/**
 * Overview Tab Component
 * Displays key metrics, pipeline funnel, hiring trends, and action items
 */

import {
  BriefcaseIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { MetricCard, MetricCardGrid, MetricCardSkeleton } from '../components/MetricCard';
import { PipelineFunnelChart } from '../components/PipelineFunnelChart';
import { HiringTrendChart } from '../components/HiringTrendChart';
import { useOverviewData } from '../hooks/useOverviewData';

interface OverviewTabProps {
  orgId: string;
}

export function OverviewTab({ orgId }: OverviewTabProps) {
  const { data, isLoading, isError, error } = useOverviewData({ orgId });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Key Metrics Loading */}
        <MetricCardGrid columns={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </MetricCardGrid>

        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-80 bg-gray-200 rounded" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-80 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
      ? error 
      : JSON.stringify(error, null, 2);
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-red-700 mb-2 text-sm max-w-2xl mx-auto">{errorMessage}</p>
        <p className="text-red-600 text-xs mb-4">
          The analytics API endpoint may not be deployed yet. Please check the Functions deployment.
        </p>
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

  const { metrics, pipelineFunnel, hiringTrend, actionItems, quickStats } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h2>
        <MetricCardGrid columns={4}>
          <MetricCard
            title="Active Jobs"
            value={metrics.activeJobs.count}
            icon={BriefcaseIcon}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            trend={metrics.activeJobs.trend}
          />

          <MetricCard
            title="Total Pipeline"
            value={metrics.totalPipeline.count}
            icon={UsersIcon}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            trend={metrics.totalPipeline.trend}
            subtitle="Active candidates"
          />

          <MetricCard
            title="Hires This Period"
            value={metrics.hiresThisMonth.count}
            icon={CheckCircleIcon}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            trend={metrics.hiresThisMonth.trend}
          />

          <MetricCard
            title="Avg Time to Hire"
            value={`${metrics.avgTimeToHire.days} days`}
            icon={ClockIcon}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            trend={metrics.avgTimeToHire.trend}
          />
        </MetricCardGrid>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Pipeline Funnel</h3>
          <PipelineFunnelChart data={pipelineFunnel} />
        </div>

        {/* Hiring Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Hiring Trend (6 Months)</h3>
          <HiringTrendChart data={hiringTrend} />
        </div>
      </div>

      {/* Action Items & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            Needs Attention
          </h3>
          {actionItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">All caught up! No actions needed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Severity: <span className="font-medium capitalize">{item.severity}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-700">{item.count}</div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Stats</h3>
          
          {/* Jobs by Status */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Jobs by Status</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-700 mb-1">Active</div>
                <div className="text-xl font-bold text-green-900">
                  {quickStats.jobsByStatus.active}
                </div>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs text-yellow-700 mb-1">Draft</div>
                <div className="text-xl font-bold text-yellow-900">
                  {quickStats.jobsByStatus.draft}
                </div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="text-xs text-gray-700 mb-1">Closed</div>
                <div className="text-xl font-bold text-gray-900">
                  {quickStats.jobsByStatus.closed}
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs text-blue-700 mb-1">Paused</div>
                <div className="text-xl font-bold text-blue-900">
                  {quickStats.jobsByStatus.paused}
                </div>
              </div>
            </div>
          </div>

          {/* Top Department */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Top Hiring Department</h4>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-700">
                {quickStats.topDepartment.name}
              </div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {quickStats.topDepartment.count} jobs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

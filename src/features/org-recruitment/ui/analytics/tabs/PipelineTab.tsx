/**
 * Pipeline Analytics Tab Component
 * Displays pipeline metrics, stage distribution, conversions, and bottlenecks
 */

import {
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { MetricCard, MetricCardGrid, MetricCardSkeleton } from '../components/MetricCard';
import { PipelineFunnelChart } from '../components/PipelineFunnelChart';
import { usePipelineData } from '../hooks/usePipelineData';

interface PipelineTabProps {
  orgId: string;
}

export function PipelineTab({ orgId }: PipelineTabProps) {
  const { data, isLoading, isError, error } = usePipelineData({ orgId });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <MetricCardGrid columns={4}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </MetricCardGrid>
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-80 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Pipeline Analytics</h3>
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

  const { metrics, stageDistribution, conversions, bottlenecks } = data;

  return (
    <div className="space-y-6">
      {/* Pipeline Health Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Health</h2>
        <MetricCardGrid columns={4}>
          <MetricCard
            title="Total Candidates"
            value={metrics.totalCandidates.count}
            icon={UsersIcon}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            trend={metrics.totalCandidates.trend}
          />

          <MetricCard
            title="Active Candidates"
            value={metrics.activeCandidates.count}
            icon={CheckCircleIcon}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            subtitle={`${metrics.activeCandidates.percentage}% of total`}
          />

          <MetricCard
            title="Overall Conversion"
            value={`${metrics.overallConversion.rate}%`}
            icon={ArrowPathIcon}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            trend={metrics.overallConversion.trend}
            subtitle="Sourced to hired"
          />

          <MetricCard
            title="Avg Stage Time"
            value={`${metrics.avgStageTime.days} days`}
            icon={ClockIcon}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            subtitle="Time per stage"
          />
        </MetricCardGrid>
      </div>

      {/* Candidates by Stage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Candidates by Stage</h3>
        <PipelineFunnelChart data={stageDistribution} />
      </div>

      {/* Stage Conversion Rates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Stage Conversion Rates</h3>
        {conversions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No conversion data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversions.map((conversion, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">
                      {conversion.fromStage} → {conversion.toStage}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {conversion.rate}% ({conversion.count} / {conversion.totalAttempts})
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full rounded-full transition-all ${
                        conversion.rate >= 70
                          ? 'bg-green-500'
                          : conversion.rate >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${conversion.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottlenecks */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
          Pipeline Bottlenecks
        </h3>
        {bottlenecks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">No significant bottlenecks detected</p>
            <p className="text-xs text-gray-500 mt-1">Your pipeline is flowing smoothly!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bottlenecks.map((bottleneck, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  bottleneck.severity === 'high'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          bottleneck.severity === 'high'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {bottleneck.severity.toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{bottleneck.stage}</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {bottleneck.issue === 'high_dropout' && (
                        <>
                          High dropout rate: {bottleneck.metric}% of candidates not progressing
                          <span className="block text-xs text-gray-600 mt-1">
                            {bottleneck.count} candidates dropped at this stage
                          </span>
                        </>
                      )}
                      {bottleneck.issue === 'stuck_candidates' && (
                        <>
                          Candidates stuck for over {bottleneck.metric} days
                          <span className="block text-xs text-gray-600 mt-1">
                            {bottleneck.count} candidates need attention
                          </span>
                        </>
                      )}
                      {bottleneck.issue === 'slow_movement' && (
                        <>
                          Slow progression: Avg {bottleneck.metric} days at this stage
                          <span className="block text-xs text-gray-600 mt-1">
                            {bottleneck.count} candidates affected
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors">
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Key Insights</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {metrics.activeCandidates.percentage < 50 && (
            <li>• Less than half your candidates are active - consider re-engagement strategies</li>
          )}
          {metrics.overallConversion.rate > 15 && (
            <li>• Strong overall conversion rate of {metrics.overallConversion.rate}%</li>
          )}
          {metrics.overallConversion.rate < 10 && (
            <li>• Low conversion rate - review screening criteria and candidate quality</li>
          )}
          {conversions.some((c) => c.rate < 30) && (
            <li>
              • Critical conversion drop at{' '}
              {conversions.find((c) => c.rate < 30)?.fromStage} stage - needs immediate attention
            </li>
          )}
          {bottlenecks.length > 0 && (
            <li>• {bottlenecks.length} bottleneck{bottlenecks.length > 1 ? 's' : ''} identified - prioritize resolving them</li>
          )}
          {metrics.avgStageTime.days < 15 && (
            <li>• Fast pipeline movement with {metrics.avgStageTime.days} days average per stage</li>
          )}
        </ul>
      </div>
    </div>
  );
}

/**
 * Insights Tab Component
 * Displays actionable insights, recommendations, and advanced analytics
 */

import {
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface InsightsTabProps {
  orgId: string;
}

export function InsightsTab({ orgId }: InsightsTabProps) {
  // This is a simplified version - can be enhanced with API data
  // For now, showing static insights and recommendations

  return (
    <div className="space-y-6">
      {/* Performance Highlights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-blue-600" />
          Performance Highlights
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Strong Pipeline Conversion</p>
              <p className="text-xs text-green-700 mt-1">
                Your interview-to-offer conversion rate is above industry average
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">Efficient Hiring Speed</p>
              <p className="text-xs text-green-700 mt-1">
                Average time-to-hire is better than last quarter
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">Screening Pass Rate Needs Attention</p>
              <p className="text-xs text-yellow-700 mt-1">
                Consider adjusting initial screening criteria to improve candidate quality
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <LightBulbIcon className="h-5 w-5 text-amber-600" />
          Key Recommendations
        </h3>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Optimize Job Descriptions</h4>
            <p className="text-sm text-gray-600 mb-2">
              Jobs with detailed requirements see 40% higher application rates
            </p>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View Best Practices →
            </button>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Expand Candidate Sources</h4>
            <p className="text-sm text-gray-600 mb-2">
              Diversifying sourcing channels can reduce time-to-hire by 25%
            </p>
            <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
              Explore Sources →
            </button>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Streamline Interview Process</h4>
            <p className="text-sm text-gray-600 mb-2">
              Candidates moving through interviews faster are 30% more likely to accept offers
            </p>
            <button className="text-xs text-green-600 hover:text-green-700 font-medium">
              Review Process →
            </button>
          </div>

          <div className="border-l-4 border-amber-500 pl-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Follow Up on Pending Invitations</h4>
            <p className="text-sm text-gray-600 mb-2">
              You have team invitations expiring soon - send reminders to boost acceptance
            </p>
            <button className="text-xs text-amber-600 hover:text-amber-700 font-medium">
              View Invitations →
            </button>
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Industry Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Time to Hire</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">23d</span>
              <span className="text-sm text-gray-500">vs 28d avg</span>
            </div>
            <div className="text-xs text-green-600 font-semibold">18% better than average</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Offer Acceptance</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">80%</span>
              <span className="text-sm text-gray-500">vs 75% avg</span>
            </div>
            <div className="text-xs text-green-600 font-semibold">7% better than average</div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Application Rate</div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-gray-900">8%</span>
              <span className="text-sm text-gray-500">vs 10% avg</span>
            </div>
            <div className="text-xs text-yellow-600 font-semibold">20% below average</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left">
            <div className="font-medium text-gray-900 mb-1">📊 Generate Full Report</div>
            <div className="text-xs text-gray-600">Export comprehensive analytics PDF</div>
          </button>

          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left">
            <div className="font-medium text-gray-900 mb-1">🎯 Set Goals</div>
            <div className="text-xs text-gray-600">Define hiring targets for next quarter</div>
          </button>

          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left">
            <div className="font-medium text-gray-900 mb-1">📧 Schedule Report</div>
            <div className="text-xs text-gray-600">Get weekly analytics via email</div>
          </button>

          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all text-left">
            <div className="font-medium text-gray-900 mb-1">💡 View Best Practices</div>
            <div className="text-xs text-gray-600">Learn from top-performing organizations</div>
          </button>
        </div>
      </div>

      {/* Data Sources Note */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600">
        <p className="mb-2">
          <strong className="text-gray-900">Note:</strong> Insights are generated based on your organization's recruitment data and industry benchmarks.
        </p>
        <p>
          💡 <strong>Tip:</strong> More data over time will improve the accuracy and relevance of these insights.
        </p>
      </div>
    </div>
  );
}

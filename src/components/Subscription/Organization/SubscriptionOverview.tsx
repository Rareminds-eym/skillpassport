/**
 * SubscriptionOverview Component
 * 
 * Displays active organization subscriptions with seat utilization metrics,
 * quick action buttons, and expiration warnings.
 */

import { AlertTriangle, Calendar, ChevronRight, Clock, Plus, RefreshCw, Settings, Users } from 'lucide-react';
import { memo, useMemo } from 'react';

interface Subscription {
  id: string;
  planName: string;
  totalSeats: number;
  assignedSeats: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'grace_period';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  targetMemberType: 'educator' | 'student' | 'both';
}

interface SubscriptionOverviewProps {
  subscriptions: Subscription[];
  onAddSeats: (subscriptionId: string) => void;
  onManage: (subscriptionId: string) => void;
  onRenew: (subscriptionId: string) => void;
  onViewDetails: (subscriptionId: string) => void;
  onBrowsePlans: () => void;
  isLoading?: boolean;
}

function calculateDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function SubscriptionOverview({
  subscriptions,
  onAddSeats,
  onManage,
  onRenew,
  onViewDetails,
  onBrowsePlans,
  isLoading = false,
}: SubscriptionOverviewProps) {
  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => s.status === 'active' || s.status === 'grace_period'),
    [subscriptions]
  );

  const totalSeats = useMemo(
    () => activeSubscriptions.reduce((sum, s) => sum + s.totalSeats, 0),
    [activeSubscriptions]
  );

  const assignedSeats = useMemo(
    () => activeSubscriptions.reduce((sum, s) => sum + s.assignedSeats, 0),
    [activeSubscriptions]
  );

  const utilizationPercentage = totalSeats > 0 ? Math.round((assignedSeats / totalSeats) * 100) : 0;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (activeSubscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Subscriptions</h3>
        <p className="text-gray-500 mb-4">
          Purchase a subscription to start managing licenses for your organization.
        </p>
        <button 
          onClick={onBrowsePlans}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Browse Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Subscription Overview</h2>
          <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
            {activeSubscriptions.length} Active Plan{activeSubscriptions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold">{totalSeats}</div>
            <div className="text-blue-100 text-sm">Total Seats</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{assignedSeats}</div>
            <div className="text-blue-100 text-sm">Assigned</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{totalSeats - assignedSeats}</div>
            <div className="text-blue-100 text-sm">Available</div>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-blue-100">Seat Utilization</span>
            <span className="font-medium">{utilizationPercentage}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                utilizationPercentage >= 90
                  ? 'bg-red-400'
                  : utilizationPercentage >= 70
                  ? 'bg-yellow-400'
                  : 'bg-green-400'
              }`}
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Subscription Cards */}
      <div className="space-y-4">
        {activeSubscriptions.map((subscription) => {
          const daysRemaining = calculateDaysRemaining(subscription.endDate);
          const utilization = Math.round(
            (subscription.assignedSeats / subscription.totalSeats) * 100
          );
          const isExpiringSoon = daysRemaining <= 30;
          const isGracePeriod = subscription.status === 'grace_period';

          return (
            <div
              key={subscription.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Warning Banner */}
              {(isExpiringSoon || isGracePeriod) && (
                <div
                  className={`px-4 py-2 flex items-center gap-2 text-sm ${
                    isGracePeriod
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  {isGracePeriod
                    ? 'Subscription expired - in grace period'
                    : `Expires in ${daysRemaining} days`}
                </div>
              )}

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{subscription.planName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          subscription.targetMemberType === 'both'
                            ? 'bg-purple-100 text-purple-700'
                            : subscription.targetMemberType === 'educator'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {subscription.targetMemberType === 'both'
                          ? 'All Members'
                          : subscription.targetMemberType === 'educator'
                          ? 'Educators'
                          : 'Students'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onViewDetails(subscription.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="View details"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Seat Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      {subscription.assignedSeats} / {subscription.totalSeats} seats used
                    </span>
                    <span className="font-medium text-gray-900">{utilization}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilization >= 90
                          ? 'bg-red-500'
                          : utilization >= 70
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${utilization}%` }}
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddSeats(subscription.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Seats
                  </button>
                  <button
                    onClick={() => onManage(subscription.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                  {(isExpiringSoon || isGracePeriod) && (
                    <button
                      onClick={() => onRenew(subscription.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors ml-auto"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Renew Now
                    </button>
                  )}
                </div>

                {/* Auto-renew indicator */}
                {subscription.autoRenew && !isExpiringSoon && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Auto-renews on {formatDate(subscription.endDate)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(SubscriptionOverview);

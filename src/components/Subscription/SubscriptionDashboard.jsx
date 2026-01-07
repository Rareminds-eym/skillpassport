/**
 * SubscriptionDashboard Component
 * 
 * Dashboard for managing user's subscription and add-on entitlements.
 * 
 * Features:
 * - Display current plan
 * - List active add-on entitlements
 * - Show renewal dates
 * - Toggle auto-renew per add-on
 * - Cancel add-on functionality
 * - Total monthly/annual cost display
 * 
 * @requirement REQ-5.6 - Subscription Dashboard Component
 * @requirement REQ-7 - Subscription Management
 */

import {
    AlertCircle,
    Calendar,
    Check,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    Package,
    RefreshCw,
    Sparkles,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSubscriptionContext } from '../../context/SubscriptionContext';
import entitlementService from '../../services/entitlementService';

/**
 * Get the base path for subscription routes based on current location
 */
function getSubscriptionBasePath(pathname) {
  if (pathname.startsWith('/student')) return '/student';
  if (pathname.startsWith('/recruitment')) return '/recruitment';
  if (pathname.startsWith('/educator')) return '/educator';
  if (pathname.startsWith('/college-admin')) return '/college-admin';
  if (pathname.startsWith('/school-admin')) return '/school-admin';
  if (pathname.startsWith('/university-admin')) return '/university-admin';
  return ''; // fallback to root
}

/**
 * SubscriptionDashboard - Main dashboard for subscription management
 */
export function SubscriptionDashboard({ className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = getSubscriptionBasePath(location.pathname);
  const {
    subscription,
    userEntitlements,
    activeEntitlements,
    totalAddOnCost,
    isLoadingEntitlements,
    fetchUserEntitlements,
    cancelAddOn,
    isCancelling
  } = useSubscriptionContext();

  const [cancellingId, setCancellingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Handle cancel add-on
  const handleCancel = async (entitlementId) => {
    if (!window.confirm('Are you sure you want to cancel this add-on? You will retain access until the end of your billing period.')) {
      return;
    }

    setCancellingId(entitlementId);
    try {
      await cancelAddOn(entitlementId);
    } catch (error) {
      console.error('Failed to cancel:', error);
    } finally {
      setCancellingId(null);
    }
  };

  // Handle toggle auto-renew
  const handleToggleAutoRenew = async (entitlementId, currentValue) => {
    setTogglingId(entitlementId);
    try {
      await entitlementService.toggleAutoRenew(entitlementId, !currentValue);
      fetchUserEntitlements();
    } catch (error) {
      console.error('Failed to toggle auto-renew:', error);
    } finally {
      setTogglingId(null);
    }
  };

  // Group entitlements by status
  const activeEnts = userEntitlements.filter(e => e.status === 'active');
  const gracePeriodEnts = userEntitlements.filter(e => e.status === 'grace_period');
  const cancelledEnts = userEntitlements.filter(e => e.status === 'cancelled');

  if (isLoadingEntitlements) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your plan and add-ons</p>
        </div>
        <button
          onClick={() => navigate(`${basePath}/subscription/add-ons`)}
          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Browse Add-ons
        </button>
      </div>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Current Plan</p>
            <h2 className="text-2xl font-bold mt-1">
              {subscription?.plan_name || 'Free Plan'}
            </h2>
            {subscription?.current_period_end && (
              <p className="text-indigo-200 text-sm mt-2 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-indigo-200 text-sm">Monthly Cost</p>
            <p className="text-3xl font-bold">
              ₹{subscription?.plan_amount || 0}
            </p>
          </div>
        </div>

        {subscription && (
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <span className="text-sm text-indigo-200">
              Status: <span className="text-white font-medium capitalize">{subscription.status}</span>
            </span>
            <button
              onClick={() => navigate('/subscription/plans?mode=upgrade')}
              className="text-sm text-white hover:underline flex items-center gap-1"
            >
              Change Plan
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cost Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <CostCard
          title="Base Plan"
          amount={subscription?.plan_amount || 0}
          period="month"
          icon={CreditCard}
        />
        <CostCard
          title="Add-ons"
          amount={totalAddOnCost.monthly}
          period="month"
          icon={Package}
        />
        <CostCard
          title="Total"
          amount={(subscription?.plan_amount || 0) + totalAddOnCost.monthly}
          period="month"
          icon={DollarSign}
          highlight
        />
      </div>

      {/* Grace Period Warning */}
      {gracePeriodEnts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Payment Required</h3>
            <p className="text-sm text-amber-700 mt-1">
              {gracePeriodEnts.length} add-on(s) are in grace period. Please update your payment method to avoid losing access.
            </p>
          </div>
        </div>
      )}

      {/* Active Add-ons */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Active Add-ons
          <span className="text-sm font-normal text-gray-500">
            ({activeEnts.length + gracePeriodEnts.length})
          </span>
        </h2>

        {activeEnts.length === 0 && gracePeriodEnts.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No active add-ons</p>
            <button
              onClick={() => navigate(`${basePath}/subscription/add-ons`)}
              className="text-indigo-600 hover:underline"
            >
              Browse available add-ons
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...gracePeriodEnts, ...activeEnts].map(entitlement => (
              <EntitlementCard
                key={entitlement.id}
                entitlement={entitlement}
                onCancel={handleCancel}
                onToggleAutoRenew={handleToggleAutoRenew}
                isCancelling={cancellingId === entitlement.id}
                isToggling={togglingId === entitlement.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Cancelled Add-ons */}
      {cancelledEnts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Cancelled (Access Until Expiry)
          </h2>

          <div className="space-y-3">
            {cancelledEnts.map(entitlement => (
              <EntitlementCard
                key={entitlement.id}
                entitlement={entitlement}
                isCancelled
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * CostCard - Displays a cost metric
 */
function CostCard({ title, amount, period, icon: Icon, highlight = false }) {
  return (
    <div className={`
      rounded-xl p-4 border
      ${highlight 
        ? 'bg-indigo-50 border-indigo-200' 
        : 'bg-white border-gray-200'
      }
    `}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${highlight ? 'text-indigo-600' : 'text-gray-400'}`} />
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${highlight ? 'text-indigo-600' : 'text-gray-900'}`}>
          ₹{amount}
        </span>
        <span className="text-gray-500 text-sm">/{period}</span>
      </div>
    </div>
  );
}

/**
 * EntitlementCard - Displays a single entitlement
 */
function EntitlementCard({ 
  entitlement, 
  onCancel, 
  onToggleAutoRenew, 
  isCancelling = false,
  isToggling = false,
  isCancelled = false 
}) {
  const endDate = new Date(entitlement.end_date);
  const daysRemaining = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
  const isGracePeriod = entitlement.status === 'grace_period';

  return (
    <div className={`
      bg-white rounded-lg border p-4
      ${isGracePeriod ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'}
      ${isCancelled ? 'opacity-75' : ''}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Status Indicator */}
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isGracePeriod 
              ? 'bg-amber-100 text-amber-600' 
              : isCancelled 
                ? 'bg-gray-100 text-gray-400'
                : 'bg-green-100 text-green-600'
            }
          `}>
            {isGracePeriod ? (
              <AlertCircle className="w-5 h-5" />
            ) : isCancelled ? (
              <Clock className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 capitalize">
              {entitlement.feature_key?.replace(/_/g, ' ')}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="capitalize">{entitlement.billing_period}</span>
              <span>•</span>
              <span>₹{entitlement.price_at_purchase}/{entitlement.billing_period === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            
            {/* Renewal/Expiry Info */}
            <p className={`text-sm mt-2 ${isGracePeriod ? 'text-amber-600' : 'text-gray-500'}`}>
              {isCancelled ? (
                <>Access until {endDate.toLocaleDateString()}</>
              ) : isGracePeriod ? (
                <>Payment required - {daysRemaining} days remaining</>
              ) : entitlement.auto_renew ? (
                <>Renews {endDate.toLocaleDateString()}</>
              ) : (
                <>Expires {endDate.toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        {!isCancelled && (
          <div className="flex items-center gap-2">
            {/* Auto-renew Toggle */}
            <button
              onClick={() => onToggleAutoRenew?.(entitlement.id, entitlement.auto_renew)}
              disabled={isToggling}
              className={`
                px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1
                ${entitlement.auto_renew 
                  ? 'border-green-200 bg-green-50 text-green-700' 
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }
                ${isToggling ? 'opacity-50' : ''}
              `}
              title={entitlement.auto_renew ? 'Auto-renew is ON' : 'Auto-renew is OFF'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isToggling ? 'animate-spin' : ''}`} />
              {entitlement.auto_renew ? 'Auto' : 'Manual'}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => onCancel?.(entitlement.id)}
              disabled={isCancelling}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
            >
              {isCancelling ? (
                <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Bundle indicator */}
      {entitlement.bundle_id && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Package className="w-3 h-3" />
            Part of bundle
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-40 bg-gray-200 rounded-2xl" />
      <div className="grid md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default SubscriptionDashboard;

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
import { useEffect, useState } from 'react';
import { useUser, useUserRole } from '@/shared/model/authStore';
import { getRouteForRole } from '@/features/auth/lib/roleBasedRouter';
import { featureName, formatManagementPrice, managementBillingLabel, monthlyPlanCost } from '../../lib/subscriptionPresentation';
import { useLocation, useNavigate } from 'react-router-dom';
import { entitlementService } from '../../api/entitlementService';
import { useSubscription } from '@/features/subscription/model/subscriptionStore';
import { useSubscriptionQuery } from '@/features/subscription/model/useSubscriptionQuery';
/**
 * Get the base path for subscription routes based on current location
 */
function getSubscriptionBasePath(pathname) {
  if (pathname.startsWith('/learner')) return '/learner';
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
export function SubscriptionDashboard({ className = '', subscriptionData: propSubscriptionData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const { role } = useUserRole();
  const routePath = location.pathname.startsWith('/subscription/') ? getRouteForRole(role) : location.pathname;
  const basePath = getSubscriptionBasePath(routePath);
  const {
    entitlementsUserId,
    entitlementsError,
    userEntitlements,
    activeEntitlements,
    totalAddOnCost,
    isLoadingEntitlements,
    fetchUserEntitlements,
    cancelAddOn,
    isCancelling
  } = useSubscription();
  const { subscriptionData: rqSubscriptionData } = useSubscriptionQuery({ enabled: !propSubscriptionData });
  
  // Use prop subscriptionData if provided, otherwise fall back to React Query
  const subscriptionData = propSubscriptionData || rqSubscriptionData;

  const [actionError, setActionError] = useState(null);
  useEffect(() => { if (user?.id) void fetchUserEntitlements(); }, [user?.id, fetchUserEntitlements]);
  const [cancellingId, setCancellingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Handle cancel add-on
  const handleCancel = async (entitlementId) => {
    if (!window.confirm('Are you sure you want to cancel this add-on? You will retain access until the end of your billing period.')) {
      return;
    }

    setActionError(null);
    setCancellingId(entitlementId);
    try {
      await cancelAddOn(entitlementId);
    } catch (error) {
      setActionError(error.message || 'Unable to cancel add-on.');
    } finally {
      setCancellingId(null);
    }
  };

  // Handle toggle auto-renew
  const handleToggleAutoRenew = async (entitlementId, currentValue) => {
    setActionError(null);
    setTogglingId(entitlementId);
    try {
      const result = await entitlementService.toggleAutoRenew(entitlementId, !currentValue);
      if (!result.success) throw new Error(result.error || 'Unable to update renewal.');
      await fetchUserEntitlements();
    } catch (error) {
      setActionError(error.message || 'Unable to update renewal.');
    } finally {
      setTogglingId(null);
    }
  };

  // Group entitlements by status
  const activeEnts = userEntitlements.filter(e => e.status === 'active');
  const gracePeriodEnts = userEntitlements.filter(e => e.status === 'grace_period');
  const cancelledEnts = userEntitlements.filter(e => e.status === 'cancelled');

  if (isLoadingEntitlements || entitlementsUserId !== user?.id) {
    return <DashboardSkeleton />;
  }

  if (entitlementsError) return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4"><p>Unable to load add-ons.</p><button type="button" className="mt-2 underline" onClick={() => void fetchUserEntitlements()}>Retry add-ons</button></div>;

  return (
    <div className={`space-y-8 ${className}`}>
      {actionError && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4">{actionError}</p>}
      {/* Header - Editorial Luxury */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-3xl sm:text-5xl font-light text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Plan and add-ons</h2>
          <p className="text-slate-600 mt-2 text-lg font-light">Manage your plan and add-ons</p>
        </div>
        <button
          disabled={!basePath} onClick={() => navigate(`${basePath}/subscription/add-ons`)}
          className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-2xl hover:from-slate-900 hover:to-black transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          Browse Add-ons
        </button>
      </div>

      {/* Current Plan Card - Editorial Luxury */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 36px)`
        }}></div>
        
        {/* Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400"></div>
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Current Plan</p>
            <h2 className="text-4xl font-light mb-3" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              {subscriptionData?.planName || subscriptionData?.plan_name || subscriptionData?.plan_type || ''}
            </h2>
            {subscriptionData?.nextBillingDate && subscriptionData?.autoRenew === true && (
              <p className="text-white/70 text-sm flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4" />
                Renews {new Date(subscriptionData.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <p className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Plan Cost</p>
            <p className="text-5xl font-light" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              {formatManagementPrice(subscriptionData?.planPrice)}
            </p>
            {subscriptionData?.billingCycle && (
              <p className="text-white/50 text-xs font-medium mt-1">({subscriptionData.billingCycle})</p>
            )}
          </div>
        </div>

        {subscriptionData && (
          <div className="relative mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-white/70 font-medium">
              Status: <span className="text-white font-semibold capitalize">{subscriptionData.status}</span>
            </span>
            <button
              disabled={!basePath}
              onClick={() => {
                // Get user type from basePath for proper plan display
                const typeMap = {
                  '/learner': 'learner',
                  '/recruitment': 'recruiter',
                  '/educator': 'educator',
                  '/college-admin': 'college_admin',
                  '/school-admin': 'school_admin',
                  '/university-admin': 'university_admin'
                };
                const userType = typeMap[basePath];
                if (!userType) return;
                navigate(`/subscription/plans?type=${userType}&mode=upgrade&subscriptionId=${encodeURIComponent(subscriptionData.id)}`);
              }}
              className="text-sm text-white hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
            >
              Change Plan
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cost Summary - Editorial Luxury */}
      <div className="grid md:grid-cols-3 gap-6">
        <CostCard
          title="Base Plan"
          amount={subscriptionData?.planPrice}
          period={managementBillingLabel(subscriptionData?.billingCycle)}
          icon={CreditCard}
        />
        <CostCard
          title="Add-ons"
          amount={totalAddOnCost.monthly}
          period="/month"
          icon={Package}
        />
        <CostCard
          title="Monthly equivalent"
          amount={monthlyPlanCost(subscriptionData?.planPrice, subscriptionData?.billingCycle) === null || totalAddOnCost.monthly === null ? null : Math.round((monthlyPlanCost(subscriptionData.planPrice, subscriptionData.billingCycle) + totalAddOnCost.monthly) * 100) / 100}
          period="/month"
          icon={DollarSign}
          highlight
        />
      </div>

      {/* Grace Period Warning - Editorial Luxury */}
      {gracePeriodEnts.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-lg">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-light text-xl text-amber-900 mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>Payment Required</h3>
            <p className="text-sm text-amber-700 font-light leading-relaxed">
              {gracePeriodEnts.length} add-on(s) are in grace period. Please update your payment method to avoid losing access.
            </p>
          </div>
        </div>
      )}

      {/* Active Add-ons - Editorial Luxury */}
      <section>
        <h2 className="text-3xl font-light text-slate-900 mb-6 flex items-center gap-3" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          Active Add-ons
          <span className="text-lg font-medium text-slate-500">
            ({activeEnts.length + gracePeriodEnts.length})
          </span>
        </h2>

        {activeEnts.length === 0 && gracePeriodEnts.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-12 text-center border-2 border-slate-200 shadow-lg">
            <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 mb-6 font-light text-lg">No active add-ons</p>
            <button
              disabled={!basePath} onClick={() => navigate(`${basePath}/subscription/add-ons`)}
              className="px-6 py-3 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-2xl hover:from-slate-900 hover:to-black transition-all shadow-lg hover:scale-105"
            >
              Browse available add-ons
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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

      {/* Cancelled Add-ons - Editorial Luxury */}
      {cancelledEnts.length > 0 && (
        <section>
          <h2 className="text-3xl font-light text-slate-900 mb-6 flex items-center gap-3" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
            <div className="w-10 h-10 rounded-2xl bg-slate-300 flex items-center justify-center shadow-lg">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            Cancelled (Access Until Expiry)
          </h2>

          <div className="space-y-4">
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
 * CostCard - Displays a cost metric - Editorial Luxury
 */
function CostCard({ title, amount, period, icon: Icon, highlight = false }) {
  const formattedAmount = formatManagementPrice(amount);

  return (
    <div className={`
      rounded-3xl p-6 border-2 shadow-lg hover:shadow-xl transition-all
      ${highlight 
        ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200' 
        : 'bg-white border-slate-200'
      }
    `}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
          highlight ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-slate-700 to-slate-800'
        }`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm text-slate-600 font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-1">
        <span className={`text-4xl font-light ${highlight ? 'text-amber-700' : 'text-slate-900'}`} style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
          {formattedAmount}
        </span>
        <span className="text-slate-500 text-sm font-medium">{period}</span>
      </div>
    </div>
  );
}

/**
 * EntitlementCard - Displays a single entitlement - Editorial Luxury
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
      bg-white rounded-3xl border-2 p-6 shadow-lg hover:shadow-xl transition-all
      ${isGracePeriod ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100' : 'border-slate-200'}
      ${isCancelled ? 'opacity-75' : ''}
    `}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {/* Status Indicator */}
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
            ${isGracePeriod 
              ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
              : isCancelled 
                ? 'bg-slate-200'
                : 'bg-gradient-to-br from-emerald-400 to-emerald-500'
            }
          `}>
            {isGracePeriod ? (
              <AlertCircle className="w-6 h-6 text-white" />
            ) : isCancelled ? (
              <Clock className="w-6 h-6 text-slate-500" />
            ) : (
              <Check className="w-6 h-6 text-white" strokeWidth={3} />
            )}
          </div>

          <div>
            <h3 className="font-light text-xl text-slate-900 capitalize mb-1" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", serif' }}>
              {featureName(entitlement.feature_key)}
            </h3>
            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
              <span className="capitalize">{entitlement.billing_period}</span>
              <span>•</span>
              <span>{formatManagementPrice(entitlement.price_at_purchase)} {managementBillingLabel(entitlement.billing_period)}</span>
            </div>
            
            {/* Renewal/Expiry Info */}
            <p className={`text-sm mt-3 font-medium ${isGracePeriod ? 'text-amber-700' : 'text-slate-600'}`}>
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
          <div className="flex items-center gap-3">
            {/* Auto-renew Toggle */}
            <button
              onClick={() => onToggleAutoRenew?.(entitlement.id, entitlement.auto_renew)}
              disabled={isToggling}
              className={`
                px-4 py-2 text-sm rounded-2xl border-2 transition-all flex items-center gap-2 font-semibold shadow-lg
                ${entitlement.auto_renew 
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }
                ${isToggling ? 'opacity-50' : ''}
              `}
              aria-label={`Automatic renewal for ${featureName(entitlement.feature_key)}`}
              aria-pressed={entitlement.auto_renew === true}
              title={entitlement.auto_renew ? 'Auto-renew is ON' : 'Auto-renew is OFF'}
            >
              <RefreshCw className={`w-4 h-4 ${isToggling ? 'animate-spin' : ''}`} />
              {entitlement.auto_renew ? 'Auto' : 'Manual'}
            </button>

            {/* Cancel Button */}
            <button
              onClick={() => onCancel?.(entitlement.id)}
              disabled={isCancelling}
              className="px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-2xl transition-all flex items-center gap-2 font-semibold border-2 border-red-200"
            >
              {isCancelling ? (
                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Bundle indicator */}
      {entitlement.bundle_id && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-500 flex items-center gap-2 font-semibold uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" />
            Part of bundle
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton - Editorial Luxury
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-64 bg-slate-200 rounded-3xl" />
      <div className="h-48 bg-slate-200 rounded-3xl" />
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-200 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export default SubscriptionDashboard;

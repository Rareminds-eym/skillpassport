/**
 * SubscriptionGate
 * 
 * Conditionally renders content based on subscription status.
 * Use for gating premium features within pages.
 * 
 * Usage:
 * <SubscriptionGate 
 *   fallback={<UpgradePrompt />}
 *   requiredPlan="professional"
 * >
 *   <PremiumFeature />
 * </SubscriptionGate>
 */

import { Link, useLocation } from 'react-router-dom';
import { PLAN_HIERARCHY } from '../../config/subscriptionPlans';
import { useSubscriptionContext } from '../../context/SubscriptionContext';

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

const DefaultFallback = ({ requiredPlan, basePath }) => (
  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-6 text-center">
    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Premium Feature
    </h3>
    <p className="text-gray-600 mb-4">
      {requiredPlan 
        ? `This feature requires a ${requiredPlan} plan or higher.`
        : 'This feature requires an active subscription.'}
    </p>
    <Link
      to="/subscription/plans"
      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
    >
      Upgrade Now
    </Link>
  </div>
);

/**
 * Get plan level from hierarchy array
 * @param {string} planId - Plan ID to check
 * @returns {number} Plan level (index in hierarchy)
 */
const getPlanLevel = (planId) => {
  if (!planId) return -1;
  const normalizedPlan = planId.toLowerCase();
  const index = PLAN_HIERARCHY.indexOf(normalizedPlan);
  return index >= 0 ? index : -1;
};

const SubscriptionGate = ({ 
  children, 
  fallback,
  requiredPlan = null,
  requireActive = true,
}) => {
  const location = useLocation();
  const basePath = getSubscriptionBasePath(location.pathname);
  const { 
    hasAccess, 
    subscription,
    isLoading,
  } = useSubscriptionContext();

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  // Check basic access
  if (requireActive && !hasAccess) {
    return fallback || <DefaultFallback requiredPlan={requiredPlan} basePath={basePath} />;
  }

  // Check plan level if specified
  if (requiredPlan && subscription) {
    const userPlanLevel = getPlanLevel(subscription.plan_type);
    const requiredPlanLevel = getPlanLevel(requiredPlan);

    if (userPlanLevel < requiredPlanLevel) {
      return fallback || <DefaultFallback requiredPlan={requiredPlan} basePath={basePath} />;
    }
  }

  // Access granted
  return children;
};

export default SubscriptionGate;

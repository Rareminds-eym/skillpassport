/**
 * SubscriptionGate
 * 
 * Conditionally renders content based on subscription status.
 * Use for gating premium features within pages.
 * 
 * Usage:
 * <SubscriptionGate 
 *   fallback={<UpgradePrompt />}
 *   requiredPlan="pro"
 * >
 *   <PremiumFeature />
 * </SubscriptionGate>
 */

import { useSubscriptionContext } from '../../context/SubscriptionContext';
import { Link } from 'react-router-dom';

// Plan hierarchy for comparison
const PLAN_HIERARCHY = {
  basic: 1,
  pro: 2,
  professional: 2,
  enterprise: 3,
};

const DefaultFallback = ({ requiredPlan }) => (
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

const SubscriptionGate = ({ 
  children, 
  fallback,
  requiredPlan = null,
  requireActive = true,
}) => {
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
    return fallback || <DefaultFallback requiredPlan={requiredPlan} />;
  }

  // Check plan level if specified
  if (requiredPlan && subscription) {
    const userPlanLevel = PLAN_HIERARCHY[subscription.plan_type?.toLowerCase()] || 0;
    const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan.toLowerCase()] || 0;

    if (userPlanLevel < requiredPlanLevel) {
      return fallback || <DefaultFallback requiredPlan={requiredPlan} />;
    }
  }

  // Access granted
  return children;
};

export default SubscriptionGate;

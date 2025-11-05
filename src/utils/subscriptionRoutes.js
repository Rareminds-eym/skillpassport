/**
 * Subscription Routing Utility
 * Centralized logic for subscription-related routing decisions
 */

/**
 * Determines the appropriate route based on user auth and subscription status
 * @param {Object} user - The authenticated user object
 * @param {Object} subscriptionData - The user's subscription data
 * @returns {Object} Route decision with path and reason
 */
export const getSubscriptionRouteDecision = (user, subscriptionData) => {
  // User not authenticated
  if (!user) {
    return {
      shouldRedirect: false,
      targetRoute: '/subscription/plans?type=student&mode=purchase',
      reason: 'not_authenticated',
      canAccessManage: false,
      canAccessPayment: true,
      canAccessPlans: true
    };
  }

  // User authenticated but no subscription
  if (!subscriptionData) {
    return {
      shouldRedirect: false,
      targetRoute: '/subscription/plans?type=student&mode=purchase',
      reason: 'no_subscription',
      canAccessManage: false,
      canAccessPayment: true,
      canAccessPlans: true
    };
  }

  // User has active subscription
  if (subscriptionData.status === 'active') {
    return {
      shouldRedirect: false,
      targetRoute: '/subscription/manage',
      reason: 'active_subscription',
      canAccessManage: true,
      canAccessPayment: false, // Should redirect to manage
      canAccessPlans: true
    };
  }

  // User has expired/cancelled subscription
  return {
    shouldRedirect: false,
    targetRoute: '/subscription/plans?type=student&mode=renew',
    reason: 'expired_subscription',
    canAccessManage: true, // Can view past subscription
    canAccessPayment: true,
    canAccessPlans: true
  };
};

/**
 * Checks if user should be redirected based on current route
 * @param {string} currentRoute - Current route path
 * @param {Object} user - The authenticated user object
 * @param {Object} subscriptionData - The user's subscription data
 * @returns {Object|null} Redirect info or null if no redirect needed
 */
export const shouldRedirectFrom = (currentRoute, user, subscriptionData) => {
  const decision = getSubscriptionRouteDecision(user, subscriptionData);

  // Payment page - redirect if user has active subscription
  if (currentRoute === '/subscription/payment' && !decision.canAccessPayment) {
    return {
      redirect: true,
      to: decision.targetRoute,
      reason: 'User already has active subscription'
    };
  }

  // Manage page - redirect if user is not authenticated or has no subscription
  if (currentRoute === '/subscription/manage' && !decision.canAccessManage) {
    return {
      redirect: true,
      to: decision.targetRoute,
      reason: decision.reason === 'not_authenticated' 
        ? 'User not authenticated' 
        : 'No subscription found'
    };
  }

  // No redirect needed
  return null;
};

/**
 * Gets the appropriate CTA action based on subscription status
 * @param {Object} subscriptionData - The user's subscription data
 * @param {string} planId - The plan being viewed
 * @returns {Object} CTA configuration
 */
export const getSubscriptionCTA = (subscriptionData, planId) => {
  if (!subscriptionData) {
    return {
      label: 'Select Plan',
      action: 'purchase',
      variant: 'primary'
    };
  }

  const currentPlanPrice = getPlanPrice(subscriptionData.plan);
  const selectedPlanPrice = getPlanPrice(planId);

  if (subscriptionData.plan === planId) {
    return {
      label: 'Manage Subscription',
      action: 'manage',
      variant: 'secondary'
    };
  }

  if (subscriptionData.status === 'active') {
    if (selectedPlanPrice > currentPlanPrice) {
      return {
        label: 'Upgrade Plan',
        action: 'upgrade',
        variant: 'primary'
      };
    } else {
      return {
        label: 'Switch to This Plan',
        action: 'downgrade',
        variant: 'secondary'
      };
    }
  }

  return {
    label: 'Renew with This Plan',
    action: 'renew',
    variant: 'primary'
  };
};

/**
 * Helper to get plan price for comparison
 */
const getPlanPrice = (planId) => {
  const prices = {
    basic: 499,
    pro: 999,
    enterprise: 1999
  };
  return prices[planId] || 0;
};

/**
 * Validates subscription status transitions
 * @param {string} currentStatus - Current subscription status
 * @param {string} newStatus - Intended new status
 * @returns {boolean} Whether transition is valid
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    pending: ['active', 'cancelled'],
    active: ['expired', 'cancelled'],
    expired: ['active'], // Renewal
    cancelled: ['active'] // Reactivation
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Calculates subscription urgency level for UI hints
 * @param {Object} subscriptionData - The user's subscription data
 * @returns {Object} Urgency information
 */
export const getSubscriptionUrgency = (subscriptionData) => {
  if (!subscriptionData || !subscriptionData.endDate) {
    return { level: 'none', message: null };
  }

  const endDate = new Date(subscriptionData.endDate);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  if (subscriptionData.status === 'expired') {
    return {
      level: 'critical',
      message: 'Your subscription has expired. Renew now to restore access.',
      daysRemaining: 0
    };
  }

  if (daysRemaining <= 3) {
    return {
      level: 'critical',
      message: `Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left! Renew now to avoid interruption.`,
      daysRemaining
    };
  }

  if (daysRemaining <= 7) {
    return {
      level: 'warning',
      message: `Your subscription expires in ${daysRemaining} days.`,
      daysRemaining
    };
  }

  if (daysRemaining <= 14) {
    return {
      level: 'info',
      message: `${daysRemaining} days remaining in your subscription.`,
      daysRemaining
    };
  }

  return {
    level: 'normal',
    message: null,
    daysRemaining
  };
};


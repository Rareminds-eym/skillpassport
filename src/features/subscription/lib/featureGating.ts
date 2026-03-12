/**
 * Feature Gating Utilities
 * Handles feature access control based on subscription status
 */

/**
 * Check if user has access to a specific feature
 */
export const hasFeatureAccess = (
  subscription: any,
  featureKey: string
): boolean => {
  if (!subscription || !subscription.status) return false;

  // Check if subscription is active or in grace period
  const isActive = ['active', 'paused', 'grace_period'].includes(subscription.status);
  
  // Check if subscription hasn't expired
  const now = new Date();
  const endDate = subscription.subscription_end_date 
    ? new Date(subscription.subscription_end_date) 
    : null;
  const notExpired = !endDate || endDate >= now;

  return isActive && notExpired;
};

/**
 * Get required add-on for a feature
 */
export const getRequiredAddOn = (
  featureKey: string,
  addOns: any[]
): any | null => {
  return addOns.find(addOn => addOn.feature_key === featureKey) || null;
};

/**
 * Check if feature is included in base plan
 */
export const isFeatureInBasePlan = (
  featureKey: string,
  planFeatures: string[]
): boolean => {
  return planFeatures.includes(featureKey);
};

/**
 * Calculate feature access level
 */
export const getFeatureAccessLevel = (
  subscription: any,
  featureKey: string,
  planFeatures: string[],
  userEntitlements: any[]
): 'full' | 'limited' | 'none' => {
  // Check if feature is in base plan
  if (isFeatureInBasePlan(featureKey, planFeatures)) {
    return hasFeatureAccess(subscription, featureKey) ? 'full' : 'none';
  }

  // Check if user has add-on entitlement
  const hasEntitlement = userEntitlements.some(
    ent => ent.feature_key === featureKey && ent.status === 'active'
  );

  if (hasEntitlement) return 'full';

  return 'none';
};

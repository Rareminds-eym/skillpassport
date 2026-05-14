/**
 * Feature Gating Utilities
 * Handles feature access control based on subscription status
 */

import { PLAN_IDS, PAY_AS_YOU_GO_FEATURES } from '@/shared/config/subscriptionPlans';
import { createFeatureAccessErrorLog, logError } from '@/shared/lib/errorLogging';

/**
 * Feature access result interface
 */
export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  availableInPlans?: string[];
  addOnAvailable?: boolean;
}

/**
 * Check if user has access to a specific feature
 * Main entry point for feature access control
 * 
 * @throws Never throws - returns denial on any error
 */
export function checkFeatureAccess(
  userPlan: string,
  feature: string,
  userPurchases: any[] = [],
  currentUsage?: Record<string, number>,
  userId?: string
): FeatureAccessResult {
  try {
    // Handle Freemium tier
    if (userPlan === PLAN_IDS.PAY_AS_YOU_GO) {
      return checkFreemiumAccess(feature);
    }

    // Handle other plans (existing logic)
    // For now, grant access to all features for paid plans
    // This can be extended with plan-specific feature checks
    return { hasAccess: true };
  } catch (error) {
    // Log error with full context
    if (userId) {
      const errorLog = createFeatureAccessErrorLog(
        userId,
        feature,
        userPlan,
        error instanceof Error ? error.message : 'Unknown error during feature access check',
        error instanceof Error ? error : undefined
      );
      logError(errorLog);
    } else {
      // Fallback logging without userId
      console.error('[FeatureGating] Error checking feature access:', {
        userPlan,
        feature,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
    
    // Default to denying access on any error
    return {
      hasAccess: false,
      reason: 'Unable to verify access. Please refresh the page.',
      upgradeRequired: false,
    };
  }
}

/**
 * Check Freemium plan access
 * Returns access result based on PAY_AS_YOU_GO_FEATURES configuration
 */
function checkFreemiumAccess(feature: string): FeatureAccessResult {
  const featureConfig = PAY_AS_YOU_GO_FEATURES[feature];

  // Feature not defined - deny by default
  if (featureConfig === undefined) {
    return {
      hasAccess: false,
      reason: 'This feature requires a paid plan',
      upgradeRequired: true,
      availableInPlans: ['basic', 'professional', 'enterprise'],
    };
  }

  // Feature is free
  if (featureConfig === true) {
    return { hasAccess: true };
  }

  // Feature is locked
  return {
    hasAccess: false,
    reason: 'Upgrade to a paid plan to unlock this feature',
    upgradeRequired: true,
    availableInPlans: ['basic', 'professional', 'enterprise'],
  };
}

/**
 * Legacy function - Check if user has access to a specific feature
 * @deprecated Use checkFeatureAccess instead
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

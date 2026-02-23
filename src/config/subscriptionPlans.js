/**
 * subscriptionPlans.js
 *
 * IMPORTANT: This file no longer contains any pricing data.
 * All subscription plan data (prices, features, names, limits) comes
 * exclusively from the Cloudflare Worker API → Supabase database.
 *
 * This file only exports constants needed for plan hierarchy ordering,
 * used by access-control logic (SubscriptionGate).
 * These IDs must match the plan_code values in the subscription_plans DB table.
 */

/**
 * Plan code identifiers — must match plan_code values in Supabase subscription_plans table.
 */
export const PLAN_IDS = {
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
  ECOSYSTEM: 'enterprise_ecosystem',
};

/**
 * Ordered hierarchy of plan codes from lowest to highest tier.
 * Used only for access-control comparisons (e.g. "does user have at least Professional?").
 * NOT used for pricing — prices always come from the database.
 */
export const PLAN_HIERARCHY = [
  PLAN_IDS.BASIC,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.ENTERPRISE,
  PLAN_IDS.ECOSYSTEM,
];

/**
 * Check if a user's plan meets the minimum required plan tier.
 * Pure order comparison — no pricing involved.
 *
 * @param {string} userPlanId   - The user's current plan_code
 * @param {string} requiredPlanId - The minimum required plan_code
 * @returns {boolean}
 */
export function meetsMinimumPlan(userPlanId, requiredPlanId) {
  const userIndex = PLAN_HIERARCHY.indexOf(userPlanId?.toLowerCase());
  const requiredIndex = PLAN_HIERARCHY.indexOf(requiredPlanId?.toLowerCase());
  if (userIndex === -1 || requiredIndex === -1) return false;
  return userIndex >= requiredIndex;
}

export default { PLAN_IDS, PLAN_HIERARCHY, meetsMinimumPlan };

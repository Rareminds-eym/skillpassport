/**
 * subscriptionPlans.js
 *
 * All subscription plan data (prices, features, names, limits) comes
 * exclusively from the Cloudflare Worker API → Supabase database.
 *
 * This file exports plan identifiers and hierarchy helpers for both
 * learner (B2C) and recruiter (B2B) plan families.
 */

/**
 * Plan code identifiers — matches plan_code values in Supabase plans_cache table.
 */
export const PLAN_IDS = {
  // Learner plans
  FREEMIUM: 'freemium',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
  ECOSYSTEM: 'enterprise_ecosystem',

  // Recruiter plans (Spec v2: 6 tiers)
  RECRUITER_FREE: 'recruiter_free',
  RECRUITER_LITE: 'recruiter_lite',
  RECRUITER_STARTER: 'recruiter_starter',
  RECRUITER_GROWTH: 'recruiter_growth',
  RECRUITER_PRO: 'recruiter_pro',
  RECRUITER_ENTERPRISE: 'recruiter_enterprise',
};

/**
 * Ordered hierarchy of learner plan codes from lowest to highest tier.
 */
export const PLAN_HIERARCHY = [
  PLAN_IDS.FREEMIUM,
  PLAN_IDS.BASIC,
  PLAN_IDS.PROFESSIONAL,
  PLAN_IDS.PREMIUM,
  PLAN_IDS.ENTERPRISE,
  PLAN_IDS.ECOSYSTEM,
];

/**
 * Ordered hierarchy of recruiter plan codes from lowest to highest tier.
 */
export const RECRUITER_PLAN_HIERARCHY = [
  PLAN_IDS.RECRUITER_FREE,
  PLAN_IDS.RECRUITER_LITE,
  PLAN_IDS.RECRUITER_STARTER,
  PLAN_IDS.RECRUITER_GROWTH,
  PLAN_IDS.RECRUITER_PRO,
  PLAN_IDS.RECRUITER_ENTERPRISE,
];

/**
 * Plan hierarchy levels for access control
 * Maps plan codes to numeric levels for comparison
 */
export const PLAN_HIERARCHY_LEVELS = {
  // Learner plans
  'freemium': 0,
  'basic': 1,
  'professional': 2,
  'premium': 3,
  'enterprise': 4,
  'ecosystem': 4,
  'enterprise_ecosystem': 4,

  // Recruiter plans
  'recruiter_free': 0,
  'recruiter_lite': 1,
  'recruiter_starter': 2,
  'recruiter_growth': 3,
  'recruiter_pro': 4,
  'recruiter_enterprise': 5,

  // Institutional plans
  'school_freemium': 0,
  'school_starter': 1,
  'school_professional': 2,
  'school_enterprise': 3,
  'college_starter': 1,
  'college_professional': 2,
  'college_enterprise': 3,
  'university_starter': 1,
  'university_professional': 2,
  'university_enterprise': 3,
  'hybrid': 4,
};

/**
 * Helper to get numeric hierarchy level of any plan code (learner or recruiter)
 */
export function getPlanHierarchyLevel(planCode) {
  if (!planCode) return 0;
  const normalized = String(planCode).trim().toLowerCase();
  return PLAN_HIERARCHY_LEVELS[normalized] ?? 0;
}

/**
 * Freemium plan feature configuration
 * Used as fallback for unauthenticated learner view
 */
export const FREEMIUM_FEATURES = {
  // Free features
  dashboard_access: true,
  profile_creation: true,
  marketplace_access: true,
  view_pricing: true,
  opportunities_listing_access: true,
  courses_listing_access: true,

  // Locked features (require upgrade)
  opportunities_access: false,
  assessments: false,
  projects: false,
  storage: false,
  analytics: false,
  portfolio: false,
  career_paths: false,
  mock_interviews: false,
  resume_builder: false,
  certificates: false,
  course_enrollment: false,
  priority_support: false,
};

/**
 * Check if a user's plan meets the minimum required plan tier.
 * Supports both learner and recruiter plan families.
 *
 * @param {string} userPlanId   - The user's current plan_code
 * @param {string} requiredPlanId - The minimum required plan_code
 * @returns {boolean}
 */
export function meetsMinimumPlan(userPlanId, requiredPlanId) {
  if (!userPlanId || !requiredPlanId) return false;
  const userCode = String(userPlanId).trim().toLowerCase();
  const requiredCode = String(requiredPlanId).trim().toLowerCase();
  const userLevel = PLAN_HIERARCHY_LEVELS[userCode];
  const requiredLevel = PLAN_HIERARCHY_LEVELS[requiredCode];
  if (typeof userLevel !== 'number' || typeof requiredLevel !== 'number') return false;
  return userLevel >= requiredLevel;
}

export default {
  PLAN_IDS,
  PLAN_HIERARCHY,
  RECRUITER_PLAN_HIERARCHY,
  PLAN_HIERARCHY_LEVELS,
  FREEMIUM_FEATURES,
  getPlanHierarchyLevel,
  meetsMinimumPlan,
};

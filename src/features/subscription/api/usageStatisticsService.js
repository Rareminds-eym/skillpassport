/**
 * Usage Statistics Service
 * 
 * Fetches real-time usage statistics for subscription features
 * including assessments, profile views, reports, and other metrics.
 */

import { apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('usage-statistics');

/**
 * Get usage statistics for the current user
 * @returns {Promise<{success: boolean, data: Object | null, error: string | null}>}
 */
export const getUserUsageStatistics = async () => {
  try {
    const result = await apiGet<{ success: boolean; data: any; error: string | null }>('/payments/usage-statistics');
    
    if (!result.success) {
      return { success: false, data: null, error: result.error || 'Failed to fetch usage statistics' };
    }

    return {
      success: true,
      data: result.data,
      error: null
    };
  } catch (error: any) {
    logger.error('Error fetching usage statistics', error);
    return {
      success: false,
      data: null,
      error: error.message || 'Unknown error'
    };
  }
};

/**
 * Get subscription limits from plan data
 * @param {Object} planData - Current plan data
 * @returns {Object} - Limits object with totals for each metric
 */
export const getSubscriptionLimits = (planData: any) => {
  // Default limits for free/basic plan
  const defaultLimits = {
    assessments: 50,
    profileViews: 1000,
    reports: 20
  };

  if (!planData) return defaultLimits;

  // Extract limits from plan data
  const limits: any = {
    assessments: planData.limits?.assessments || 
                 planData.features?.find((f: any) => f.includes('assessment'))?.match(/\d+/)?.[0] || 
                 defaultLimits.assessments,
    profileViews: planData.limits?.profileViews || 
                  planData.features?.find((f: any) => f.includes('view'))?.match(/\d+/)?.[0] || 
                  defaultLimits.profileViews,
    reports: planData.limits?.reports || 
             planData.features?.find((f: any) => f.includes('report'))?.match(/\d+/)?.[0] || 
             defaultLimits.reports
  };

  // Convert string numbers to integers
  Object.keys(limits).forEach(key => {
    if (typeof limits[key] === 'string') {
      limits[key] = parseInt(limits[key], 10);
    }
  });

  return limits;
};

/**
 * Combine usage data with limits
 * @param {Object} usageData - Current usage data
 * @param {Object} limits - Subscription limits
 * @returns {Object} - Combined usage statistics
 */
export const combineUsageWithLimits = (usageData: any, limits: any) => {
  return {
    assessments: {
      used: usageData?.assessments?.used || 0,
      total: limits.assessments || 50,
      label: usageData?.assessments?.label || 'Skill Assessments'
    },
    profileViews: {
      used: usageData?.profileViews?.used || 0,
      total: limits.profileViews || 1000,
      label: usageData?.profileViews?.label || 'Profile Views'
    },
    reports: {
      used: usageData?.reports?.used || 0,
      total: limits.reports || 20,
      label: usageData?.reports?.label || 'Reports Generated'
    }
  };
};

export default {
  getUserUsageStatistics,
  getSubscriptionLimits,
  combineUsageWithLimits
};
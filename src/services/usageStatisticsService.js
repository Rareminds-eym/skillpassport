/**
 * Usage Statistics Service
 * 
 * Fetches real-time usage statistics for subscription features
 * including assessments, profile views, reports, and other metrics.
 */

import { supabase } from '../lib/supabaseClient';
import { getLogger } from '../config/logging';

const logger = getLogger('usage-statistics');

/**
 * Get usage statistics for the current user
 * @returns {Promise<{success: boolean, data: Object | null, error: string | null}>}
 */
export const getUserUsageStatistics = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        data: null,
        error: 'User not authenticated'
      };
    }

    // Fetch all usage metrics in parallel
    const [
      assessmentsResult,
      profileViewsResult,
      reportsResult
    ] = await Promise.all([
      getAssessmentsUsage(user.id),
      getProfileViewsUsage(user.id),
      getReportsUsage(user.id)
    ]);

    // Combine results
    const usageData = {
      assessments: assessmentsResult.data,
      profileViews: profileViewsResult.data,
      reports: reportsResult.data
    };

    return {
      success: true,
      data: usageData,
      error: null
    };
  } catch (error) {
    logger.error('Error fetching usage statistics', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get assessments usage count
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Object}>}
 */
const getAssessmentsUsage = async (userId) => {
  try {
    // Count completed personal assessments
    const { count, error } = await supabase
      .from('personal_assessment_results')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId);

    if (error) throw error;

    return {
      success: true,
      data: {
        used: count || 0,
        label: 'Skill Assessments'
      }
    };
  } catch (error) {
    logger.error('Error fetching assessments usage', error);
    return {
      success: false,
      data: {
        used: 0,
        label: 'Skill Assessments'
      }
    };
  }
};

/**
 * Get profile views usage count
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Object}>}
 */
const getProfileViewsUsage = async (userId) => {
  try {
    // Count profile views from analytics or tracking table
    const { count, error } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId);

    if (error) {
      // If table doesn't exist, return 0
      if (error.code === '42P01') {
        return {
          success: true,
          data: {
            used: 0,
            label: 'Profile Views'
          }
        };
      }
      throw error;
    }

    return {
      success: true,
      data: {
        used: count || 0,
        label: 'Profile Views'
      }
    };
  } catch (error) {
    logger.error('Error fetching profile views', error);
    return {
      success: false,
      data: {
        used: 0,
        label: 'Profile Views'
      }
    };
  }
};

/**
 * Get reports usage count
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data: Object}>}
 */
const getReportsUsage = async (userId) => {
  try {
    // Count generated reports from student_reports table
    const { count, error } = await supabase
      .from('student_reports')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', userId);

    if (error) {
      // If table doesn't exist, return 0
      if (error.code === '42P01') {
        return {
          success: true,
          data: {
            used: 0,
            label: 'Reports Generated'
          }
        };
      }
      throw error;
    }

    return {
      success: true,
      data: {
        used: count || 0,
        label: 'Reports Generated'
      }
    };
  } catch (error) {
    logger.error('Error fetching reports usage', error);
    return {
      success: false,
      data: {
        used: 0,
        label: 'Reports Generated'
      }
    };
  }
};

/**
 * Get subscription limits from plan data
 * @param {Object} planData - Current plan data
 * @returns {Object} - Limits object with totals for each metric
 */
export const getSubscriptionLimits = (planData) => {
  // Default limits for free/basic plan
  const defaultLimits = {
    assessments: 50,
    profileViews: 1000,
    reports: 20
  };

  if (!planData) return defaultLimits;

  // Extract limits from plan data
  // This structure depends on your plan data format
  const limits = {
    assessments: planData.limits?.assessments || 
                 planData.features?.find(f => f.includes('assessment'))?.match(/\d+/)?.[0] || 
                 defaultLimits.assessments,
    profileViews: planData.limits?.profileViews || 
                  planData.features?.find(f => f.includes('view'))?.match(/\d+/)?.[0] || 
                  defaultLimits.profileViews,
    reports: planData.limits?.reports || 
             planData.features?.find(f => f.includes('report'))?.match(/\d+/)?.[0] || 
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
export const combineUsageWithLimits = (usageData, limits) => {
  return {
    assessments: {
      used: usageData.assessments?.used || 0,
      total: limits.assessments || 50,
      label: usageData.assessments?.label || 'Skill Assessments'
    },
    profileViews: {
      used: usageData.profileViews?.used || 0,
      total: limits.profileViews || 1000,
      label: usageData.profileViews?.label || 'Profile Views'
    },
    reports: {
      used: usageData.reports?.used || 0,
      total: limits.reports || 20,
      label: usageData.reports?.label || 'Reports Generated'
    }
  };
};

export default {
  getUserUsageStatistics,
  getSubscriptionLimits,
  combineUsageWithLimits
};

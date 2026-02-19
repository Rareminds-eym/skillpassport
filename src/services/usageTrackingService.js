/**
 * Usage Tracking Service
 * 
 * Manages feature usage limits and tracking via rbac_feature_usage table
 */

import { supabase } from '../lib/supabaseClient';

class UsageTrackingService {
  /**
   * Check if user can use a feature and increment usage if allowed
   * 
   * @param {string} userId - User UUID
   * @param {string} featureKey - Feature key (e.g., 'career_ai')
   * @returns {Promise<{allowed: boolean, usageCount: number, usageLimit: number, remaining: number, error?: string}>}
   */
  async checkAndIncrementUsage(userId, featureKey) {
    try {
      if (!userId || !featureKey) {
        return {
          allowed: false,
          usageCount: 0,
          usageLimit: 0,
          remaining: 0,
          error: 'User ID and feature key are required'
        };
      }

      const { data, error } = await supabase.rpc('rbac_check_and_increment_usage', {
        p_user_id: userId,
        p_feature_key: featureKey
      });

      if (error) {
        console.error('[UsageTracking] Error checking usage:', error);
        return {
          allowed: false,
          usageCount: 0,
          usageLimit: 0,
          remaining: 0,
          error: error.message
        };
      }

      // If no data returned, feature has no limits (unlimited)
      if (!data || data.length === 0) {
        return {
          allowed: true,
          usageCount: 0,
          usageLimit: -1, // -1 indicates unlimited
          remaining: -1
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      return {
        allowed: result.allowed,
        usageCount: result.usage_count,
        usageLimit: result.usage_limit,
        remaining: result.remaining
      };
    } catch (error) {
      console.error('[UsageTracking] Error in checkAndIncrementUsage:', error);
      return {
        allowed: false,
        usageCount: 0,
        usageLimit: 0,
        remaining: 0,
        error: error.message
      };
    }
  }

  /**
   * Get usage status without incrementing
   * 
   * @param {string} userId - User UUID
   * @param {string} featureKey - Feature key
   * @returns {Promise<{usageCount: number, usageLimit: number, remaining: number, resetPeriod: string, nextResetAt: string, error?: string}>}
   */
  async getUsageStatus(userId, featureKey) {
    try {
      if (!userId || !featureKey) {
        return {
          usageCount: 0,
          usageLimit: -1,
          remaining: -1,
          resetPeriod: 'unlimited',
          nextResetAt: null,
          error: 'User ID and feature key are required'
        };
      }

      const { data, error } = await supabase.rpc('rbac_get_usage_status', {
        p_user_id: userId,
        p_feature_key: featureKey
      });

      if (error) {
        console.error('[UsageTracking] Error getting usage status:', error);
        return {
          usageCount: 0,
          usageLimit: -1,
          remaining: -1,
          resetPeriod: 'unlimited',
          nextResetAt: null,
          error: error.message
        };
      }

      // If no data, feature has no limits
      if (!data || data.length === 0) {
        return {
          usageCount: 0,
          usageLimit: -1,
          remaining: -1,
          resetPeriod: 'unlimited',
          nextResetAt: null
        };
      }

      const result = Array.isArray(data) ? data[0] : data;

      return {
        usageCount: result.usage_count,
        usageLimit: result.usage_limit,
        remaining: result.remaining,
        resetPeriod: result.reset_period,
        nextResetAt: result.next_reset_at
      };
    } catch (error) {
      console.error('[UsageTracking] Error in getUsageStatus:', error);
      return {
        usageCount: 0,
        usageLimit: -1,
        remaining: -1,
        resetPeriod: 'unlimited',
        nextResetAt: null,
        error: error.message
      };
    }
  }

  /**
   * Reset usage for a user's feature (admin function)
   * 
   * @param {string} userId - User UUID
   * @param {string} featureKey - Feature key
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async resetUsage(userId, featureKey) {
    try {
      if (!userId || !featureKey) {
        return { success: false, error: 'User ID and feature key are required' };
      }

      const { error } = await supabase
        .from('rbac_feature_usage')
        .update({
          usage_count: 0,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature_key', featureKey);

      if (error) {
        console.error('[UsageTracking] Error resetting usage:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[UsageTracking] Error in resetUsage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update usage limit for a user's feature (admin function)
   * 
   * @param {string} userId - User UUID
   * @param {string} featureKey - Feature key
   * @param {number} newLimit - New usage limit
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateUsageLimit(userId, featureKey, newLimit) {
    try {
      if (!userId || !featureKey || typeof newLimit !== 'number') {
        return { success: false, error: 'Invalid parameters' };
      }

      const { error } = await supabase
        .from('rbac_feature_usage')
        .update({
          usage_limit: newLimit,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('feature_key', featureKey);

      if (error) {
        console.error('[UsageTracking] Error updating limit:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[UsageTracking] Error in updateUsageLimit:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const usageTrackingService = new UsageTrackingService();
export default usageTrackingService;

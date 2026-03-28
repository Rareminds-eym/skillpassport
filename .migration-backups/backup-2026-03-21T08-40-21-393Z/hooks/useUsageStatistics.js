/**
 * useUsageStatistics Hook
 * 
 * Custom hook to fetch and manage usage statistics for subscription features
 */

import { useCallback, useEffect, useState } from 'react';
import usageStatisticsService from '../services/usageStatisticsService';

/**
 * Hook to fetch and manage usage statistics
 * @param {Object} planData - Current subscription plan data
 * @returns {Object} - Usage statistics state and methods
 */
export const useUsageStatistics = (planData) => {
  const [usageStats, setUsageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch usage statistics
   */
  const fetchUsageStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch actual usage data
      const usageResult = await usageStatisticsService.getUserUsageStatistics();

      if (!usageResult.success) {
        throw new Error(usageResult.error || 'Failed to fetch usage statistics');
      }

      // Get limits from plan data
      const limits = usageStatisticsService.getSubscriptionLimits(planData);

      // Combine usage with limits
      const combinedStats = usageStatisticsService.combineUsageWithLimits(
        usageResult.data,
        limits
      );

      setUsageStats(combinedStats);
    } catch (err) {
      console.error('Error in useUsageStatistics:', err);
      setError(err.message);
      
      // Set fallback data on error
      const limits = usageStatisticsService.getSubscriptionLimits(planData);
      setUsageStats({
        assessments: { used: 0, total: limits.assessments, label: 'Skill Assessments' },
        profileViews: { used: 0, total: limits.profileViews, label: 'Profile Views' },
        reports: { used: 0, total: limits.reports, label: 'Reports Generated' }
      });
    } finally {
      setLoading(false);
    }
  }, [planData]);

  /**
   * Refresh usage statistics
   */
  const refreshUsageStats = useCallback(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  // Fetch on mount and when plan changes
  useEffect(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  return {
    usageStats,
    loading,
    error,
    refreshUsageStats
  };
};

export default useUsageStatistics;

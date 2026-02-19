/**
 * useUsageTracking Hook
 * 
 * React hook for managing feature usage limits
 */

import { useState, useEffect, useCallback } from 'react';
import { usageTrackingService } from '../services/usageTrackingService';
import { useAuth } from '../context/AuthContext';

export const useUsageTracking = (featureKey) => {
  const { user } = useAuth();
  const [usageStatus, setUsageStatus] = useState({
    usageCount: 0,
    usageLimit: -1,
    remaining: -1,
    resetPeriod: 'unlimited',
    nextResetAt: null,
    loading: true,
    error: null
  });

  // Load usage status
  const loadUsageStatus = useCallback(async () => {
    if (!user?.id || !featureKey) {
      setUsageStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const status = await usageTrackingService.getUsageStatus(user.id, featureKey);
      setUsageStatus({
        usageCount: status.usageCount,
        usageLimit: status.usageLimit,
        remaining: status.remaining,
        resetPeriod: status.resetPeriod,
        nextResetAt: status.nextResetAt,
        loading: false,
        error: status.error || null
      });
    } catch (error) {
      console.error('[useUsageTracking] Error loading status:', error);
      setUsageStatus(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [user?.id, featureKey]);

  // Check and increment usage
  const checkAndIncrement = useCallback(async () => {
    if (!user?.id || !featureKey) {
      return {
        allowed: false,
        usageCount: 0,
        usageLimit: 0,
        remaining: 0,
        error: 'User not authenticated'
      };
    }

    try {
      const result = await usageTrackingService.checkAndIncrementUsage(user.id, featureKey);
      
      // Update local state
      if (result.allowed) {
        setUsageStatus(prev => ({
          ...prev,
          usageCount: result.usageCount,
          remaining: result.remaining
        }));
      }

      return result;
    } catch (error) {
      console.error('[useUsageTracking] Error checking usage:', error);
      return {
        allowed: false,
        usageCount: 0,
        usageLimit: 0,
        remaining: 0,
        error: error.message
      };
    }
  }, [user?.id, featureKey]);

  // Load status on mount and when dependencies change
  useEffect(() => {
    loadUsageStatus();
  }, [loadUsageStatus]);

  // Helper to check if limit is reached
  const isLimitReached = usageStatus.usageLimit > 0 && usageStatus.remaining <= 0;

  // Helper to check if feature is unlimited
  const isUnlimited = usageStatus.usageLimit === -1;

  // Helper to get formatted reset date
  const getResetDateFormatted = () => {
    if (!usageStatus.nextResetAt) return null;
    
    const resetDate = new Date(usageStatus.nextResetAt);
    const now = new Date();
    const diffMs = resetDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `in ${diffDays} days`;
    
    return resetDate.toLocaleDateString();
  };

  return {
    ...usageStatus,
    isLimitReached,
    isUnlimited,
    checkAndIncrement,
    reload: loadUsageStatus,
    getResetDateFormatted
  };
};

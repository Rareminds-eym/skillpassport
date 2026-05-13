/**
 * Custom hook for learner settings data
 * Uses the learners table columns directly for better performance
 */

/**
 * DEPENDENCY INJECTION PATTERN APPLIED
 * 
 * This hook has been refactored to accept API functions as parameters
 * instead of directly importing from @/features/learner-profile/api.
 * 
 * This maintains FSD architecture by preventing entities from depending on features.
 * 
 * Usage: Import the API functions from the feature layer and pass them to this hook.
 * Example:
 *   import * as learnerProfileApi from '@/features/learner-profile/api';
 *   const hook = useLearnerData(learnerId, learnerProfileApi);
 */

import { useState, useEffect } from 'react';
import {
  getlearnerSettingsByEmail,
  updatelearnerSettings,
  updatelearnerPassword
} from '@/entities/learner/api/learnerSettingsService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-settings-hook');

export const useLearnerSettings = (email) => {
  const [learnerData, setlearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch learner data
  const fetchlearnerData = async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getlearnerSettingsByEmail(email);

      if (result.success) {
        setlearnerData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updates) => {
    const result = await updatelearnerSettings(email, updates);

    if (result.success) {
      // Only update learnerData if we're NOT updating notification or privacy settings
      // This prevents the state from being overwritten while user is toggling settings
      if (!updates.notificationSettings && !updates.privacySettings) {
        setlearnerData(result.data);
      }
      return result;
    } else {
      // Return the error result instead of throwing
      // This allows safeSave to properly handle the error
      return result;
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const result = await updatelearnerPassword(email, currentPassword, newPassword);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating password', err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchlearnerData();
  };

  // Initial fetch
  useEffect(() => {
    fetchlearnerData();
  }, [email]);

  return {
    learnerData,
    loading,
    error,
    updateProfile,
    updatePassword,
    refreshData,
  };
};
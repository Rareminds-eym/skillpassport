/**
 * Custom hook for student settings data
 * Uses the students table columns directly for better performance
 */

/**
 * DEPENDENCY INJECTION PATTERN APPLIED
 * 
 * This hook has been refactored to accept API functions as parameters
 * instead of directly importing from @/features/student-profile/api.
 * 
 * This maintains FSD architecture by preventing entities from depending on features.
 * 
 * Usage: Import the API functions from the feature layer and pass them to this hook.
 * Example:
 *   import * as studentProfileApi from '@/features/student-profile/api';
 *   const hook = useStudentData(studentId, studentProfileApi);
 */

import { useState, useEffect } from 'react';
import {
  getStudentSettingsByEmail,
  updateStudentSettings,
  updateStudentPassword
} from '@/entities/student/api/studentSettingsService';
export const useStudentSettings = (email) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch student data
  const fetchStudentData = async () => {
    if (!email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getStudentSettingsByEmail(email);

      if (result.success) {
        setStudentData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Error fetching student settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update profile data
  const updateProfile = async (updates) => {
    const result = await updateStudentSettings(email, updates);

    if (result.success) {
      // Only update studentData if we're NOT updating notification or privacy settings
      // This prevents the state from being overwritten while user is toggling settings
      if (!updates.notificationSettings && !updates.privacySettings) {
        setStudentData(result.data);
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
      const result = await updateStudentPassword(email, currentPassword, newPassword);

      if (result.success) {
        return { success: true, message: result.message };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('❌ Error updating password:', err);
      throw err;
    }
  };

  // Refresh data
  const refreshData = () => {
    fetchStudentData();
  };

  // Initial fetch
  useEffect(() => {
    fetchStudentData();
  }, [email]);

  return {
    studentData,
    loading,
    error,
    updateProfile,
    updatePassword,
    refreshData,
  };
};
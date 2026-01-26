import { useState, useEffect } from 'react';
import ProfileValidationService from '../services/profileValidationService';

/**
 * Hook to check and monitor student profile completion status
 * @param {string} studentId - Student's ID
 * @param {boolean} enabled - Whether to fetch profile completion status
 * @returns {Object} Profile completion status and methods
 */
export const useProfileCompletion = (studentId, enabled = true) => {
  const [profileStatus, setProfileStatus] = useState({
    isComplete: false,
    completionPercentage: 0,
    missingFields: [],
    studentType: null,
    message: '',
    isLoading: true,
    error: null
  });

  const [lastChecked, setLastChecked] = useState(null);

  // Check profile completion
  const checkProfileCompletion = async (force = false) => {
    if (!studentId || !enabled) {
      setProfileStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Avoid frequent checks unless forced
    const now = Date.now();
    if (!force && lastChecked && (now - lastChecked) < 30000) { // 30 seconds cache
      return;
    }

    setProfileStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await ProfileValidationService.validateProfileForJobApplication(studentId);
      
      setProfileStatus({
        isComplete: result.isComplete,
        completionPercentage: result.completionPercentage,
        missingFields: result.missingFields,
        studentType: result.studentType,
        message: result.message,
        isLoading: false,
        error: null
      });
      
      setLastChecked(now);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      setProfileStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to check profile completion'
      }));
    }
  };

  // Initial check
  useEffect(() => {
    checkProfileCompletion();
  }, [studentId, enabled]);

  // Refresh profile status (useful after profile updates)
  const refreshProfileStatus = () => {
    checkProfileCompletion(true);
  };

  // Get completion status color
  const getCompletionColor = () => {
    if (profileStatus.completionPercentage >= 80) return 'green';
    if (profileStatus.completionPercentage >= 60) return 'yellow';
    return 'red';
  };

  // Get completion status text
  const getCompletionText = () => {
    if (profileStatus.isComplete) return 'Profile Complete';
    if (profileStatus.completionPercentage >= 80) return 'Almost Complete';
    if (profileStatus.completionPercentage >= 60) return 'Partially Complete';
    return 'Incomplete Profile';
  };

  // Check if profile meets minimum requirements for job applications
  const canApplyToJobs = () => {
    return profileStatus.isComplete || profileStatus.completionPercentage >= 80;
  };

  return {
    ...profileStatus,
    refreshProfileStatus,
    getCompletionColor,
    getCompletionText,
    canApplyToJobs,
    // Convenience methods
    isProfileComplete: profileStatus.isComplete,
    needsProfileCompletion: !profileStatus.isComplete && profileStatus.completionPercentage < 80
  };
};

export default useProfileCompletion;
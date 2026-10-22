// TODO: Dependency Injection Required
// This hook imports API functions from @/features/learner-profile/api
// Options to fix:
// 1. Move these API functions to @/entities/learner/api (if they're entity-level operations)
// 2. Pass the API functions as parameters to this hook
// 3. Create a service interface in entities and inject the implementation
//
// For now, this import is flagged for refactoring.

/**
 * Hook to fetch learner data from Supabase JSONB profile by EMAIL
 * 
 * Works with your actual learners table structure (profile JSONB column)
 */

import { useEffect, useState, useRef } from 'react';
import {
  getlearnerByEmail,
  updateCertificatesByEmail,
  updateEducationByEmail,
  updateExperienceByEmail,
  updateProjectsByEmail,
  updateSingleTrainingById,
  updateSoftSkillsByEmail,
  updatelearnerByEmail,
  updateTechnicalSkillsByEmail,
  updateTrainingByEmail
} from '@/entities/learner/api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-data-by-email');

export const useLearnerDataByEmail = (email?: string, _fallbackToMock = true) => {
  const [profileState, setProfileState] = useState<{email: string | undefined; data: any}>({ email, data: null });
  const learnerData = profileState.email === email ? profileState.data : null;
  const identity = useRef(email);
  identity.current = email;
  const sequence = useRef(0);
  const revision = useRef(0);
  const setlearnerData = (data: any, _notify = true) => {
    if (identity.current !== email) return;
    const value = data ? { ...data, recommendation_revision: ++revision.current } : null;
    setProfileState({ email, data: value });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acceptSavedResult = (result: { data?: any; refreshError?: string }) => {
    if (identity.current === email) {
      // Keep the last complete profile if only the post-save read failed.
      if (result.data && !result.refreshError) setlearnerData(result.data);
      setError(result.refreshError ? `Changes were saved, but the profile could not be refreshed. ${result.refreshError}` : null);
    }
    return { success: true, ...(result.refreshError ? { refreshError: result.refreshError } : {}) };
  };

  useEffect(() => {
    const ticket = ++sequence.current;
    const current = () => ticket === sequence.current && identity.current === email;
    setlearnerData(null, false);
    setError(null);
    const fetchData = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);


        const result = await getlearnerByEmail(email);
        if (!current()) return;

        if (result.success && result.data) {
          setlearnerData(result.data, false);
          setError(null);
        } else {
          // Check if it's an RLS error
          const errorMsg = result.error || 'Learner not found';
          const lowerError = errorMsg.toLowerCase();
          if (lowerError.includes('row-level security') ||
            lowerError.includes('rls') ||
            lowerError.includes('permission denied')) {
            setError('Profile access could not be verified. Please contact support.');
          } else {
            setError(errorMsg);
          }
          setlearnerData(null); // No fallback to mock data
        }
      } catch (err: any) {
        if (!current()) return;
        logger.error('Error fetching learner data', err instanceof Error ? err : new Error(String(err)), { email });
        setError(err.message);
        setlearnerData(null);
      } finally {
        if (current()) setLoading(false);
      }
    };

    fetchData();
    return () => { sequence.current++; };
  }, [email]);

  const refresh = async () => {
    if (!email) {
      return;
    }

    const ticket = ++sequence.current;
    setLoading(true);
    try {
    const result = await getlearnerByEmail(email);
    if (ticket !== sequence.current || identity.current !== email) return;

    if (result.success) {
      setlearnerData(result.data, false);
      setError(null);
    } else {
      logger.error('Error loading data', new Error(result.error || 'Unknown error'), { email });
      setError(result.error);
    }

    } catch {
      if (ticket === sequence.current && identity.current === email) setError('Unable to refresh learner profile');
    } finally {
      if (ticket === sequence.current && identity.current === email) setLoading(false);
    }
  };

  // Update functions that work with JSONB profile
  const updateProfile = async (updates: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updatelearnerByEmail(email, updates);
      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Profile update failed');
      }
    } catch (err: any) {
      logger.error('Error updating profile', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateEducation = async (educationData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updateEducationByEmail(email, educationData);
      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Education update failed');
      }
    } catch (err: any) {
      logger.error('Error updating education', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateTraining = async (trainingData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updateTrainingByEmail(email, trainingData);

      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Training update failed');
      }
    } catch (err: any) {
      logger.error('Error updating training', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateSingleTraining = async (trainingId: any, updateData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updateSingleTrainingById(trainingId, updateData);

      if (result.success) {
        // Refresh the entire learner data to get updated training list
        try {
          const refreshResult = await getlearnerByEmail(email);
          return acceptSavedResult(refreshResult.success ? refreshResult : {
            refreshError: refreshResult.error || 'Unable to refresh the saved learner profile',
          });
        } catch {
          return acceptSavedResult({ refreshError: 'Unable to refresh the saved learner profile' });
        }
      } else {
        throw new Error(result.error || 'Training update failed');
      }
    } catch (err: any) {
      logger.error('Error updating single training', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateExperience = async (experienceData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updateExperienceByEmail(email, experienceData);
      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Experience update failed');
      }
    } catch (err: any) {
      logger.error('Error updating experience', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateTechnicalSkills = async (skillsData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updateTechnicalSkillsByEmail(email, skillsData);
      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Skills update failed');
      }
    } catch (err: any) {
      logger.error('Error updating technical skills', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateSoftSkills = async (skillsData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      const result = await updateSoftSkillsByEmail(email, skillsData);
      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Skills update failed');
      }
    } catch (err: any) {
      logger.error('Error updating soft skills', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateSkills = async (skillsData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    try {
      // Since updateSkillsByEmail doesn't exist, we'll use the technical skills function
      const result = await updateTechnicalSkillsByEmail(email, skillsData);
      if (result.success) {
        return acceptSavedResult(result);
      } else {
        throw new Error(result.error || 'Skills update failed');
      }
    } catch (err: any) {
      logger.error('Error updating skills', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateProjects = async (projectsData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    const result = await updateProjectsByEmail(email, projectsData);
    if (result.success) {
      acceptSavedResult(result);
    }
    return result;
  };

  const updateCertificates = async (certificatesData: any) => {
    if (!email) return {success:false,error:'Learner email is required'};
    const result = await updateCertificatesByEmail(email, certificatesData);
    if (result.success) {
      acceptSavedResult(result);
    }
    return result;
  };

  return {
    learnerData,
    loading,
    error,
    refresh,
    updateProfile,
    updateEducation,
    updateTraining,
    updateSingleTraining,
    updateExperience,
    updateSkills,
    updateTechnicalSkills,
    updateSoftSkills,
    updateProjects,      // ADD THIS
    updateCertificates,  // ADD THIS
  };
};

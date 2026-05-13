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

import { useEffect, useState } from 'react';
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

export const useLearnerDataByEmail = (email, fallbackToMock = true) => {
  const [learnerData, setlearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);


        const result = await getlearnerByEmail(email);

        if (result.success && result.data) {
          setlearnerData(result.data);
          setError(null);
        } else {
          // Check if it's an RLS error
          const errorMsg = result.error || 'Learner not found';
          if (errorMsg.toLowerCase().includes('row-level security') ||
            errorMsg.toLowerCase().includes('rls') ||
            errorMsg.toLowerCase().includes('permission denied')) {
            setError('Database access blocked. Please disable RLS in Supabase.');
          } else {
            setError(errorMsg);
          }
          setlearnerData(null); // No fallback to mock data
        }
      } catch (err) {
        logger.error('Error fetching learner data', err instanceof Error ? err : new Error(String(err)), { email });
        setError(err.message);
        setlearnerData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  const refresh = async () => {
    if (!email) {
      return;
    }

    setLoading(true);
    const result = await getlearnerByEmail(email);

    if (result.success) {
      setlearnerData(result.data);
      setError(null);
    } else {
      logger.error('Error loading data', new Error(result.error || 'Unknown error'), { email });
      setError(result.error);
    }

    setLoading(false);
  };

  // Update functions that work with JSONB profile
  const updateProfile = async (updates) => {
    try {
      const result = await updatelearnerByEmail(email, updates);
      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating profile', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateEducation = async (educationData) => {
    try {
      const result = await updateEducationByEmail(email, educationData);
      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating education', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateTraining = async (trainingData) => {
    try {
      const result = await updateTrainingByEmail(email, trainingData);

      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating training', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateSingleTraining = async (trainingId, updateData) => {
    try {
      const result = await updateSingleTrainingById(trainingId, updateData);

      if (result.success) {
        // Refresh the entire learner data to get updated training list
        const refreshResult = await getlearnerByEmail(email);
        if (refreshResult.success) {
          setlearnerData(refreshResult.data);
          // Embedding regeneration handled by database trigger
        }
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating single training', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateExperience = async (experienceData) => {
    try {
      const result = await updateExperienceByEmail(email, experienceData);
      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating experience', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateTechnicalSkills = async (skillsData) => {
    try {
      const result = await updateTechnicalSkillsByEmail(email, skillsData);
      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating technical skills', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateSoftSkills = async (skillsData) => {
    try {
      const result = await updateSoftSkillsByEmail(email, skillsData);
      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating soft skills', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateSkills = async (skillsData) => {
    try {
      // Since updateSkillsByEmail doesn't exist, we'll use the technical skills function
      const result = await updateTechnicalSkillsByEmail(email, skillsData);
      if (result.success) {
        setlearnerData(result.data);
        // Embedding regeneration handled by database trigger
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      logger.error('Error updating skills', err instanceof Error ? err : new Error(String(err)), { email });
      return { success: false, error: err.message };
    }
  };

  const updateProjects = async (projectsData) => {
    const result = await updateProjectsByEmail(email, projectsData);
    if (result.success) {
      // Refresh data after successful update
      await refresh();
      // Embedding regeneration handled by database trigger
    }
    return result;
  };

  const updateCertificates = async (certificatesData) => {
    const result = await updateCertificatesByEmail(email, certificatesData);
    if (result.success) {
      setlearnerData(result.data);
      // Embedding regeneration handled by database trigger
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

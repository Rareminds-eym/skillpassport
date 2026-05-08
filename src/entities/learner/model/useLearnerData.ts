// TODO: Dependency Injection Required
// This hook imports API functions from @/features/learner-profile/api
// Options to fix:
// 1. Move these API functions to @/entities/learner/api (if they're entity-level operations)
// 2. Pass the API functions as parameters to this hook
// 3. Create a service interface in entities and inject the implementation
//
// For now, this import is flagged for refactoring.

import { useState, useEffect, useCallback } from 'react';
import {
  getCompleteLearnerData,
  updateLearnerProfile,
  addEducation,
  updateEducation,
  deleteEducation,
  addTraining,
  updateTraining,
  deleteTraining,
  addExperience,
  updateExperience,
  deleteExperience,
  addTechnicalSkill,
  updateTechnicalSkill,
  deleteTechnicalSkill,
  addSoftSkill,
  updateSoftSkill
} from '@/entities/learner/api';

/**
 * Custom hook to manage learner data from Supabase
 * @param {string} learnerId - The ID of the learner
 * @param {boolean} useMockData - Whether to use mock data as fallback (default: false)
 */
export const useLearnerData = (learnerId, useMockData = false) => {
  const [learnerData, setlearnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all learner data
  const fetchlearnerData = useCallback(async () => {
    if (!learnerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getCompleteLearnerData(learnerId);

      if (data.errors && !useMockData) {
        setError(data.errors);
      }

      setlearnerData(data);
    } catch (err) {
      setError(err);

      // If useMockData is true, fall back to mock data
      if (useMockData) {
        const mockData = await import('../../../widgets/learner-dashboard/model/mockData');
        setlearnerData({
          profile: mockData.learnerData,
          education: mockData.educationData,
          training: mockData.trainingData,
          experience: mockData.experienceData,
          technicalSkills: mockData.technicalSkills,
          softSkills: mockData.softSkills,
          opportunities: mockData.opportunities,
          recentUpdates: mockData.recentUpdates,
          suggestions: mockData.suggestions.map((msg, idx) => ({
            id: idx + 1,
            message: msg,
            priority: mockData.suggestions.length - idx,
            is_active: true
          }))
        });
      }
    } finally {
      setLoading(false);
    }
  }, [learnerId, useMockData]);

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount and when learnerId or refreshKey changes
  useEffect(() => {
    fetchlearnerData();
  }, [fetchlearnerData, refreshKey]);

  // Profile operations
  const updateProfile = async (updates) => {
    try {
      const result = await updateLearnerProfile(learnerId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Education operations
  const addEducationRecord = async (educationData) => {
    try {
      const result = await addEducation({ ...educationData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateEducationRecord = async (educationId, updates) => {
    try {
      const result = await updateEducation(educationId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteEducationRecord = async (educationId) => {
    try {
      const result = await deleteEducation(educationId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Training operations
  const addTrainingRecord = async (trainingData) => {
    try {
      const result = await addTraining({ ...trainingData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateTrainingRecord = async (trainingId, updates) => {
    try {
      const result = await updateTraining(trainingId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteTrainingRecord = async (trainingId) => {
    try {
      const result = await deleteTraining(trainingId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Experience operations
  const addExperienceRecord = async (experienceData) => {
    try {
      const result = await addExperience({ ...experienceData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateExperienceRecord = async (experienceId, updates) => {
    try {
      const result = await updateExperience(experienceId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteExperienceRecord = async (experienceId) => {
    try {
      const result = await deleteExperience(experienceId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Technical skills operations
  const addTechnicalSkillRecord = async (skillData) => {
    try {
      const result = await addTechnicalSkill({ ...skillData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateTechnicalSkillRecord = async (skillId, updates) => {
    try {
      const result = await updateTechnicalSkill(skillId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteTechnicalSkillRecord = async (skillId) => {
    try {
      const result = await deleteTechnicalSkill(skillId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  // Soft skills operations
  const addSoftSkillRecord = async (skillData) => {
    try {
      const result = await addSoftSkill({ ...skillData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateSoftSkillRecord = async (skillId, updates) => {
    try {
      const result = await updateSoftSkill(skillId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteSoftSkillRecord = async (skillId) => {
    try {
      // TODO: Implement deleteSoftSkill in learner-profile API
      return { error: 'Not implemented' };
    } catch (err) {
      throw err;
    }
  };

  return {
    // Data
    learnerData,
    loading,
    error,

    // Refresh function
    refresh,

    // Profile operations
    updateProfile,

    // Education operations
    addEducation: addEducationRecord,
    updateEducation: updateEducationRecord,
    deleteEducation: deleteEducationRecord,

    // Training operations
    addTraining: addTrainingRecord,
    updateTraining: updateTrainingRecord,
    deleteTraining: deleteTrainingRecord,

    // Experience operations
    addExperience: addExperienceRecord,
    updateExperience: updateExperienceRecord,
    deleteExperience: deleteExperienceRecord,

    // Technical skills operations
    addTechnicalSkill: addTechnicalSkillRecord,
    updateTechnicalSkill: updateTechnicalSkillRecord,
    deleteTechnicalSkill: deleteTechnicalSkillRecord,

    // Soft skills operations
    addSoftSkill: addSoftSkillRecord,
    updateSoftSkill: updateSoftSkillRecord,
    deleteSoftSkill: deleteSoftSkillRecord
  };
};

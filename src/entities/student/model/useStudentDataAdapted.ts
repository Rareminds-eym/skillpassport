// TODO: Dependency Injection Required
// This hook imports API functions from @/features/student-profile/api
// Options to fix:
// 1. Move these API functions to @/entities/student/api (if they're entity-level operations)
// 2. Pass the API functions as parameters to this hook
// 3. Create a service interface in entities and inject the implementation
//
// For now, this import is flagged for refactoring.

import { useState, useEffect, useCallback } from 'react';
import {
  getCompleteStudentData,
  updateStudentProfile,
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
} from '@/entities/student/api';

/**
 * Custom hook to manage student data from Supabase (ADAPTED for existing schema)
 * Works with existing students table that uses JSONB profile column
 * 
 * @param {string} userId - The userId (UUID) of the student from auth.users
 * @param {boolean} useMockData - Whether to use mock data as fallback (default: false)
 */
export const useStudentDataAdapted = (userId, useMockData = false) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all student data
  const fetchStudentData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getCompleteStudentData(userId);

      if (data.errors && !useMockData) {
        setError(data.errors);
      }

      setStudentData(data);
    } catch (err) {
      setError(err);

      // If useMockData is true, fall back to mock data
      if (useMockData) {
        const mockData = await import('../../../widgets/student-dashboard/model/mockData');
        setStudentData({
          profile: mockData.studentData,
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
            isActive: true
          }))
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId, useMockData]);

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount and when userId or refreshKey changes
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData, refreshKey]);

  // Profile operations
  const updateProfile = async (updates) => {
    try {
      const result = await updateStudentProfile(userId, updates);
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
      const result = await addEducation(userId, educationData);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateEducationRecord = async (educationId, updates) => {
    try {
      const result = await updateEducation(userId, educationId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteEducationRecord = async (educationId) => {
    try {
      const result = await deleteEducation(userId, educationId);
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
      const result = await addTraining(userId, trainingData);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateTrainingRecord = async (trainingId, updates) => {
    try {
      const result = await updateTraining(userId, trainingId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteTrainingRecord = async (trainingId) => {
    try {
      const result = await deleteTraining(userId, trainingId);
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
      const result = await addExperience(userId, experienceData);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateExperienceRecord = async (experienceId, updates) => {
    try {
      const result = await updateExperience(userId, experienceId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteExperienceRecord = async (experienceId) => {
    try {
      const result = await deleteExperience(userId, experienceId);
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
      const result = await addTechnicalSkill(userId, skillData);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateTechnicalSkillRecord = async (skillId, updates) => {
    try {
      const result = await updateTechnicalSkill(userId, skillId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteTechnicalSkillRecord = async (skillId) => {
    try {
      const result = await deleteTechnicalSkill(userId, skillId);
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
      const result = await addSoftSkill(userId, skillData);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const updateSoftSkillRecord = async (skillId, updates) => {
    try {
      const result = await updateSoftSkill(userId, skillId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      throw err;
    }
  };

  const deleteSoftSkillRecord = async (skillId) => {
    try {
      // TODO: Implement deleteSoftSkill in student-profile API
      return { error: 'Not implemented' };
    } catch (err) {
      throw err;
    }
  };

  return {
    // Data
    studentData,
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

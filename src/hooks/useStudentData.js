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
  updateSoftSkill,
  deleteSoftSkill,
} from '../services/studentService';

/**
 * Custom hook to manage student data from Supabase
 * @param {string} studentId - The ID of the student
 * @param {boolean} useMockData - Whether to use mock data as fallback (default: false)
 */
export const useStudentData = (studentId, useMockData = false) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch all student data
  const fetchStudentData = useCallback(async () => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getCompleteStudentData(studentId);

      if (data.errors && !useMockData) {
        setError(data.errors);
      }

      setStudentData(data);
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError(err);

      // If useMockData is true, fall back to mock data
      if (useMockData) {
        const mockData = await import('../components/Students/data/mockData');
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
            is_active: true,
          })),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [studentId, useMockData]);

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Load data on mount and when studentId or refreshKey changes
  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData, refreshKey]);

  // Profile operations
  const updateProfile = async (updates) => {
    try {
      const result = await updateStudentProfile(studentId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Education operations
  const addEducationRecord = async (educationData) => {
    try {
      const result = await addEducation({ ...educationData, student_id: studentId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error adding education:', err);
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
      console.error('Error updating education:', err);
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
      console.error('Error deleting education:', err);
      throw err;
    }
  };

  // Training operations
  const addTrainingRecord = async (trainingData) => {
    try {
      const result = await addTraining({ ...trainingData, student_id: studentId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error adding training:', err);
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
      console.error('Error updating training:', err);
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
      console.error('Error deleting training:', err);
      throw err;
    }
  };

  // Experience operations
  const addExperienceRecord = async (experienceData) => {
    try {
      const result = await addExperience({ ...experienceData, student_id: studentId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error adding experience:', err);
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
      console.error('Error updating experience:', err);
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
      console.error('Error deleting experience:', err);
      throw err;
    }
  };

  // Technical skills operations
  const addTechnicalSkillRecord = async (skillData) => {
    try {
      const result = await addTechnicalSkill({ ...skillData, student_id: studentId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error adding technical skill:', err);
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
      console.error('Error updating technical skill:', err);
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
      console.error('Error deleting technical skill:', err);
      throw err;
    }
  };

  // Soft skills operations
  const addSoftSkillRecord = async (skillData) => {
    try {
      const result = await addSoftSkill({ ...skillData, student_id: studentId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error adding soft skill:', err);
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
      console.error('Error updating soft skill:', err);
      throw err;
    }
  };

  const deleteSoftSkillRecord = async (skillId) => {
    try {
      const result = await deleteSoftSkill(skillId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error deleting soft skill:', err);
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
    deleteSoftSkill: deleteSoftSkillRecord,
  };
};

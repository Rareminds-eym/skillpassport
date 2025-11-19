/**
 * Hook to fetch student data from Supabase JSONB profile by EMAIL
 * 
 * Works with your actual students table structure (profile JSONB column)
 */

import { useState, useEffect } from 'react';
import {
  getStudentByEmail,
  updateStudentByEmail,
  updateEducationByEmail,
  updateTrainingByEmail,
  updateExperienceByEmail,
  updateTechnicalSkillsByEmail,
  updateSoftSkillsByEmail,
  updateProjectsByEmail,
  updateCertificatesByEmail
} from '../services/studentServiceProfile';

export const useStudentDataByEmail = (email, fallbackToMock = true) => {
  const [studentData, setStudentData] = useState(null);
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


        const result = await getStudentByEmail(email);

        if (result.success && result.data) {
          setStudentData(result.data);
          setError(null);
        } else {
          // Check if it's an RLS error
          const errorMsg = result.error || 'Student not found';
          if (errorMsg.toLowerCase().includes('row-level security') ||
            errorMsg.toLowerCase().includes('rls') ||
            errorMsg.toLowerCase().includes('permission denied')) {
            setError('⚠️ Database access blocked. Please disable RLS in Supabase. See FIX_RLS.md');
            console.error('🔒 RLS is blocking access! Run this in Supabase SQL Editor:');
            console.error('ALTER TABLE students DISABLE ROW LEVEL SECURITY;');
          } else {
            setError(errorMsg);
          }
          setStudentData(null); // No fallback to mock data
        }
      } catch (err) {
        console.error('❌ Error fetching student data:', err);
        setError(err.message);
        setStudentData(null);
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
    const result = await getStudentByEmail(email);

    if (result.success) {
      setStudentData(result.data);
      setError(null);
    } else {
      console.error('❌ refresh: Error loading data:', result.error);
      setError(result.error);
    }

    setLoading(false);
  };

  // Update functions that work with JSONB profile
  const updateProfile = async (updates) => {
    try {
      const result = await updateStudentByEmail(email, updates);
      if (result.success) {
        setStudentData(result.data);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      return { success: false, error: err.message };
    }
  };

  const updateEducation = async (educationData) => {
    try {
      const result = await updateEducationByEmail(email, educationData);
      if (result.success) {
        setStudentData(result.data);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating education:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTraining = async (trainingData) => {
    try {
      const result = await updateTrainingByEmail(email, trainingData);
      if (result.success) {
        setStudentData(result.data);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating training:', err);
      return { success: false, error: err.message };
    }
  };

  const updateExperience = async (experienceData) => {
    try {
      const result = await updateExperienceByEmail(email, experienceData);
      if (result.success) {
        setStudentData(result.data);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating experience:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTechnicalSkills = async (skillsData) => {
    try {
      const result = await updateTechnicalSkillsByEmail(email, skillsData);
      if (result.success) {
        setStudentData(result.data);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating technical skills:', err);
      return { success: false, error: err.message };
    }
  };

  const updateSoftSkills = async (skillsData) => {
    try {
      const result = await updateSoftSkillsByEmail(email, skillsData);
      if (result.success) {
        setStudentData(result.data);
        return { success: true };
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error updating soft skills:', err);
      return { success: false, error: err.message };
    }
  };

  const updateProjects = async (projectsData) => {
    const result = await updateProjectsByEmail(email, projectsData);
    if (result.success) {
      // Refresh data after successful update
      await refresh();
    }
    return result;
  };

  const updateCertificates = async (certificatesData) => {
    const result = await updateCertificatesByEmail(email, certificatesData);
    if (result.success) {
      setStudentData(result.data);
    }
    return result;
  };

  return {
    studentData,
    loading,
    error,
    refresh,
    updateProfile,
    updateEducation,
    updateTraining,
    updateExperience,
    updateTechnicalSkills,
    updateSoftSkills,
    updateProjects,      // ADD THIS
    updateCertificates,  // ADD THIS
  };
};
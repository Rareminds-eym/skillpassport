/**
 * Consolidated Learner Profile Hook
 * 
 * Consolidates the following hooks:
 * - useLearnerData (basic profile data)
 * - useLearnerDataById (fetch by ID)
 * - useLearnerDataByEmail (fetch by email)
 * - useLearnerEducation (education records)
 * - useLearnerExperience (work experience)
 * - useLearnerSkills (technical and soft skills)
 * 
 * Returns: data, education, experience, skills (technical & soft)
 */

import { useState, useEffect, useCallback } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-profile');
import {
  getlearnerById,
  getlearnerByEmail,
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
  updateSoftSkill,
  deleteSoftSkill
} from '@/features/learner-profile/api';

export interface UselearnerProfileOptions {
  learnerId?: string | null;
  email?: string | null;
  enabled?: boolean;
}

export interface Education {
  id: string;
  degree: string;
  department: string;
  university: string;
  institution: string;
  yearOfPassing: string;
  year_of_passing: string;
  cgpa: number;
  level: string;
  status: string;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  start_date: string;
  end_date: string;
  duration: string;
  description: string;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  type: 'technical' | 'soft';
  level: number;
  description: string;
  approval_status: string;
  verified: boolean;
  processing: boolean;
  enabled: boolean;
  has_pending_edit: boolean;
  verified_data?: any;
  pending_edit_data?: any;
  createdAt: string;
  updatedAt: string;
}

export const useLearnerProfile = ({ learnerId, email, enabled = true }: UselearnerProfileOptions) => {
  const [data, setData] = useState<any>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [technicalSkills, setTechnicalSkills] = useState<Skill[]>([]);
  const [softSkills, setSoftSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    if ((!learnerId && !email) || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let profileData;
      let actualLearnerId = learnerId;

      // Fetch by email or ID
      if (email && !learnerId) {
        const result = await getlearnerByEmail(email);
        if (result.success && result.data) {
          profileData = result.data;
          actualLearnerId = result.data.id;
        } else {
          throw new Error(result.error || 'Learner not found');
        }
      } else if (learnerId) {
        const result = await getlearnerById(learnerId);
        if (result.success && result.data) {
          profileData = result.data;
        } else {
          throw new Error(result.error || 'Learner not found');
        }
      }

      setData(profileData);

      // Fetch education, experience, and skills in parallel
      if (actualLearnerId) {
        await Promise.all([
          fetchEducation(actualLearnerId),
          fetchExperience(actualLearnerId),
          fetchSkills(actualLearnerId)
        ]);
      }
    } catch (err: any) {
      logger.error('Error fetching learner profile', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [learnerId, email, enabled]);

  // Fetch education records
  const fetchEducation = async (_sid: string) => {
    try {
      const response = await apiPost('/learners/profile', { action: 'get-education' });
      const eduData = response?.data ?? [];

      const transformedData = (eduData || []).map((item: any) => ({
        id: item.id,
        degree: item.degree,
        department: item.department,
        university: item.university,
        institution: item.university,
        yearOfPassing: item.year_of_passing,
        year_of_passing: item.year_of_passing,
        cgpa: item.cgpa,
        level: item.level,
        status: item.status,
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setEducation(transformedData);
    } catch (err) {
      logger.error('Error fetching education', err as Error);
    }
  };

  // Fetch experience records
  const fetchExperience = async (_sid: string) => {
    try {
      const response = await apiPost('/learners/profile', { action: 'get-experience' });
      const expData = response?.data ?? [];

      const transformedData = (expData || []).map((item: any) => ({
        id: item.id,
        organization: item.organization,
        role: item.role,
        startDate: item.start_date,
        endDate: item.end_date,
        start_date: item.start_date,
        end_date: item.end_date,
        duration: item.duration,
        description: item.description,
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setExperience(transformedData);
    } catch (err) {
      logger.error('Error fetching experience', err as Error);
    }
  };

  // Fetch skills (technical and soft)
  const fetchSkills = async (_sid: string) => {
    try {
      const response = await apiPost('/learners/profile', { action: 'get-skills' });
      const skillsData = response?.data ?? [];

      const transformedData = (skillsData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        level: item.level,
        description: item.description,
        approval_status: item.approval_status,
        verified: item.approval_status === 'approved' || item.approval_status === 'verified',
        processing: item.approval_status === 'pending',
        enabled: item.enabled !== false,
        has_pending_edit: item.has_pending_edit || false,
        verified_data: item.verified_data,
        pending_edit_data: item.pending_edit_data,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setTechnicalSkills(transformedData.filter((s: any) => s.type === 'technical'));
      setSoftSkills(transformedData.filter((s: any) => s.type === 'soft'));
    } catch (err) {
      logger.error('Error fetching skills', err as Error);
    }
  };

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData, refreshKey]);

  // Profile operations
  const updateProfile = async (updates: any) => {
    try {
      const result = await updateLearnerProfile(learnerId!, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error updating profile', err as Error);
      throw err;
    }
  };

  // Education operations
  const addEducationRecord = async (educationData: any) => {
    try {
      const result = await addEducation({ ...educationData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error adding education', err as Error);
      throw err;
    }
  };

  const updateEducationRecord = async (educationId: string, updates: any) => {
    try {
      const result = await updateEducation(educationId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error updating education', err as Error);
      throw err;
    }
  };

  const deleteEducationRecord = async (educationId: string) => {
    try {
      const result = await deleteEducation(educationId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error deleting education', err as Error);
      throw err;
    }
  };

  // Experience operations
  const addExperienceRecord = async (experienceData: any) => {
    try {
      const result = await addExperience({ ...experienceData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error adding experience', err as Error);
      throw err;
    }
  };

  const updateExperienceRecord = async (experienceId: string, updates: any) => {
    try {
      const result = await updateExperience(experienceId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error updating experience', err as Error);
      throw err;
    }
  };

  const deleteExperienceRecord = async (experienceId: string) => {
    try {
      const result = await deleteExperience(experienceId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error deleting experience', err as Error);
      throw err;
    }
  };

  // Skill operations
  const addTechnicalSkillRecord = async (skillData: any) => {
    try {
      const result = await addTechnicalSkill({ ...skillData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error adding technical skill', err as Error);
      throw err;
    }
  };

  const updateTechnicalSkillRecord = async (skillId: string, updates: any) => {
    try {
      const result = await updateTechnicalSkill(skillId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error updating technical skill', err as Error);
      throw err;
    }
  };

  const deleteTechnicalSkillRecord = async (skillId: string) => {
    try {
      const result = await deleteTechnicalSkill(skillId);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error deleting technical skill', err as Error);
      throw err;
    }
  };

  const addSoftSkillRecord = async (skillData: any) => {
    try {
      const result = await addSoftSkill({ ...skillData, learner_id: learnerId });
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error adding soft skill', err as Error);
      throw err;
    }
  };

  const updateSoftSkillRecord = async (skillId: string, updates: any) => {
    try {
      const result = await updateSoftSkill(skillId, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      logger.error('Error updating soft skill', err as Error);
      throw err;
    }
  };

  const deleteSoftSkillRecord = async (skillId: string) => {
    try {
      // TODO: Implement deleteSoftSkill in learner-profile API
      return { error: 'Not implemented' };
    } catch (err) {
      logger.error('Error deleting soft skill', err as Error);
      throw err;
    }
  };

  return {
    // Data
    data,
    education,
    experience,
    skills: {
      technical: technicalSkills,
      soft: softSkills
    },
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

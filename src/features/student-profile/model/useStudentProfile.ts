/**
 * Consolidated Student Profile Hook
 * 
 * Consolidates the following hooks:
 * - useStudentData (basic profile data)
 * - useStudentDataById (fetch by ID)
 * - useStudentDataByEmail (fetch by email)
 * - useStudentEducation (education records)
 * - useStudentExperience (work experience)
 * - useStudentSkills (technical and soft skills)
 * 
 * Returns: data, education, experience, skills (technical & soft)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
// TODO: Uncomment when CRUD functions are added to studentProfileService
// import { 
//   getStudentById,
//   getStudentByEmail,
//   updateStudentProfile,
//   addEducation,
//   updateEducation,
//   deleteEducation,
//   addTraining,
//   updateTraining,
//   deleteTraining,
//   addExperience,
//   updateExperience,
//   deleteExperience,
//   addTechnicalSkill,
//   updateTechnicalSkill,
//   deleteTechnicalSkill,
//   addSoftSkill,
//   updateSoftSkill,
//   deleteSoftSkill
// } from '../api/studentProfileService';

export interface UseStudentProfileOptions {
  studentId?: string | null;
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

export const useStudentProfile = ({ studentId, email, enabled = true }: UseStudentProfileOptions) => {
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
    if ((!studentId && !email) || !enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let profileData;
      let actualStudentId = studentId;

      // Fetch by email or ID
      if (email && !studentId) {
        const result = await getStudentByEmail(email);
        if (result.success && result.data) {
          profileData = result.data;
          actualStudentId = result.data.id;
        } else {
          throw new Error(result.error || 'Student not found');
        }
      } else if (studentId) {
        const result = await getStudentById(studentId);
        if (result.success && result.data) {
          profileData = result.data;
        } else {
          throw new Error(result.error || 'Student not found');
        }
      }

      setData(profileData);

      // Fetch education, experience, and skills in parallel
      if (actualStudentId) {
        await Promise.all([
          fetchEducation(actualStudentId),
          fetchExperience(actualStudentId),
          fetchSkills(actualStudentId)
        ]);
      }
    } catch (err: any) {
      console.error('Error fetching student profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [studentId, email, enabled]);

  // Fetch education records
  const fetchEducation = async (sid: string) => {
    try {
      const { data: eduData, error: eduError } = await supabase
        .from('education')
        .select('*')
        .eq('student_id', sid)
        .order('created_at', { ascending: false });

      if (eduError) throw eduError;

      const transformedData = (eduData || []).map(item => ({
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
      console.error('Error fetching education:', err);
    }
  };

  // Fetch experience records
  const fetchExperience = async (sid: string) => {
    try {
      const { data: expData, error: expError } = await supabase
        .from('experience')
        .select('*')
        .eq('student_id', sid)
        .order('created_at', { ascending: false });

      if (expError) throw expError;

      const transformedData = (expData || []).map(item => ({
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
      console.error('Error fetching experience:', err);
    }
  };

  // Fetch skills (technical and soft)
  const fetchSkills = async (sid: string) => {
    try {
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('*')
        .eq('student_id', sid)
        .is('training_id', null)
        .order('created_at', { ascending: false });

      if (skillsError) throw skillsError;

      const transformedData = (skillsData || []).map(item => ({
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

      setTechnicalSkills(transformedData.filter(s => s.type === 'technical'));
      setSoftSkills(transformedData.filter(s => s.type === 'soft'));
    } catch (err) {
      console.error('Error fetching skills:', err);
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
      const result = await updateStudentProfile(studentId!, updates);
      if (result.error) throw result.error;
      refresh();
      return result;
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  // Education operations
  const addEducationRecord = async (educationData: any) => {
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

  const updateEducationRecord = async (educationId: string, updates: any) => {
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

  const deleteEducationRecord = async (educationId: string) => {
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

  // Experience operations
  const addExperienceRecord = async (experienceData: any) => {
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

  const updateExperienceRecord = async (experienceId: string, updates: any) => {
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

  const deleteExperienceRecord = async (experienceId: string) => {
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

  // Skill operations
  const addTechnicalSkillRecord = async (skillData: any) => {
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

  const updateTechnicalSkillRecord = async (skillId: string, updates: any) => {
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

  const deleteTechnicalSkillRecord = async (skillId: string) => {
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

  const addSoftSkillRecord = async (skillData: any) => {
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

  const updateSoftSkillRecord = async (skillId: string, updates: any) => {
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

  const deleteSoftSkillRecord = async (skillId: string) => {
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

import { apiPost } from '@/shared/api/apiClient';
import { showProfileUpdateToast, showProfileErrorToast, PROFILE_UPDATE_MESSAGES } from './profileToast';

export const exampleAddSkill = async (learnerId: string, skillData: any, theme: 'light' | 'dark') => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'upsert-skill', learnerId, skillData });
    if (!result?.data) throw new Error('Failed to add skill');
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.skills, theme);
    return { success: true, data: result.data };
  } catch (error: any) {
    showProfileErrorToast('Failed to add skill', theme);
    return { success: false, error: error.message };
  }
};

export const exampleUpdateEducation = async (educationId: string, updates: any, theme: 'light' | 'dark') => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'upsert-education', educationId, updates });
    if (!result?.data) throw new Error('Failed to update education');
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.education, theme);
    return { success: true, data: result.data };
  } catch (error: any) {
    showProfileErrorToast('Failed to update education', theme);
    return { success: false, error: error.message };
  }
};

export const exampleAddProject = async (learnerId: string, projectData: any, theme: 'light' | 'dark') => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'upsert-project', learnerId, projectData });
    if (!result?.data) throw new Error('Failed to add project');
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.projects, theme);
    return { success: true, data: result.data };
  } catch (error: any) {
    showProfileErrorToast('Failed to add project', theme);
    return { success: false, error: error.message };
  }
};

export const exampleUpdateExperience = async (experienceId: string, updates: any, theme: 'light' | 'dark') => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'upsert-experience', experienceId, updates });
    if (!result?.data) throw new Error('Failed to update experience');
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.experience, theme);
    return { success: true, data: result.data };
  } catch (error: any) {
    showProfileErrorToast('Failed to update experience', theme);
    return { success: false, error: error.message };
  }
};

export const exampleAddCertification = async (learnerId: string, certData: any, theme: 'light' | 'dark') => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'upsert-certificate', learnerId, certData });
    if (!result?.data) throw new Error('Failed to add certification');
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.certifications, theme);
    return { success: true, data: result.data };
  } catch (error: any) {
    showProfileErrorToast('Failed to add certification', theme);
    return { success: false, error: error.message };
  }
};

export const exampleUpdatePersonalInfo = async (learnerId: string, updates: any, theme: 'light' | 'dark') => {
  try {
    const result = await apiPost<any>('/learner-profile/actions', { action: 'update-learner', id: learnerId, updates });
    if (!result?.data) throw new Error('Failed to update personal info');
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.personalInfo, theme);
    return { success: true, data: result.data };
  } catch (error: any) {
    showProfileErrorToast('Failed to update personal information', theme);
    return { success: false, error: error.message };
  }
};

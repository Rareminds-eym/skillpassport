/**
 * Settings Helper Utilities
 * Centralized helper functions to reduce code repetition in MainSettings
 */

import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface Skill {
  id: string;
  enabled: boolean;
  approval_status?: string;
  _hasPendingEdit?: boolean;
}

interface SaveHandlerOptions<T = any> {
  updateFunction: (data: T) => Promise<any>;
  successMessage: string;
  onSuccess?: (data: T) => Promise<void> | void;
  validateData?: (data: T) => string | null;
}

interface CustomInstitutionState {
  initialState: Record<string, boolean | string>;
  institutions: string[];
}

interface ModalStates {
  initialState: Record<string, boolean>;
  modals: string[];
}

interface StudentDataInput {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  location?: string;
  address?: string;
  state?: string;
  country?: string;
  pincode?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  university?: string;
  branch?: string;
  college?: string;
  schoolName?: string;
  registrationNumber?: string;
  enrollmentNumber?: string;
  currentCgpa?: string;
  grade?: string;
  gradeStartDate?: string;
  universityCollegeId?: string;
  universityId?: string;
  schoolId?: string;
  schoolClassId?: string;
  collegeId?: string;
  programId?: string;
  programSectionId?: string;
  semester?: string;
  section?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  bio?: string;
  linkedIn?: string;
  github?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  portfolio?: string;
  gapInStudies?: boolean;
  gapYears?: number;
  gapReason?: string;
  workExperience?: string;
  aadharNumber?: string;
  backlogsHistory?: string;
  currentBacklogs?: number;
  interests?: string;
  languages?: string;
  hobbies?: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  alternatePhone: string;
  location: string;
  address: string;
  state: string;
  country: string;
  pincode: string;
  dateOfBirth: string;
  age: string;
  gender: string;
  bloodGroup: string;
  university: string;
  branch: string;
  college: string;
  schoolName: string;
  registrationNumber: string;
  enrollmentNumber: string;
  currentCgpa: string;
  grade: string;
  gradeStartDate: string;
  universityCollegeId: string;
  universityId: string;
  schoolId: string;
  schoolClassId: string;
  collegeId: string;
  programId: string;
  programSectionId: string;
  semester: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelation: string;
  bio: string;
  linkedIn: string;
  github: string;
  twitter: string;
  facebook: string;
  instagram: string;
  portfolio: string;
  gapInStudies: boolean;
  gapYears: number;
  gapReason: string;
  workExperience: string;
  aadharNumber: string;
  backlogsHistory: string;
  currentBacklogs: number;
  interests: string;
  languages: string;
  hobbies: string;
}

/**
 * Generic toggle handler for skill visibility
 * Works for both technical and soft skills
 */
export const createToggleSkillHandler = (refreshFunction?: () => Promise<void>) => async (skill: Skill, index: number): Promise<void> => {
  if (!skill) return;
  
  const newState = !skill.enabled;
  
  // Don't allow hiding/showing items that are pending verification or approval
  if (skill.approval_status === 'pending' || skill._hasPendingEdit) {
    toast.error("You cannot hide or show skills that are pending verification or approval.", { duration: 4000 });
    return;
  }
  
  try {
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Update only the enabled field directly in database
    const { error } = await supabase
      .from('skills')
      .update({ enabled: newState })
      .eq('id', skill.id);
    
    if (error) throw error;
    
    // Refresh skills to get updated data
    if (refreshFunction && typeof refreshFunction === 'function') {
      await refreshFunction();
    }
    
    toast.success(`Skill ${newState ? 'is now visible' : 'is now hidden'} on your profile.`, { duration: 3000 });
  } catch (error) {
    console.error('Error toggling skill visibility:', error);
    toast.error("Failed to update visibility. Please try again.");
  }
};

/**
 * Generic save handler factory
 * Creates save handlers with consistent error handling and success callbacks
 */
export const createSaveHandler = <T = any>({
  updateFunction,
  successMessage,
  onSuccess,
  validateData,
}: SaveHandlerOptions<T>) => async (data: T, setIsSaving: (saving: boolean) => void): Promise<{ success: boolean; error?: string }> => {
  try {
    setIsSaving(true);
    
    // Optional validation
    if (validateData) {
      const validationError = validateData(data);
      if (validationError) {
        toast.error(validationError);
        return { success: false, error: validationError };
      }
    }
    
    const result = await updateFunction(data);
    
    if (result.success) {
      toast.success(successMessage);
      
      // Execute success callback
      if (onSuccess) {
        await onSuccess(data);
      }
      
      return result;
    } else {
      throw new Error(result.error || 'Update failed');
    }
  } catch (error) {
    console.error('❌ Error in save handler:', error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save changes";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  } finally {
    setIsSaving(false);
  }
};

/**
 * Custom institution state manager
 * Reduces repetitive state management for custom institutions
 */
export const createCustomInstitutionState = (): CustomInstitutionState => {
  const institutions = [
    'School',
    'University',
    'College',
    'SchoolClass',
    'Program',
    'Semester'
  ];
  
  const initialState: Record<string, boolean | string> = {};
  
  institutions.forEach(inst => {
    const showKey = `showCustom${inst}`;
    const nameKey = `custom${inst}Name`;
    
    initialState[showKey] = false;
    initialState[nameKey] = '';
  });
  
  return { initialState, institutions };
};

/**
 * Modal state manager
 * Reduces repetitive modal state management
 */
export const createModalStates = (): ModalStates => {
  const modals = [
    'Education',
    'SoftSkills',
    'TechnicalSkills',
    'Experience',
    'Certificates',
    'Projects'
  ];
  
  const initialState: Record<string, boolean> = {};
  
  modals.forEach(modal => {
    initialState[`show${modal}Modal`] = false;
  });
  
  return { initialState, modals };
};

/**
 * Profile data merger
 * Safely merges profile data with fallbacks
 */
export const mergeProfileData = (studentData: StudentDataInput | null, userEmail?: string): ProfileData | null => {
  if (!studentData || !studentData.id) return null;
  
  return {
    name: studentData.name || "",
    email: studentData.email || userEmail || "",
    phone: studentData.phone || "",
    alternatePhone: studentData.alternatePhone || "",
    location: studentData.location || "",
    address: studentData.address || "",
    state: studentData.state || "",
    country: studentData.country || "India",
    pincode: studentData.pincode || "",
    dateOfBirth: studentData.dateOfBirth || "",
    age: studentData.age || "",
    gender: studentData.gender || "",
    bloodGroup: studentData.bloodGroup || "",
    university: studentData.university || "",
    branch: studentData.branch || "",
    college: studentData.college || "",
    schoolName: studentData.schoolName || "",
    registrationNumber: studentData.registrationNumber || "",
    enrollmentNumber: studentData.enrollmentNumber || "",
    currentCgpa: studentData.currentCgpa || "",
    grade: studentData.grade || "",
    gradeStartDate: studentData.gradeStartDate || "",
    universityCollegeId: studentData.universityCollegeId || "",
    universityId: studentData.universityId || "",
    schoolId: studentData.schoolId || "",
    schoolClassId: studentData.schoolClassId || "",
    collegeId: studentData.collegeId || "",
    programId: studentData.programId || "",
    programSectionId: studentData.programSectionId || "",
    semester: studentData.semester || "",
    section: studentData.section || "",
    guardianName: studentData.guardianName || "",
    guardianPhone: studentData.guardianPhone || "",
    guardianEmail: studentData.guardianEmail || "",
    guardianRelation: studentData.guardianRelation || "",
    bio: studentData.bio || "",
    linkedIn: studentData.linkedIn || "",
    github: studentData.github || "",
    twitter: studentData.twitter || "",
    facebook: studentData.facebook || "",
    instagram: studentData.instagram || "",
    portfolio: studentData.portfolio || "",
    gapInStudies: studentData.gapInStudies || false,
    gapYears: studentData.gapYears || 0,
    gapReason: studentData.gapReason || "",
    workExperience: studentData.workExperience || "",
    aadharNumber: studentData.aadharNumber || "",
    backlogsHistory: studentData.backlogsHistory || "",
    currentBacklogs: studentData.currentBacklogs || 0,
    interests: studentData.interests || "",
    languages: studentData.languages || "",
    hobbies: studentData.hobbies || "",
  };
};

/**
 * Refresh helper with error handling
 */
export const safeRefresh = async (refreshFunction?: () => Promise<void>, context: string = ''): Promise<void> => {
  try {
    if (refreshFunction && typeof refreshFunction === 'function') {
      await refreshFunction();
    }
  } catch (error) {
    console.warn(`Could not refresh ${context}:`, error);
  }
};

/**
 * Dispatch settings update event
 */
export const dispatchSettingsUpdate = (type: string, data: any): void => {
  window.dispatchEvent(new CustomEvent('student_settings_updated', {
    detail: { type, data }
  }));
};

/**
 * Embedding regeneration helper
 */
export const triggerEmbeddingRegeneration = async (studentId: string, data: any): Promise<void> => {
  try {
    const { queueEmbeddingRegeneration } = await import('@/shared/api/embedding/autoRegenerate');
    await queueEmbeddingRegeneration(studentId, data);
  } catch (err) {
    console.warn('Embedding regeneration queued with warning:', err);
  }
};

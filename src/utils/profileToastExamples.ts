/**
 * Profile Toast Usage Examples
 * 
 * This file demonstrates how to use the profileToast utility
 * when updating profile sections in the Digital Passport.
 * 
 * IMPORTANT: Add these toast notifications after successful profile updates
 * in your components that handle profile data modifications.
 */

import { supabase } from '../lib/supabaseClient';
import { showProfileUpdateToast, showProfileErrorToast, PROFILE_UPDATE_MESSAGES } from './profileToast';

/**
 * Example 1: Adding a new skill
 * Location: Wherever skills are added (e.g., student dashboard, profile editor)
 */
export const exampleAddSkill = async (studentId: string, skillData: any, theme: 'light' | 'dark') => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .insert({
        student_id: studentId,
        ...skillData,
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ Add toast notification after successful update
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.skills, theme);

    return { success: true, data };
  } catch (error: any) {
    showProfileErrorToast('Failed to add skill', theme);
    return { success: false, error: error.message };
  }
};

/**
 * Example 2: Updating education
 * Location: Education editor component
 */
export const exampleUpdateEducation = async (educationId: string, updates: any, theme: 'light' | 'dark') => {
  try {
    const { data, error } = await supabase
      .from('education')
      .update(updates)
      .eq('id', educationId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Add toast notification after successful update
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.education, theme);

    return { success: true, data };
  } catch (error: any) {
    showProfileErrorToast('Failed to update education', theme);
    return { success: false, error: error.message };
  }
};

/**
 * Example 3: Adding a project
 * Location: Project creation/edit component
 */
export const exampleAddProject = async (studentId: string, projectData: any, theme: 'light' | 'dark') => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        student_id: studentId,
        ...projectData,
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ Add toast notification after successful update
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.projects, theme);

    return { success: true, data };
  } catch (error: any) {
    showProfileErrorToast('Failed to add project', theme);
    return { success: false, error: error.message };
  }
};

/**
 * Example 4: Updating experience
 * Location: Experience editor component
 */
export const exampleUpdateExperience = async (experienceId: string, updates: any, theme: 'light' | 'dark') => {
  try {
    const { data, error } = await supabase
      .from('experience')
      .update(updates)
      .eq('id', experienceId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Add toast notification after successful update
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.experience, theme);

    return { success: true, data };
  } catch (error: any) {
    showProfileErrorToast('Failed to update experience', theme);
    return { success: false, error: error.message };
  }
};

/**
 * Example 5: Adding a certification
 * Location: Certification upload component
 */
export const exampleAddCertification = async (studentId: string, certData: any, theme: 'light' | 'dark') => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        ...certData,
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ Add toast notification after successful update
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.certifications, theme);

    return { success: true, data };
  } catch (error: any) {
    showProfileErrorToast('Failed to add certification', theme);
    return { success: false, error: error.message };
  }
};

/**
 * Example 6: Updating student personal info
 * Location: Personal info editor
 */
export const exampleUpdatePersonalInfo = async (studentId: string, updates: any, theme: 'light' | 'dark') => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    // ✅ Add toast notification after successful update
    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.personalInfo, theme);

    return { success: true, data };
  } catch (error: any) {
    showProfileErrorToast('Failed to update personal information', theme);
    return { success: false, error: error.message };
  }
};

/**
 * HOW TO USE IN YOUR COMPONENTS:
 * 
 * 1. Import the utility and theme hook:
 *    import { showProfileUpdateToast, PROFILE_UPDATE_MESSAGES } from '../utils/profileToast';
 *    import { useTheme } from '../context/ThemeContext';
 * 
 * 2. Get the current theme:
 *    const { theme } = useTheme();
 * 
 * 3. After a successful profile update operation, call:
 *    showProfileUpdateToast(PROFILE_UPDATE_MESSAGES.skills, theme);
 *    // or with a custom message:
 *    showProfileUpdateToast('Custom success message!', theme);
 * 
 * 4. For errors, use:
 *    showProfileErrorToast('Error message', theme);
 * 
 * LOCATIONS TO ADD TOAST NOTIFICATIONS:
 * - src/pages/student/Dashboard.jsx - When skills are toggled/updated
 * - Any component that updates education records
 * - Any component that updates projects
 * - Any component that updates experience
 * - Any component that updates certifications
 * - Any component that updates training
 * - Any component that updates languages, hobbies, interests
 * - Any component that updates personal information
 */

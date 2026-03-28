import type { Student } from '../types/student';

/**
 * Result of profile completeness check
 */
export interface ProfileCompletenessResult {
  incompleteSections: string[];
  isComplete: boolean;
}

/**
 * Checks the completeness of a student's Digital Passport profile
 * 
 * Analyzes all 8 profile sections:
 * - Personal Info
 * - Education
 * - Skills
 * - Languages
 * - Projects
 * - Achievements
 * - Hobbies
 * - Interests
 * 
 * @param student - The student data to check
 * @returns Object containing array of incomplete section names and overall completion status
 */
export function checkProfileCompleteness(student: Student | null): ProfileCompletenessResult {
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  // If no student data, return all sections as incomplete
  if (!student) {
    if (isDevelopment) {
      console.log('[Profile Completeness] No student data provided');
    }
    return {
      incompleteSections: [
        'Personal Info',
        'Education',
        'Skills',
        'Languages',
        'Projects',
        'Achievements',
        'Hobbies',
        'Interests',
      ],
      isComplete: false,
    };
  }

  // Validate student data structure
  if (typeof student !== 'object') {
    if (isDevelopment) {
      console.error('[Profile Completeness] Invalid student data type:', typeof student);
    }
    return {
      incompleteSections: [
        'Personal Info',
        'Education',
        'Skills',
        'Languages',
        'Projects',
        'Achievements',
        'Hobbies',
        'Interests',
      ],
      isComplete: false,
    };
  }

  const incompleteSections: string[] = [];

  try {
    // Check Personal Info
    // Required fields: name, email, contact_number, and location (city/state/country)
    const hasPersonalInfo = Boolean(
      student.name &&
      student.email &&
      student.contact_number &&
      (student.city || student.state || student.country || student.district_name)
    );
    
    if (!hasPersonalInfo) {
      incompleteSections.push('Personal Info');
    }

    // Check Education
    const hasEducation = Boolean(
      student.profile?.education &&
      Array.isArray(student.profile.education) &&
      student.profile.education.length > 0
    );
    
    if (!hasEducation) {
      incompleteSections.push('Education');
    }

    // Check Skills
    const hasSkills = Boolean(
      student.profile?.skills &&
      Array.isArray(student.profile.skills) &&
      student.profile.skills.length > 0
    );
    
    if (!hasSkills) {
      incompleteSections.push('Skills');
    }

    // Check Languages
    const hasLanguages = Boolean(
      (student.profile?.languages &&
      Array.isArray(student.profile.languages) &&
      student.profile.languages.length > 0) ||
      (student.languages &&
      Array.isArray(student.languages) &&
      student.languages.length > 0)
    );
    
    if (!hasLanguages) {
      incompleteSections.push('Languages');
    }

    // Check Projects
    const hasProjects = Boolean(
      student.profile?.projects &&
      Array.isArray(student.profile.projects) &&
      student.profile.projects.length > 0
    );
    
    if (!hasProjects) {
      incompleteSections.push('Projects');
    }

    // Check Achievements
    const hasAchievements = Boolean(
      student.profile?.achievements &&
      Array.isArray(student.profile.achievements) &&
      student.profile.achievements.length > 0
    );
    
    if (!hasAchievements) {
      incompleteSections.push('Achievements');
    }

    // Check Hobbies
    const hasHobbies = Boolean(
      (student.profile?.hobbies &&
      Array.isArray(student.profile.hobbies) &&
      student.profile.hobbies.length > 0) ||
      (student.hobbies &&
      Array.isArray(student.hobbies) &&
      student.hobbies.length > 0)
    );
    
    if (!hasHobbies) {
      incompleteSections.push('Hobbies');
    }

    // Check Interests
    const hasInterests = Boolean(
      (student.profile?.interests &&
      Array.isArray(student.profile.interests) &&
      student.profile.interests.length > 0) ||
      (student.interests &&
      Array.isArray(student.interests) &&
      student.interests.length > 0)
    );
    
    if (!hasInterests) {
      incompleteSections.push('Interests');
    }

    const isComplete = incompleteSections.length === 0;

    // Development mode logging
    if (isDevelopment) {
      console.log('[Profile Completeness] Check results:', {
        studentId: student.id,
        studentEmail: student.email,
        incompleteSections,
        isComplete,
        sectionDetails: {
          personalInfo: hasPersonalInfo,
          education: hasEducation,
          skills: hasSkills,
          languages: hasLanguages,
          projects: hasProjects,
          achievements: hasAchievements,
          hobbies: hasHobbies,
          interests: hasInterests,
        },
      });
    }

    return {
      incompleteSections,
      isComplete,
    };
  } catch (error) {
    if (isDevelopment) {
      console.error('[Profile Completeness] Error during completeness check:', error);
    }
    
    // Return safe fallback on error
    return {
      incompleteSections: [
        'Personal Info',
        'Education',
        'Skills',
        'Languages',
        'Projects',
        'Achievements',
        'Hobbies',
        'Interests',
      ],
      isComplete: false,
    };
  }
}

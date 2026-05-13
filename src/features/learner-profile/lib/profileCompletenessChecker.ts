import type { Learner } from '@/shared/types/learner';

/**
 * Result of profile completeness check
 */
export interface ProfileCompletenessResult {
  incompleteSections: string[];
  isComplete: boolean;
}

/**
 * Checks the completeness of a learner's Digital Passport profile
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
 * @param learner - The learner data to check
 * @returns Object containing array of incomplete section names and overall completion status
 */
export function checkProfileCompleteness(learner: Learner | null): ProfileCompletenessResult {
  // If no learner data, return all sections as incomplete
  if (!learner) {
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

  // Validate learner data structure
  if (typeof learner !== 'object') {
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
      learner.name &&
      learner.email &&
      learner.contact_number &&
      (learner.city || learner.state || learner.country || learner.district_name)
    );
    
    if (!hasPersonalInfo) {
      incompleteSections.push('Personal Info');
    }

    // Check Education
    const hasEducation = Boolean(
      learner.profile?.education &&
      Array.isArray(learner.profile.education) &&
      learner.profile.education.length > 0
    );
    
    if (!hasEducation) {
      incompleteSections.push('Education');
    }

    // Check Skills
    const hasSkills = Boolean(
      learner.profile?.skills &&
      Array.isArray(learner.profile.skills) &&
      learner.profile.skills.length > 0
    );
    
    if (!hasSkills) {
      incompleteSections.push('Skills');
    }

    // Check Languages
    const hasLanguages = Boolean(
      (learner.profile?.languages &&
      Array.isArray(learner.profile.languages) &&
      learner.profile.languages.length > 0) ||
      (learner.languages &&
      Array.isArray(learner.languages) &&
      learner.languages.length > 0)
    );
    
    if (!hasLanguages) {
      incompleteSections.push('Languages');
    }

    // Check Projects
    const hasProjects = Boolean(
      learner.profile?.projects &&
      Array.isArray(learner.profile.projects) &&
      learner.profile.projects.length > 0
    );
    
    if (!hasProjects) {
      incompleteSections.push('Projects');
    }

    // Check Achievements
    const hasAchievements = Boolean(
      learner.profile?.achievements &&
      Array.isArray(learner.profile.achievements) &&
      learner.profile.achievements.length > 0
    );
    
    if (!hasAchievements) {
      incompleteSections.push('Achievements');
    }

    // Check Hobbies
    const hasHobbies = Boolean(
      (learner.profile?.hobbies &&
      Array.isArray(learner.profile.hobbies) &&
      learner.profile.hobbies.length > 0) ||
      (learner.hobbies &&
      Array.isArray(learner.hobbies) &&
      learner.hobbies.length > 0)
    );
    
    if (!hasHobbies) {
      incompleteSections.push('Hobbies');
    }

    // Check Interests
    const hasInterests = Boolean(
      (learner.profile?.interests &&
      Array.isArray(learner.profile.interests) &&
      learner.profile.interests.length > 0) ||
      (learner.interests &&
      Array.isArray(learner.interests) &&
      learner.interests.length > 0)
    );
    
    if (!hasInterests) {
      incompleteSections.push('Interests');
    }

    const isComplete = incompleteSections.length === 0;

    return {
      incompleteSections,
      isComplete,
    };
  } catch {
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

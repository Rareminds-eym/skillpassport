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
    // Get sections that user has completed (even if pending approval)
    let completedSections: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        completedSections = JSON.parse(localStorage.getItem(`profile-sections-completed-${learner.id}`) || '[]');
      } catch {
        completedSections = [];
      }
    }

    // Check Personal Info
    // Required fields: name, email, contact_number, and location (city/state/country)
    const hasPersonalInfo = Boolean(
      learner.name &&
      learner.email &&
      learner.contact_number &&
      (learner.city || learner.state || learner.country || learner.district_name)
    );
    
    if (!hasPersonalInfo && !completedSections.includes('Personal Details')) {
      incompleteSections.push('Personal Info');
    }

    // Check Education (approved items OR completed by user)
    const hasEducation = Boolean(
      learner.profile?.education &&
      Array.isArray(learner.profile.education) &&
      learner.profile.education.length > 0
    ) || completedSections.includes('Education');
    
    if (!hasEducation) {
      incompleteSections.push('Education');
    }

    // Check Skills (approved items OR completed by user)
    const hasSkills = Boolean(
      learner.profile?.skills &&
      Array.isArray(learner.profile.skills) &&
      learner.profile.skills.length > 0
    ) || completedSections.includes('Skills');
    
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
      learner.languages.length > 0) ||
      completedSections.includes('Languages')
    );
    
    if (!hasLanguages) {
      incompleteSections.push('Languages');
    }

    // Check Projects (approved items OR completed by user)
    const hasProjects = Boolean(
      learner.profile?.projects &&
      Array.isArray(learner.profile.projects) &&
      learner.profile.projects.length > 0
    ) || completedSections.includes('Projects');
    
    if (!hasProjects) {
      incompleteSections.push('Projects');
    }

    // Check Achievements (approved items OR completed by user)
    const hasAchievements = Boolean(
      learner.profile?.achievements &&
      Array.isArray(learner.profile.achievements) &&
      learner.profile.achievements.length > 0
    ) || completedSections.includes('Achievements');
    
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
      learner.hobbies.length > 0) ||
      completedSections.includes('Hobbies')
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
      learner.interests.length > 0) ||
      completedSections.includes('Interests')
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

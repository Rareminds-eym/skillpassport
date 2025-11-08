import { supabase } from '../lib/supabaseClient';

/**
 * Badge Service - Handles badge generation and milestone tracking
 */

// Badge definitions with criteria
export const BADGE_DEFINITIONS = {
  // Education Badges
  DEGREE_COMPLETED: {
    id: 'degree_completed',
    name: 'Degree Completed',
    description: 'Successfully completed a degree program',
    icon: '🎓',
    color: '#10b981',
    category: 'education',
    criteriaText: 'Complete a degree program',
    criteria: (userData) => {
      return userData.education?.some(edu => edu.status === 'completed') || false;
    }
  },

  // Training Badges
  TRAINING_ENTHUSIAST: {
    id: 'training_enthusiast',
    name: 'Training Enthusiast',
    description: 'Enrolled in 3 or more training courses',
    icon: '📚',
    color: '#3b82f6',
    category: 'training',
    criteriaText: 'Enroll in 3 or more training courses',
    criteria: (userData) => {
      return (userData.training?.length || 0) >= 3;
    }
  },

  TRAINING_MASTER: {
    id: 'training_master',
    name: 'Training Master',
    description: 'Enrolled in 10 or more training courses',
    icon: '🏆',
    color: '#f59e0b',
    category: 'training',
    criteriaText: 'Enroll in 10 or more training courses',
    criteria: (userData) => {
      return (userData.training?.length || 0) >= 10;
    }
  },

  // Certificate Badges
  CERTIFIED_PROFESSIONAL: {
    id: 'certified_professional',
    name: 'Certified Professional',
    description: 'Earned 3 or more professional certificates',
    icon: '🏅',
    color: '#8b5cf6',
    category: 'certificates',
    criteriaText: 'Earn 3 or more professional certificates',
    criteria: (userData) => {
      return (userData.certificates?.length || 0) >= 3;
    }
  },

  CERTIFICATE_CHAMPION: {
    id: 'certificate_champion',
    name: 'Certificate Champion',
    description: 'Earned 10 or more professional certificates',
    icon: '👑',
    color: '#ec4899',
    category: 'certificates',
    criteriaText: 'Earn 10 or more professional certificates',
    criteria: (userData) => {
      return (userData.certificates?.length || 0) >= 10;
    }
  },

  // Project Badges
  PROJECT_STARTER: {
    id: 'project_starter',
    name: 'Project Starter',
    description: 'Completed your first project',
    icon: '🚀',
    color: '#06b6d4',
    category: 'projects',
    criteriaText: 'Complete your first project',
    criteria: (userData) => {
      return (userData.projects?.length || 0) >= 1;
    }
  },

  PROJECT_BUILDER: {
    id: 'project_builder',
    name: 'Project Builder',
    description: 'Completed 5 or more projects',
    icon: '🔨',
    color: '#14b8a6',
    category: 'projects',
    criteriaText: 'Complete 5 or more projects',
    criteria: (userData) => {
      return (userData.projects?.length || 0) >= 5;
    }
  },

  PROJECT_ARCHITECT: {
    id: 'project_architect',
    name: 'Project Architect',
    description: 'Completed 10 or more projects',
    icon: '🏗️',
    color: '#f97316',
    category: 'projects',
    criteriaText: 'Complete 10 or more projects',
    criteria: (userData) => {
      return (userData.projects?.length || 0) >= 10;
    }
  },

  // Experience Badges
  PROFESSIONAL_START: {
    id: 'professional_start',
    name: 'Professional Start',
    description: 'Gained your first work experience',
    icon: '💼',
    color: '#6366f1',
    category: 'experience',
    criteriaText: 'Gain your first work experience',
    criteria: (userData) => {
      return (userData.experience?.length || 0) >= 1;
    }
  },

  EXPERIENCED_PROFESSIONAL: {
    id: 'experienced_professional',
    name: 'Experienced Professional',
    description: 'Gained 3 or more work experiences',
    icon: '🎯',
    color: '#8b5cf6',
    category: 'experience',
    criteriaText: 'Gain 3 or more work experiences',
    criteria: (userData) => {
      return (userData.experience?.length || 0) >= 3;
    }
  },

  // Skills Badges
  SKILL_COLLECTOR: {
    id: 'skill_collector',
    name: 'Skill Collector',
    description: 'Acquired 10 or more technical skills',
    icon: '⚡',
    color: '#eab308',
    category: 'skills',
    criteriaText: 'Acquire 10 or more technical skills',
    criteria: (userData) => {
      const directSkills = userData.technicalSkills?.length || 0;
      const trainingSkills = userData.training?.reduce((acc, course) => {
        return acc + (course.skills?.length || 0);
      }, 0) || 0;
      return (directSkills + trainingSkills) >= 10;
    }
  },

  SKILL_MASTER: {
    id: 'skill_master',
    name: 'Skill Master',
    description: 'Acquired 20 or more technical skills',
    icon: '🌟',
    color: '#a855f7',
    category: 'skills',
    criteriaText: 'Acquire 20 or more technical skills',
    criteria: (userData) => {
      const directSkills = userData.technicalSkills?.length || 0;
      const trainingSkills = userData.training?.reduce((acc, course) => {
        return acc + (course.skills?.length || 0);
      }, 0) || 0;
      return (directSkills + trainingSkills) >= 20;
    }
  },

  // Application Badges
  JOB_SEEKER: {
    id: 'job_seeker',
    name: 'Job Seeker',
    description: 'Applied to 10 or more opportunities',
    icon: '🎯',
    color: '#3b82f6',
    category: 'applications',
    criteriaText: 'Apply to 10 or more job opportunities',
    criteria: (userData) => {
      // This would need to be fetched from applied_jobs table
      return false; // Placeholder
    }
  },

  NETWORKING_PRO: {
    id: 'networking_pro',
    name: 'Networking Pro',
    description: 'Connected with 5 or more recruiters',
    icon: '🤝',
    color: '#10b981',
    category: 'networking',
    criteriaText: 'Connect with 5 or more recruiters',
    criteria: (userData) => {
      // This would need conversation/message data
      return false; // Placeholder
    }
  },

  // Performance Badges
  TOP_PERFORMER: {
    id: 'top_performer',
    name: 'Top Performer',
    description: 'Achieved top 10% in assessments',
    icon: '⭐',
    color: '#f59e0b',
    category: 'performance',
    criteriaText: 'Achieve an average grade of 90% or higher',
    criteria: (userData) => {
      // This would need assessment/grade data
      const avgGrade = userData.profile?.averageGrade || 0;
      return avgGrade >= 90;
    }
  },

  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Submitted 5 assignments before deadline',
    icon: '🐦',
    color: '#06b6d4',
    category: 'assignments',
    criteriaText: 'Submit 5 assignments before their deadlines',
    criteria: (userData) => {
      // This would need assignment submission data
      return false; // Placeholder
    }
  }
};

/**
 * Generate badges for a student based on their data
 */
export const generateBadges = (userData) => {
  if (!userData) return [];

  const earnedBadges = [];

  Object.values(BADGE_DEFINITIONS).forEach(badge => {
    try {
      if (badge.criteria(userData)) {
        earnedBadges.push({
          ...badge,
          earnedAt: new Date().toISOString(),
          isNew: false // Can be used to highlight newly earned badges
        });
      }
    } catch (error) {
      console.error(`Error evaluating badge ${badge.id}:`, error);
    }
  });

  return earnedBadges;
};

/**
 * Get badge progress - shows how close user is to earning badges
 */
export const getBadgeProgress = (userData) => {
  if (!userData) return [];

  const progress = [];

  // Training progress
  const totalTraining = userData.training?.length || 0;
  if (totalTraining < 3) {
    progress.push({
      badge: BADGE_DEFINITIONS.TRAINING_ENTHUSIAST,
      current: totalTraining,
      required: 3,
      percentage: Math.round((totalTraining / 3) * 100)
    });
  } else if (totalTraining < 10) {
    progress.push({
      badge: BADGE_DEFINITIONS.TRAINING_MASTER,
      current: totalTraining,
      required: 10,
      percentage: Math.round((totalTraining / 10) * 100)
    });
  }

  // Certificate progress
  const certificateCount = userData.certificates?.length || 0;
  if (certificateCount < 3) {
    progress.push({
      badge: BADGE_DEFINITIONS.CERTIFIED_PROFESSIONAL,
      current: certificateCount,
      required: 3,
      percentage: Math.round((certificateCount / 3) * 100)
    });
  } else if (certificateCount < 10) {
    progress.push({
      badge: BADGE_DEFINITIONS.CERTIFICATE_CHAMPION,
      current: certificateCount,
      required: 10,
      percentage: Math.round((certificateCount / 10) * 100)
    });
  }

  // Project progress
  const projectCount = userData.projects?.length || 0;
  if (projectCount === 0) {
    progress.push({
      badge: BADGE_DEFINITIONS.PROJECT_STARTER,
      current: 0,
      required: 1,
      percentage: 0
    });
  } else if (projectCount < 5) {
    progress.push({
      badge: BADGE_DEFINITIONS.PROJECT_BUILDER,
      current: projectCount,
      required: 5,
      percentage: Math.round((projectCount / 5) * 100)
    });
  } else if (projectCount < 10) {
    progress.push({
      badge: BADGE_DEFINITIONS.PROJECT_ARCHITECT,
      current: projectCount,
      required: 10,
      percentage: Math.round((projectCount / 10) * 100)
    });
  }

  // Skills progress
  const directSkills = userData.technicalSkills?.length || 0;
  const trainingSkills = userData.training?.reduce((acc, course) => {
    return acc + (course.skills?.length || 0);
  }, 0) || 0;
  const totalSkills = directSkills + trainingSkills;
  if (totalSkills < 10) {
    progress.push({
      badge: BADGE_DEFINITIONS.SKILL_COLLECTOR,
      current: totalSkills,
      required: 10,
      percentage: Math.round((totalSkills / 10) * 100)
    });
  } else if (totalSkills < 20) {
    progress.push({
      badge: BADGE_DEFINITIONS.SKILL_MASTER,
      current: totalSkills,
      required: 20,
      percentage: Math.round((totalSkills / 20) * 100)
    });
  }

  return progress.sort((a, b) => b.percentage - a.percentage);
};

/**
 * Get badges by category
 */
export const getBadgesByCategory = (badges) => {
  const categorized = {};

  badges.forEach(badge => {
    if (!categorized[badge.category]) {
      categorized[badge.category] = [];
    }
    categorized[badge.category].push(badge);
  });

  return categorized;
};

/**
 * Save badges to database (optional - for persistence)
 */
export const saveBadgesToDatabase = async (studentId, badges) => {
  try {
    // Store in student profile metadata
    const { data, error } = await supabase
      .from('students')
      .update({
        metadata: {
          badges: badges.map(b => ({
            id: b.id,
            earnedAt: b.earnedAt
          }))
        }
      })
      .eq('id', studentId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving badges:', error);
    return { success: false, error };
  }
};

export default {
  BADGE_DEFINITIONS,
  generateBadges,
  getBadgeProgress,
  getBadgesByCategory,
  saveBadgesToDatabase
};
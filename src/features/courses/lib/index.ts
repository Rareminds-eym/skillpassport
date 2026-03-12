/**
 * Courses Library Public API
 * Exports utilities and recommendation functions
 */

// Re-export recommendation functions
export { 
  getRecommendedCourses,
  getRecommendedCoursesByType,
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps
} from './recommendations';

// Export courseValidation utilities (to be added when needed)
// export * from './courseValidation';

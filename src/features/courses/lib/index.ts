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

// Export timetable transformations
export * from './timetableTransformations';

// Export lesson plan transformations
export * from './lessonPlanTransformations';

// Export courseValidation utilities (to be added when needed)
// export * from './courseValidation';

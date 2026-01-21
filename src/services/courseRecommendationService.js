/**
 * Course Recommendation Service
 *
 * DEPRECATED: This file is kept for backward compatibility.
 * The service has been modularized into src/services/courseRecommendation/
 *
 * New imports should use:
 * import { getRecommendedCourses } from './courseRecommendation';
 *
 * @deprecated Use imports from './courseRecommendation' instead
 */

// Re-export everything from the modular structure
export {
  buildProfileText,
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  getRecommendedCourses,
  getRecommendedCoursesByType,
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps,
  saveRecommendations,
  getSavedRecommendations,
  updateRecommendationStatus,
  getAndSaveRecommendations,
} from './courseRecommendation';

// Default export for backward compatibility
export { default } from './courseRecommendation';

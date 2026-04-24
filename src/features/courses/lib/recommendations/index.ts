/**
 * Course Recommendations Public API
 * Exports the main recommendation functions for use across the application
 */

export {
  getRecommendedCourses,
  getRecommendedCoursesByType,
  fallbackKeywordMatching
} from './recommendationService';

export {
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps
} from './skillGapMatcher';

export {
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  fetchBasicCourses,
  fetchCoursesBySkillName
} from './courseRepository';

export {
  buildProfileText
} from './profileBuilder';


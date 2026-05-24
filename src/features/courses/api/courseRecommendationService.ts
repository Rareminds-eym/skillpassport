/**
 * Course Recommendation Service
 * 
 * Backward compatibility layer redirecting to modular course recommendation components.
 */

export { buildProfileText } from './profileBuilder';

export {
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  fetchBasicCourses,
  fetchCoursesBySkillName
} from './courseRepository';

export {
  getRecommendedCourses,
  getRecommendedCoursesByType,
  fallbackKeywordMatching
} from './recommendationService';

export {
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps,
  getDirectSkillMatches,
  getSemanticSkillMatches,
  combineAndRankCourses
} from './skillGapMatcher';

export {
  saveRecommendations,
  getSavedRecommendations,
  updateRecommendationStatus,
  getAndSaveRecommendations
} from './recommendationStorage';

const recommendationService = {
  buildProfileText: async (ar: any) => {
    const { buildProfileText: bp } = await import('./profileBuilder');
    return bp(ar);
  },
  getRecommendedCourses: async (ar: any) => {
    const { getRecommendedCourses: rc } = await import('./recommendationService');
    return rc(ar);
  }
};

export default recommendationService;

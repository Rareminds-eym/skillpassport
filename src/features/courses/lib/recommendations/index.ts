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

export {
  generateEmbedding,
  generateSkillEmbedding
} from '../../api/embeddingService';

export {
  generateDomainKeywords,
  getDomainKeywordsWithCache,
  clearKeywordCache
} from '../../api/fieldDomainService';

export {
  MAX_RECOMMENDATIONS,
  MIN_SIMILARITY_THRESHOLD,
  MAX_COURSES_PER_SKILL_GAP,
  SKILL_SIMILARITY_THRESHOLD
} from '../../api/config';

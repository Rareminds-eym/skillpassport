/**
 * Course Recommendation Service
 * 
 * Provides RAG-based course recommendations using vector similarity search
 * to match student assessment profiles with platform courses.
 * 
 * Feature: rag-course-recommendations
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.4
 * 
 * Architecture:
 * - config.js: Configuration constants
 * - utils.js: Helper functions (parsing, scoring, matching)
 * - profileBuilder.js: Builds profile text from assessment results
 * - embeddingService.js: Generates embeddings via career-api worker
 * - courseRepository.js: Database operations for courses
 * - skillGapMatcher.js: Matches courses to skill gaps
 * - recommendationService.js: Main recommendation logic
 * - recommendationStorage.js: Saves/retrieves recommendations
 * - roleBasedMatcher.js: RAG-based matching for specific job roles
 */

// Profile building
export { buildProfileText } from './profileBuilder';

// Course fetching
export { 
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType 
} from './courseRepository';

// Main recommendation functions
export { 
  getRecommendedCourses,
  getRecommendedCoursesByType 
} from './recommendationService';

// Skill gap matching
export { 
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps 
} from './skillGapMatcher';

// Role-based matching (for CareerTrackModal)
export { 
  matchCoursesForRole 
} from './roleBasedMatcher';

// Storage operations
export { 
  saveRecommendations,
  getSavedRecommendations,
  updateRecommendationStatus,
  getAndSaveRecommendations 
} from './recommendationStorage';

// Import for default export
import { buildProfileText } from './profileBuilder';
import { fetchCoursesWithEmbeddings, fetchCoursesBySkillType } from './courseRepository';
import { getRecommendedCourses, getRecommendedCoursesByType } from './recommendationService';
import { getCoursesForSkillGap, getCoursesForMultipleSkillGaps } from './skillGapMatcher';
import { matchCoursesForRole } from './roleBasedMatcher';
import { 
  saveRecommendations, 
  getSavedRecommendations, 
  updateRecommendationStatus, 
  getAndSaveRecommendations 
} from './recommendationStorage';

// Default export for convenience
export default {
  buildProfileText,
  fetchCoursesWithEmbeddings,
  fetchCoursesBySkillType,
  getRecommendedCourses,
  getRecommendedCoursesByType,
  getCoursesForSkillGap,
  getCoursesForMultipleSkillGaps,
  matchCoursesForRole,
  saveRecommendations,
  getSavedRecommendations,
  updateRecommendationStatus,
  getAndSaveRecommendations
};

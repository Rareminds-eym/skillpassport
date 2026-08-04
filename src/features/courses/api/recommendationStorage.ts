import { apiGet, apiPost, apiPut } from '@/shared/api/apiClient';
import { getRecommendedCourses } from './recommendationService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('recommendation-storage');

export const saveRecommendations = async (
  learnerId,
  recommendations,
  assessmentResultId = null,
  recommendationType = 'assessment'
) => {
  if (!learnerId || !recommendations || recommendations.length === 0) return [];
  try {
    return await apiPost<any[]>('/courses/recommendations/save', { learnerId, recommendations, assessmentResultId, recommendationType });
  } catch (error) {
    logger.error('Error saving recommendations', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

/**
 * Records that the learner expressed interest in a course.
 *
 * The learner is derived server-side from the authenticated session, so only
 * courseId is sent. Failure is propagated to the caller, which decides what to
 * display - the success modal is shown only after this resolves.
 */
export const recordCourseInterest = async (courseId: string) => {
  if (!courseId) throw new Error('Course ID is required');
  try {
    return await apiPost('/courses/interests', { courseId });
  } catch (error) {
    logger.error('Error recording course interest', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const getSavedRecommendations = async (learnerId, options = {}) => {
  if (!learnerId) return [];
  try {
    const params = new URLSearchParams({ learnerId });
    if (options.status) params.set('status', options.status);
    if (options.assessmentResultId) params.set('assessmentResultId', options.assessmentResultId);
    return await apiGet<any[]>(`/courses/recommendations/saved?${params.toString()}`);
  } catch (error) {
    logger.error('Error getting saved recommendations', error instanceof Error ? error : new Error(String(error)));
    return [];
  }
};

export const updateRecommendationStatus = async (recommendationId, status, dismissedReason = null) => {
  if (!recommendationId || !status) throw new Error('Recommendation ID and status are required');
  const validStatuses = ['active', 'enrolled', 'dismissed', 'completed'];
  if (!validStatuses.includes(status)) throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  try {
    return await apiPut('/courses/recommendations/status', { id: recommendationId, status, dismissedReason });
  } catch (error) {
    logger.error('Error updating recommendation status', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
};

export const getAndSaveRecommendations = async (learnerId, assessmentResults, assessmentResultId = null) => {
  if (!learnerId || !assessmentResults) return [];
  try {
    const recommendations = await getRecommendedCourses(assessmentResults);
    if (recommendations.length === 0) return [];
    await saveRecommendations(learnerId, recommendations, assessmentResultId, 'assessment');
    return recommendations;
  } catch (error) {
    logger.error('Error in getAndSaveRecommendations', error instanceof Error ? error : new Error(String(error)));
    return await getRecommendedCourses(assessmentResults);
  }
};

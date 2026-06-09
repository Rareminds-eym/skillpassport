/**
 * Learner Pipeline Service
 * Fetches pipeline status and recruitment progress for learners
 */

import { apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('LearnerPipelineService');

export class LearnerPipelineService {
  /**
   * Get learner's pipeline status across all applications
   * @param {string} learnerId - Learner's UUID
   * @param {string} learnerEmail - Learner's email (fallback)
   * @returns {Promise<Array>} Pipeline statuses
   */
  static async getlearnerPipelineStatus(learnerId, learnerEmail = null) {
    try {
      const result = await apiPost('/learners/pipeline', {
        action: 'get-pipeline-status', learnerId, learnerEmail,
      });
      // Backend returns array directly via apiSuccess(data, ...)
      // result.data contains the actual array
      const statusArray = result?.data || [];
      if (!Array.isArray(statusArray)) {
        const error = new Error('Invalid response format: expected array');
        error.details = { type: typeof statusArray, data: statusArray };
        logger.error('getlearnerPipelineStatus - Invalid response format:', error.details);
        throw error;
      }
      return statusArray;
    } catch (error) {
      logger.error('Error in getlearnerPipelineStatus:', error);
      throw error;
    }
  }

  /**
   * Get pipeline activities/history for a learner
   * @param {string} learnerId - Learner's UUID
   * @returns {Promise<Array>} Pipeline activity history
   */
  static async getlearnerPipelineActivities(learnerId) {
    try {
      const result = await apiPost('/learners/pipeline', {
        action: 'get-pipeline-activities', learnerId,
      });
      // Backend returns array directly via apiSuccess(data, ...)
      const activitiesArray = result?.data || [];
      if (!Array.isArray(activitiesArray)) {
        const error = new Error('Invalid response format: expected array');
        error.details = { type: typeof activitiesArray, data: activitiesArray };
        logger.error('getlearnerPipelineActivities - Invalid response format:', error.details);
        throw error;
      }
      return activitiesArray;
    } catch (error) {
      logger.error('Error in getlearnerPipelineActivities:', error);
      throw error;
    }
  }

  /**
   * Get learner's interviews
   * @param {string} learnerId - Learner's UUID
   * @returns {Promise<Array>} Scheduled interviews
   */
  static async getlearnerInterviews(learnerId) {
    try {
      const result = await apiPost('/learners/pipeline', {
        action: 'get-interviews', learnerId,
      });
      // Backend returns array directly via apiSuccess(data, ...)
      const interviewsArray = result?.data || [];
      if (!Array.isArray(interviewsArray)) {
        const error = new Error('Invalid response format: expected array');
        error.details = { type: typeof interviewsArray, data: interviewsArray };
        logger.error('getlearnerInterviews - Invalid response format:', error.details);
        throw error;
      }
      return interviewsArray;
    } catch (error) {
      logger.error('Error in getlearnerInterviews:', error);
      throw error;
    }
  }

  /**
   * Get combined application and pipeline data for learner - OPTIMIZED
   * Uses a single query with JOINs to avoid N+1 problem
   * @param {string} learnerId - Learner's UUID
   * @param {string} learnerEmail - Learner's email
   * @returns {Promise<Array>} Combined application data with pipeline status
   */
  static async getlearnerApplicationsWithPipeline(learnerId, learnerEmail = null) {
    try {
      const result = await apiPost('/learners/pipeline', {
        action: 'get-applications-with-pipeline', learnerId, learnerEmail,
      });
      
      // Backend wraps response in { success, data, error, meta } via apiSuccess()
      // result.data contains the actual array
      logger.info('Raw result:', { hasData: !!result?.data, dataType: typeof result?.data, isArray: Array.isArray(result?.data) });
      
      // Ensure we return an array
      const applicationsArray = result?.data || [];
      if (!Array.isArray(applicationsArray)) {
        const error = new Error('Invalid response format: expected array');
        error.details = { type: typeof applicationsArray, data: applicationsArray };
        logger.error('getlearnerApplicationsWithPipeline - Invalid response format:', error.details);
        throw error;
      }
      
      logger.info('Returning applications array:', { count: applicationsArray.length });
      return applicationsArray;
    } catch (error) {
      logger.error('Error in getlearnerApplicationsWithPipeline:', error);
      throw error;
    }
  }

  /**
   * Get stage change notifications for learner
   * @param {string} learnerId - Learner's UUID
   * @param {number} limit - Number of notifications to fetch
   * @returns {Promise<Array>} Recent stage change notifications
   */
  static async getStageChangeNotifications(learnerId, limit = 10) {
    try {
      // Get recent pipeline activities
      const activities = await this.getlearnerPipelineActivities(learnerId);

      // Filter for stage changes
      const stageChanges = activities
        .filter(activity => activity.activity_type === 'stage_change')
        .slice(0, limit)
        .map(activity => ({
          id: activity.id,
          from_stage: activity.from_stage,
          to_stage: activity.to_stage,
          changed_at: activity.created_at,
          changed_by: activity.performed_by,
          details: activity.activity_details,
          type: 'stage_change'
        }));

      return stageChanges;
    } catch (error) {
      logger.error('Error in getStageChangeNotifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time pipeline updates for a learner
   * @param {string} learnerId - Learner's UUID
   * @param {Function} onUpdate - Callback function when update occurs
   * @returns {Function} Unsubscribe function
   */
  static subscribeToPipelineUpdates(learnerId, onUpdate) {
    const sseClient = getWSClient();
    const unsubscribers = [];

    // Subscribe to pipeline_candidates changes for this learner
    const unsubPipeline = sseClient.subscribe(
      'pipeline_candidates',
      { event: '*', filter: `learner_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          onUpdate(event.payload);
        }
      }
    );
    unsubscribers.push(unsubPipeline);

    // Subscribe to pipeline_activities changes
    const unsubActivities = sseClient.subscribe(
      'pipeline_activities',
      { event: 'INSERT' },
      (event) => {
        if (event.type === 'change') {
          // Note: Backend should filter by learner_id or include it in payload
          onUpdate(event.payload);
        }
      }
    );
    unsubscribers.push(unsubActivities);

    // Subscribe to interviews changes for this learner
    const unsubInterviews = sseClient.subscribe(
      'interviews',
      { event: '*', filter: `learner_id=eq.${learnerId}` },
      (event) => {
        if (event.type === 'change') {
          onUpdate(event.payload);
        }
      }
    );
    unsubscribers.push(unsubInterviews);

    // Return unsubscribe function
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }

  /**
   * Unsubscribe from pipeline updates
   * @param {Function} unsubscribeFn - Unsubscribe function returned from subscribe
   */
  static unsubscribeFromPipelineUpdates(unsubscribeFn) {
    if (unsubscribeFn && typeof unsubscribeFn === 'function') {
      unsubscribeFn();
    }
  }
}

export default LearnerPipelineService;

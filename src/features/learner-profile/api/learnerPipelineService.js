/**
 * Learner Pipeline Service
 * Fetches pipeline status and recruitment progress for learners
 */

import { apiPost } from '@/shared/api/apiClient';
import { getWSClient } from '@/shared/api/wsRealtimeClient';

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
      return result?.data || [];
    } catch (error) {
      console.error('Error in getlearnerPipelineStatus:', error);
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
      return result?.data || [];
    } catch (error) {
      console.error('Error in getlearnerPipelineActivities:', error);
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
      return result?.data || [];
    } catch (error) {
      console.error('Error in getlearnerInterviews:', error);
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
      return result?.data || [];
    } catch (error) {
      console.error('Error in getlearnerApplicationsWithPipeline:', error);
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
      console.error('Error in getStageChangeNotifications:', error);
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

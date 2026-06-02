import { apiPost } from '@/shared/api/apiClient';
import { getSSEClient } from '@/shared/api/sseRealtimeClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-pipeline');

export class LearnerPipelineService {
  static async getlearnerPipelineStatus(learnerId, learnerEmail = null) {
    try {
      const params: Record<string, any> = { action: 'get-learner-pipeline-status' };
      if (learnerId) params.learnerId = learnerId;
      if (learnerEmail) params.learnerEmail = learnerEmail;
      if (!learnerId && !learnerEmail) return [];
      const res = await apiPost('/placement/actions', params);
      return res?.data || [];
    } catch (error) {
      logger.error('Error in getlearnerPipelineStatus', error, { learnerId, learnerEmail });
      throw error;
    }
  }

  static async getlearnerPipelineActivities(learnerId) {
    try {
      const res = await apiPost('/placement/actions', { action: 'get-learner-pipeline-activities', learnerId });
      return res?.data || [];
    } catch (error) {
      logger.error('Error in getlearnerPipelineActivities', error, { learnerId });
      throw error;
    }
  }

  static async getlearnerInterviews(learnerId) {
    try {
      const res = await apiPost('/placement/actions', { action: 'get-learner-interviews', learnerId });
      return res?.data || [];
    } catch (error) {
      logger.error('Error in getlearnerInterviews', error, { learnerId });
      throw error;
    }
  }

  static async getlearnerApplicationsWithPipeline(learnerId, learnerEmail = null) {
    try {
      const params: Record<string, any> = { action: 'get-learner-applications-with-pipeline', learnerId };
      if (learnerEmail) params.learnerEmail = learnerEmail;
      const res = await apiPost('/placement/actions', params);
      return res?.data || [];
    } catch (error) {
      logger.error('Error in getlearnerApplicationsWithPipeline', error, { learnerId, learnerEmail });
      throw error;
    }
  }

  static async getStageChangeNotifications(learnerId, limit = 10) {
    try {
      const activities = await this.getlearnerPipelineActivities(learnerId);
      return activities
        .filter((activity: any) => activity.activity_type === 'stage_change')
        .slice(0, limit)
        .map((activity: any) => ({
          id: activity.id,
          from_stage: activity.from_stage,
          to_stage: activity.to_stage,
          changed_at: activity.created_at,
          changed_by: activity.performed_by,
          details: activity.activity_details,
          type: 'stage_change'
        }));
    } catch (error) {
      logger.error('Error in getStageChangeNotifications', error, { learnerId });
      throw error;
    }
  }

  static subscribeToPipelineUpdates(learnerId, onUpdate) {
    const sseClient = getSSEClient();
    const unsub1 = sseClient.subscribe('pipeline_candidates', {
      event: '*',
      filter: `learner_id=eq.${learnerId}`,
    }, (event) => { if (event.type === 'change') onUpdate(event); });

    const unsub2 = sseClient.subscribe('pipeline_activities', {
      event: 'INSERT',
    }, async (event) => {
      if (event.type !== 'change') return;
      try {
        const res = await apiPost('/placement/actions', { action: 'get-learner-pipeline-status', learnerId });
        const candidates = res?.data || [];
        const match = candidates.find((c: any) => c.id === event.payload?.pipeline_candidate_id);
        if (match) onUpdate(event);
      } catch {
        // Silently ignore
      }
    });

    const unsub3 = sseClient.subscribe('interviews', {
      event: '*',
      filter: `learner_id=eq.${learnerId}`,
    }, (event) => { if (event.type === 'change') onUpdate(event); });

    return () => { unsub1(); unsub2(); unsub3(); };
  }

  static unsubscribeFromPipelineUpdates(unsubscribe: (() => void) | null) {
    if (unsubscribe) {
      unsubscribe();
    }
  }
}

export default LearnerPipelineService;

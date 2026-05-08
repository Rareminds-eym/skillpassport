/**
 * Learner Pipeline Service
 * Fetches pipeline status and recruitment progress for learners
 */

import { supabase } from '@/shared/api/supabaseClient';

export class LearnerPipelineService {
  /**
   * Get learner's pipeline status across all applications
   * @param {string} learnerId - Learner's UUID
   * @param {string} learnerEmail - Learner's email (fallback)
   * @returns {Promise<Array>} Pipeline statuses
   */
  static async getlearnerPipelineStatus(learnerId, learnerEmail = null) {
    try {
      // Query pipeline_candidates table for this learner
      let query = supabase
        .from('pipeline_candidates')
        .select(`
          id,
          opportunity_id,
          learner_id,
          candidate_name,
          candidate_email,
          stage,
          previous_stage,
          stage_changed_at,
          stage_changed_by,
          status,
          rejection_reason,
          rejection_date,
          next_action,
          next_action_date,
          next_action_notes,
          recruiter_rating,
          recruiter_notes,
          assigned_to,
          source,
          added_at,
          created_at,
          updated_at,
          opportunities (
            id,
            job_title,
            title,
            company_name,
            department,
            location,
            employment_type,
            mode,
            stipend_or_salary,
            description,
            experience_required,
            recruiter_id
          )
        `)
        .eq('status', 'active')
        .order('stage_changed_at', { ascending: false });

      // Filter by learner_id or email
      if (learnerId) {
        query = query.eq('learner_id', learnerId);
      } else if (learnerEmail) {
        query = query.eq('candidate_email', learnerEmail);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pipeline status:', error);
        throw error;
      }


      return data || [];
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
      // First get all pipeline_candidate records for this learner
      const { data: candidates, error: candidatesError } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('learner_id', learnerId);

      if (candidatesError) throw candidatesError;
      if (!candidates || candidates.length === 0) return [];

      const candidateIds = candidates.map(c => c.id);

      // Fetch activities for these candidates
      const { data: activities, error: activitiesError } = await supabase
        .from('pipeline_activities')
        .select('*')
        .in('pipeline_candidate_id', candidateIds)
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;

      return activities || [];
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
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('learner_id', learnerId)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .order('date', { ascending: true });

      if (error) throw error;

      return data || [];
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
      // Single optimized query that fetches applications with opportunity details
      // Pipeline status and interviews are fetched in parallel
      const [applicationsResult, pipelineResult, interviewsResult] = await Promise.all([
        // Applications with opportunity details
        supabase
          .from('applied_jobs')
          .select(`
            *,
            opportunity:opportunities!fk_applied_jobs_opportunity (
              id,
              job_title,
              title,
              company_name,
              company_logo,
              location,
              employment_type,
              salary_range_min,
              salary_range_max,
              mode,
              department,
              recruiter_id,
              experience_level,
              status,
              applications_count,
              is_active
            )
          `)
          .eq('learner_id', learnerId)
          .order('applied_at', { ascending: false }),
        
        // Pipeline statuses - single query
        this.getlearnerPipelineStatus(learnerId, learnerEmail),
        
        // Interviews - single query
        this.getlearnerInterviews(learnerId)
      ]);

      const { data: applications, error: appsError } = applicationsResult;
      if (appsError) throw appsError;

      const pipelineStatuses = pipelineResult;
      const interviews = interviewsResult;

      // Create lookup maps for O(1) access
      const pipelineMap = new Map(
        pipelineStatuses.map(ps => [ps.opportunity_id, ps])
      );

      const interviewsMap = new Map();
      interviews.forEach(interview => {
        const key = interview.opportunity_id || interview.job_title;
        if (!interviewsMap.has(key)) {
          interviewsMap.set(key, []);
        }
        interviewsMap.get(key).push(interview);
      });

      // Combine data - match by opportunity_id
      const combinedData = (applications || []).map(app => {
        const opportunityId = app.opportunity?.id;
        const pipelineStatus = opportunityId ? pipelineMap.get(opportunityId) : null;
        const jobInterviews = opportunityId ? interviewsMap.get(opportunityId) : [];
        
        return {
          ...app,
          pipeline_status: pipelineStatus,
          interviews: jobInterviews || [],
          has_pipeline_status: !!pipelineStatus,
          pipeline_stage: pipelineStatus?.stage || null,
          pipeline_stage_changed_at: pipelineStatus?.stage_changed_at || null,
          rejection_reason: pipelineStatus?.rejection_reason || null,
          next_action: pipelineStatus?.next_action || null,
          next_action_date: pipelineStatus?.next_action_date || null,
          pipeline_recruiter_id: pipelineStatus?.assigned_to || pipelineStatus?.opportunities?.recruiter_id || null,
        };
      });

      return combinedData;
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
   * @returns {Object} Supabase subscription channel
   */
  static subscribeToPipelineUpdates(learnerId, onUpdate) {
    const channel = supabase
      .channel(`pipeline-updates-${learnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_candidates',
          filter: `learner_id=eq.${learnerId}`
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pipeline_activities'
        },
        async (payload) => {
          // Check if this activity belongs to this learner
          const { data } = await supabase
            .from('pipeline_candidates')
            .select('learner_id')
            .eq('id', payload.new.pipeline_candidate_id)
            .single();

          if (data && data.learner_id === learnerId) {
            onUpdate(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interviews',
          filter: `learner_id=eq.${learnerId}`
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Unsubscribe from pipeline updates
   * @param {Object} channel - Supabase channel to unsubscribe
   */
  static unsubscribeFromPipelineUpdates(channel) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }
}

export default LearnerPipelineService;

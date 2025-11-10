/**
 * Student Pipeline Service
 * Fetches pipeline status and recruitment progress for students
 */

import { supabase } from '../lib/supabaseClient';

export class StudentPipelineService {
  /**
   * Get student's pipeline status across all applications
   * @param {string} studentId - Student's UUID
   * @param {string} studentEmail - Student's email (fallback)
   * @returns {Promise<Array>} Pipeline statuses
   */
  static async getStudentPipelineStatus(studentId, studentEmail = null) {
    try {
      // Query pipeline_candidates table for this student
      let query = supabase
        .from('pipeline_candidates')
        .select(`
          id,
          opportunity_id,
          student_id,
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
            experience_required
          )
        `)
        .eq('status', 'active')
        .order('stage_changed_at', { ascending: false });

      // Filter by student_id or email
      if (studentId) {
        query = query.eq('student_id', studentId);
      } else if (studentEmail) {
        query = query.eq('candidate_email', studentEmail);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pipeline status:', error);
        throw error;
      }


      return data || [];
    } catch (error) {
      console.error('Error in getStudentPipelineStatus:', error);
      throw error;
    }
  }

  /**
   * Get pipeline activities/history for a student
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Array>} Pipeline activity history
   */
  static async getStudentPipelineActivities(studentId) {
    try {
      // First get all pipeline_candidate records for this student
      const { data: candidates, error: candidatesError } = await supabase
        .from('pipeline_candidates')
        .select('id')
        .eq('student_id', studentId);

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
      console.error('Error in getStudentPipelineActivities:', error);
      throw error;
    }
  }

  /**
   * Get student's interviews
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Array>} Scheduled interviews
   */
  static async getStudentInterviews(studentId) {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .eq('student_id', studentId)
        .in('status', ['scheduled', 'confirmed', 'pending'])
        .order('date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error in getStudentInterviews:', error);
      throw error;
    }
  }

  /**
   * Get combined application and pipeline data for student
   * @param {string} studentId - Student's UUID
   * @param {string} studentEmail - Student's email
   * @returns {Promise<Array>} Combined application data with pipeline status
   */
  static async getStudentApplicationsWithPipeline(studentId, studentEmail = null) {
    try {
      // Fetch applications with opportunity details
      const { data: applications, error: appsError } = await supabase
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
            experience_level
          )
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

      if (appsError) throw appsError;

      // Fetch pipeline statuses
      const pipelineStatuses = await this.getStudentPipelineStatus(studentId, studentEmail);


      // Fetch interviews
      const interviews = await this.getStudentInterviews(studentId);

      // Create lookup map by opportunity_id
      const pipelineMap = new Map();
      pipelineStatuses.forEach(ps => {
        if (ps.opportunity_id) {
          pipelineMap.set(ps.opportunity_id, ps);
        }
      });

      // Create interviews map by opportunity_id
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
        
        console.log({
          jobTitle: app.opportunity?.job_title,
          opportunityId: opportunityId,
          hasPipelineStatus: !!pipelineStatus,
          stage: pipelineStatus?.stage
        });
        
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
        };
      });

      return combinedData;
    } catch (error) {
      console.error('Error in getStudentApplicationsWithPipeline:', error);
      throw error;
    }
  }

  /**
   * Get stage change notifications for student
   * @param {string} studentId - Student's UUID
   * @param {number} limit - Number of notifications to fetch
   * @returns {Promise<Array>} Recent stage change notifications
   */
  static async getStageChangeNotifications(studentId, limit = 10) {
    try {
      // Get recent pipeline activities
      const activities = await this.getStudentPipelineActivities(studentId);

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
   * Subscribe to real-time pipeline updates for a student
   * @param {string} studentId - Student's UUID
   * @param {Function} onUpdate - Callback function when update occurs
   * @returns {Object} Supabase subscription channel
   */
  static subscribeToPipelineUpdates(studentId, onUpdate) {
    const channel = supabase
      .channel(`pipeline-updates-${studentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pipeline_candidates',
          filter: `student_id=eq.${studentId}`
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
          // Check if this activity belongs to this student
          const { data } = await supabase
            .from('pipeline_candidates')
            .select('student_id')
            .eq('id', payload.new.pipeline_candidate_id)
            .single();

          if (data && data.student_id === studentId) {
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
          filter: `student_id=eq.${studentId}`
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

export default StudentPipelineService;

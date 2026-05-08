import { supabase } from '@/shared/api/supabaseClient';
import { createlearnerNotification } from '@/features/notifications';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('appliedJobsService');

/**
 * Service for managing job applications
 */
export class AppliedJobsService {
  /**
   * Apply to a job opportunity
   * @param {string} learnerId - Learner's UUID
   * @param {number} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Application result
   */
  /**
   * Apply to a job opportunity
   * @param {string} learnerId - Learner's ID (learners.id, not user_id)
   * @param {string} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Application result
   */
  static async applyToJob(learnerId, opportunityId) {
    try {
      // Check if opportunity has available openings
      const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('applications_count, status, is_active, job_title, company_name')
        .eq('id', opportunityId)
        .single();

      if (oppError) {
        throw oppError;
      }

      if (!opportunity.is_active || opportunity.status === 'filled' || opportunity.applications_count === 0) {
        return {
          success: false,
          message: `All openings for ${opportunity.job_title} at ${opportunity.company_name} have been filled.`,
          data: null
        };
      }

      // Check if already applied
      const { data: existing } = await supabase
        .from('applied_jobs')
        .select('id')
        .eq('learner_id', learnerId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          message: 'You have already applied to this job',
          data: existing
        };
      }

      // Get learner details for pipeline
      const { data: learner, error: learnerError } = await supabase
        .from('learners')
        .select('name, email, contact_number')
        .eq('id', learnerId)
        .maybeSingle();

      if (learnerError) {
        throw learnerError;
      }

      if (!learner) {
        return {
          success: false,
          message: 'Learner profile not found'
        };
      }

      const profile = {
        name: learner?.name || '',
        email: learner?.email || '',
        contact_number: learner?.contact_number || ''
      };

      // Insert application
      const { data, error } = await supabase
        .from('applied_jobs')
        .insert([{
          learner_id: learnerId,
          opportunity_id: opportunityId,
          application_status: 'applied'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Automatically add to pipeline as "sourced"
      try {
        const { error: pipelineError } = await supabase
          .from('pipeline_candidates')
          .insert([{
            opportunity_id: opportunityId,
            learner_id: learnerId,
            candidate_name: profile.name || 'Unknown',
            candidate_email: profile.email || '',
            candidate_phone: profile.contact_number || '',
            stage: 'sourced',
            source: 'direct_application',
            status: 'active',
            added_at: new Date().toISOString(),
            stage_changed_at: new Date().toISOString()
          }]);

        if (pipelineError) {
          // Don't fail the application if pipeline insert fails
        }
      } catch (pipelineErr) {
        logger.error('Failed to add to pipeline', pipelineErr as Error);
      }

      return {
        success: true,
        message: 'Application submitted successfully!',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to submit application',
        error
      };
    }
  }

  /**
   * Check if learner has already applied to a job
   * @param {string} learnerId - Learner's ID (learners.id)
   * @param {string} opportunityId - Opportunity's ID
   * @returns {Promise<boolean>} True if already applied
   */
  static async hasApplied(learnerId, opportunityId) {
    try {
      const { data } = await supabase
        .from('applied_jobs')
        .select('id')
        .eq('learner_id', learnerId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all applications for a learner
   * @param {string} learnerId - Learner's ID (learners.id)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of applications
   */
  static async getlearnerApplications(learnerId, options = {}) {
    try {
      let query = supabase
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
        .eq('learner_id', learnerId)
        .order('applied_at', { ascending: false });

      if (options.status) query = query.eq('application_status', options.status);
      if (options.limit) query = query.limit(options.limit);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get application statistics for a learner
   * @param {string} learnerId - Learner's ID (learners.id)
   * @returns {Promise<Object>} Application statistics
   */
  static async getApplicationStats(learnerId) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select('application_status')
        .eq('learner_id', learnerId);

      if (error) throw error;

      const stats = data.reduce((acc, app) => {
        acc.total++;
        if (acc.hasOwnProperty(app.application_status)) {
          acc[app.application_status]++;
        }
        return acc;
      }, {
        total: 0,
        applied: 0,
        viewed: 0,
        under_review: 0,
        interview_scheduled: 0,
        interviewed: 0,
        offer_received: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get application stats', error as Error);
      throw error;
    }
  }

  /**
   * Update application status
   * @param {number} applicationId - Application ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated application
   */
  static async updateApplicationStatus(applicationId, status) {
    try {
      const now = new Date().toISOString();
      const updateData = { application_status: status, updated_at: now };

      if (status === 'viewed') updateData.viewed_at = now;
      else if (status === 'interview_scheduled') updateData.interview_scheduled_at = now;

      const { data, error } = await supabase
        .from('applied_jobs')
        .update(updateData)
        .eq('id', applicationId)
        .select(`
          *,
          learners!inner(email, name),
          opportunities!inner(title, company_name)
        `)
        .single();

      if (error) throw error;

      // Send notification to learner (respects their preferences)
      try {
        if (data?.learners?.email) {
          const jobTitle = data?.opportunities?.title || 'Position';
          const statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          await createlearnerNotification(
            data.learners.email,
            'application_update',
            `Application Status Updated: ${jobTitle}`,
            `Your application status has been updated to: ${statusText}`
          );
          
        }
      } catch (notifError) {
        logger.error('Failed to send notification', notifError as Error);
      }

      return data;
    } catch (error) {
      logger.error('Failed to update application status', error as Error);
      throw error;
    }
  }

  /**
   * Withdraw application
   * @param {string} applicationId - Application ID (UUID)
   * @param {string} learnerId - Learner ID (learners.id) for verification
   * @returns {Promise<Object>} Result
   */
  static async withdrawApplication(applicationId, learnerId) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .update({
          application_status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('learner_id', learnerId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, message: 'Application withdrawn successfully', data };
    } catch (error) {
      logger.error('Failed to withdraw application', error as Error);
      return { success: false, message: error.message || 'Failed to withdraw application', error };
    }
  }

  /**
   * Delete application completely
   * @param {string} applicationId - Application ID (UUID)
   * @param {string} learnerId - Learner ID (learners.id) for verification
   * @returns {Promise<Object>} Result
   */
  static async deleteApplication(applicationId, learnerId) {
    try {
      const { error } = await supabase
        .from('applied_jobs')
        .delete()
        .eq('id', applicationId)
        .eq('learner_id', learnerId);

      if (error) throw error;
      return { success: true, message: 'Application deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete application', error as Error);
      return { success: false, message: error.message || 'Failed to delete application', error };
    }
  }

  /**
   * Get recent applications (last 30 days)
   * @param {string} learnerId - Learner's ID (learners.id)
   * @returns {Promise<Array>} Recent applications
   */
  static async getRecentApplications(learnerId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('applied_jobs')
        .select('*, opportunity:opportunities!fk_applied_jobs_opportunity(job_title, company_name, company_logo)')
        .eq('learner_id', learnerId)
        .gte('applied_at', thirtyDaysAgo.toISOString())
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get recent applications', error as Error);
      throw error;
    }
  }

  /**
   * Get all applicants for recruiter (with learner and opportunity details)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of all applicants
   */
  static async getAllApplicants(options = {}) {
    try {
      // First, fetch all applied jobs
      let query = supabase
        .from('applied_jobs')
        .select('*');

      // Apply filters if provided
      if (options.status) {
        query = query.eq('application_status', options.status);
      }

      if (options.opportunityId) {
        query = query.eq('opportunity_id', options.opportunityId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Sort by applied date (most recent first)
      query = query.order('applied_at', { ascending: false });

      const { data: appliedJobs, error } = await query;

      if (error) {
        logger.error('Failed to fetch applied jobs', error as Error);
        throw error;
      }

      if (!appliedJobs || appliedJobs.length === 0) {
        return [];
      }

      // Fetch learner details for all applicants
      // Note: applied_jobs.learner_id references learners.user_id (not learners.id)
      const learnerIds = [...new Set(appliedJobs.map(job => job.learner_id))];

      // applied_jobs.learner_id references learners.id (not user_id)
      const { data: learners, error: learnersError } = await supabase
        .from('learners')
        .select('id, user_id, name, email, contact_number, university, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status')
        .in('id', learnerIds);

      if (learnersError) {
        logger.error('Failed to fetch learner details', learnersError as Error);
      }

      // Fetch opportunity details for all jobs
      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];
      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*')
        .in('id', opportunityIds);

      if (opportunitiesError) {
        logger.error('Failed to fetch opportunity details', opportunitiesError as Error);
      }

      // Create lookup maps - Use direct fields from learners table
      // Key by id since applied_jobs.learner_id references learners.id
      const learnerMap = (learners || []).reduce((acc, learner) => {
        acc[learner.id] = {
          id: learner.id, // Use id for consistency with applied_jobs.learner_id
          name: learner.name || 'Unknown',
          email: learner.email || '',
          phone: learner.contact_number ? String(learner.contact_number) : '',
          photo: null, // Photo not stored in learners table
          // Use direct DB columns
          department: learner.branch_field || learner.course_name || '',
          university: learner.university || '',
          college: learner.college_school_name || learner.university || '',
          district: learner.district_name || '',
          course: learner.course_name || '',
          cgpa: learner.currentCgpa || '',
          year_of_passing: learner.expectedGraduationDate ? learner.expectedGraduationDate.split('-')[0] : '',
          verified: learner.approval_status === 'approved' || false,
          employability_score: 0, // Not available in schema, set default
          skill: ''
        };
        return acc;
      }, {});

      const opportunityMap = (opportunities || []).reduce((acc, opp) => {
        acc[opp.id] = opp;
        return acc;
      }, {});

      // Combine all data
      const result = appliedJobs.map(job => ({
        ...job,
        learner: learnerMap[job.learner_id] || null,
        opportunity: opportunityMap[job.opportunity_id] || null
      }));

      return result;
    } catch (error) {
      logger.error('Failed to get all applicants', error as Error);
      throw error;
    }
  }

  /**
   * Get applicant statistics for recruiter
   * @returns {Promise<Object>} Applicant statistics
   */
  static async getApplicantStats() {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select('application_status');

      if (error) throw error;

      return data.reduce((acc, app) => {
        acc.total++;
        if (acc.hasOwnProperty(app.application_status)) {
          acc[app.application_status]++;
        }
        return acc;
      }, {
        total: 0,
        applied: 0,
        viewed: 0,
        under_review: 0,
        interview_scheduled: 0,
        interviewed: 0,
        offer_received: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
      });
    } catch (error) {
      logger.error('Failed to get applicant stats', error as Error);
      throw error;
    }
  }
}

export default AppliedJobsService;

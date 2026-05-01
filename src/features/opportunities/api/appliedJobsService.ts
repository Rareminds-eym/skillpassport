import { supabase } from '@/shared/api/supabaseClient';
import { createStudentNotification } from '@/features/notifications';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('appliedJobsService');

/**
 * Service for managing job applications
 */
export class AppliedJobsService {
  /**
   * Apply to a job opportunity
   * @param {string} studentId - Student's UUID
   * @param {number} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Application result
   */
  /**
   * Apply to a job opportunity
   * @param {string} studentId - Student's ID (students.id, not user_id)
   * @param {string} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Application result
   */
  static async applyToJob(studentId, opportunityId) {
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
        .eq('student_id', studentId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          message: 'You have already applied to this job',
          data: existing
        };
      }

      // Get student details for pipeline
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('name, email, contact_number')
        .eq('id', studentId)
        .maybeSingle();

      if (studentError) {
        throw studentError;
      }

      if (!student) {
        return {
          success: false,
          message: 'Student profile not found'
        };
      }

      const profile = {
        name: student?.name || '',
        email: student?.email || '',
        contact_number: student?.contact_number || ''
      };

      // Insert application
      const { data, error } = await supabase
        .from('applied_jobs')
        .insert([{
          student_id: studentId,
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
            student_id: studentId,
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
   * Check if student has already applied to a job
   * @param {string} studentId - Student's ID (students.id)
   * @param {string} opportunityId - Opportunity's ID
   * @returns {Promise<boolean>} True if already applied
   */
  static async hasApplied(studentId, opportunityId) {
    try {
      const { data } = await supabase
        .from('applied_jobs')
        .select('id')
        .eq('student_id', studentId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all applications for a student
   * @param {string} studentId - Student's ID (students.id)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of applications
   */
  static async getStudentApplications(studentId, options = {}) {
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
        .eq('student_id', studentId)
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
   * Get application statistics for a student
   * @param {string} studentId - Student's ID (students.id)
   * @returns {Promise<Object>} Application statistics
   */
  static async getApplicationStats(studentId) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select('application_status')
        .eq('student_id', studentId);

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
          students!inner(email, name),
          opportunities!inner(title, company_name)
        `)
        .single();

      if (error) throw error;

      // Send notification to student (respects their preferences)
      try {
        if (data?.students?.email) {
          const jobTitle = data?.opportunities?.title || 'Position';
          const statusText = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          await createStudentNotification(
            data.students.email,
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
   * @param {string} studentId - Student ID (students.id) for verification
   * @returns {Promise<Object>} Result
   */
  static async withdrawApplication(applicationId, studentId) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .update({
          application_status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .eq('student_id', studentId)
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
   * @param {string} studentId - Student ID (students.id) for verification
   * @returns {Promise<Object>} Result
   */
  static async deleteApplication(applicationId, studentId) {
    try {
      const { error } = await supabase
        .from('applied_jobs')
        .delete()
        .eq('id', applicationId)
        .eq('student_id', studentId);

      if (error) throw error;
      return { success: true, message: 'Application deleted successfully' };
    } catch (error) {
      logger.error('Failed to delete application', error as Error);
      return { success: false, message: error.message || 'Failed to delete application', error };
    }
  }

  /**
   * Get recent applications (last 30 days)
   * @param {string} studentId - Student's ID (students.id)
   * @returns {Promise<Array>} Recent applications
   */
  static async getRecentApplications(studentId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('applied_jobs')
        .select('*, opportunity:opportunities!fk_applied_jobs_opportunity(job_title, company_name, company_logo)')
        .eq('student_id', studentId)
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
   * Get all applicants for recruiter (with student and opportunity details)
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

      // Fetch student details for all applicants
      // Note: applied_jobs.student_id references students.user_id (not students.id)
      const studentIds = [...new Set(appliedJobs.map(job => job.student_id))];

      // applied_jobs.student_id references students.id (not user_id)
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, user_id, name, email, contact_number, university, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status')
        .in('id', studentIds);

      if (studentsError) {
        logger.error('Failed to fetch student details', studentsError as Error);
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

      // Create lookup maps - Use direct fields from students table
      // Key by id since applied_jobs.student_id references students.id
      const studentMap = (students || []).reduce((acc, student) => {
        acc[student.id] = {
          id: student.id, // Use id for consistency with applied_jobs.student_id
          name: student.name || 'Unknown',
          email: student.email || '',
          phone: student.contact_number ? String(student.contact_number) : '',
          photo: null, // Photo not stored in students table
          // Use direct DB columns
          department: student.branch_field || student.course_name || '',
          university: student.university || '',
          college: student.college_school_name || student.university || '',
          district: student.district_name || '',
          course: student.course_name || '',
          cgpa: student.currentCgpa || '',
          year_of_passing: student.expectedGraduationDate ? student.expectedGraduationDate.split('-')[0] : '',
          verified: student.approval_status === 'approved' || false,
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
        student: studentMap[job.student_id] || null,
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

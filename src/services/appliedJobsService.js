import { supabase } from '../lib/supabaseClient';

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
  static async applyToJob(studentId, opportunityId) {
    try {
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

      if (error) throw error;

      return {
        success: true,
        message: 'Application submitted successfully!',
        data
      };
    } catch (error) {
      console.error('Error in applyToJob:', error);
      return {
        success: false,
        message: error.message || 'Failed to submit application',
        error
      };
    }
  }

  /**
   * Check if student has already applied to a job
   * @param {string} studentId - Student's UUID
   * @param {number} opportunityId - Opportunity's ID
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
      console.error('Error in hasApplied:', error);
      return false;
    }
  }

  /**
   * Get all applications for a student
   * @param {string} studentId - Student's UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of applications
   */
  static async getStudentApplications(studentId, options = {}) {
    try {
      let query = supabase
        .from('applied_jobs')
        .select(`
          *,
          opportunity:opportunities (
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
      console.error('Error in getStudentApplications:', error);
      throw error;
    }
  }

  /**
   * Get application statistics for a student
   * @param {string} studentId - Student's UUID
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
      console.error('Error in getApplicationStats:', error);
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
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  /**
   * Withdraw application
   * @param {number} applicationId - Application ID
   * @param {string} studentId - Student UUID (for verification)
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
      console.error('Error withdrawing application:', error);
      return { success: false, message: error.message || 'Failed to withdraw application', error };
    }
  }

  /**
   * Delete application completely
   * @param {number} applicationId - Application ID
   * @param {string} studentId - Student UUID (for verification)
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
      console.error('Error deleting application:', error);
      return { success: false, message: error.message || 'Failed to delete application', error };
    }
  }

  /**
   * Get recent applications (last 30 days)
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Array>} Recent applications
   */
  static async getRecentApplications(studentId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('applied_jobs')
        .select('*, opportunity:opportunities(job_title, company_name, company_logo)')
        .eq('student_id', studentId)
        .gte('applied_at', thirtyDaysAgo.toISOString())
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getRecentApplications:', error);
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
        console.error('Error fetching applied jobs:', error);
        throw error;
      }

      if (!appliedJobs || appliedJobs.length === 0) {
        return [];
      }

      // Fetch student details for all applicants
      const studentIds = [...new Set(appliedJobs.map(job => job.student_id))];
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, profile')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      }

      // Fetch opportunity details for all jobs
      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];
      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*')
        .in('id', opportunityIds);

      if (opportunitiesError) {
        console.error('Error fetching opportunities:', opportunitiesError);
      }

      // Create lookup maps - Extract data from profile JSONB
      const studentMap = (students || []).reduce((acc, student) => {
        const profile = student.profile || {};
        acc[student.id] = {
          id: student.id,
          name: profile.name || 'Unknown',
          email: profile.email || '',
          phone: profile.contact_number ? String(profile.contact_number) : '',
          photo: profile.photo || null,
          department: profile.branch_field || '',
          university: profile.university || '',
          cgpa: profile.cgpa || '',
          year_of_passing: profile.year_of_passing || '',
          verified: student.verified || false,
          employability_score: student.employability_score || 0,
          district: profile.district_name || '',
          college: profile.college_school_name || '',
          course: profile.course || '',
          skill: profile.skill || ''
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
      console.error('Error in getAllApplicants:', error);
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
      console.error('Error in getApplicantStats:', error);
      throw error;
    }
  }
}

export default AppliedJobsService;

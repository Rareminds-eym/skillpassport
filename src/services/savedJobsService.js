import { supabase } from '../lib/supabaseClient';

/**
 * Service for managing saved jobs/opportunities
 */
export class SavedJobsService {
  /**
   * Save a job opportunity
   * @param {string} studentId - Student's UUID
   * @param {number} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Save result
   */
  static async saveJob(studentId, opportunityId) {
    try {
      // Check if already saved
      const { data: existing, error: checkError } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('student_id', studentId)
        .eq('opportunity_id', opportunityId)
        .single();

      if (existing) {
        return {
          success: true,
          message: 'Job is already saved',
          data: existing,
          alreadySaved: true,
        };
      }

      // Insert saved job
      const { data, error } = await supabase
        .from('saved_jobs')
        .insert([
          {
            student_id: studentId,
            opportunity_id: opportunityId,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving job:', error);
        throw error;
      }

      return {
        success: true,
        message: 'Job saved successfully!',
        data,
        alreadySaved: false,
      };
    } catch (error) {
      console.error('❌ Error in saveJob:', error);
      return {
        success: false,
        message: error.message || 'Failed to save job',
        error,
      };
    }
  }

  /**
   * Unsave a job opportunity
   * @param {string} studentId - Student's UUID
   * @param {number} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Unsave result
   */
  static async unsaveJob(studentId, opportunityId) {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('student_id', studentId)
        .eq('opportunity_id', opportunityId)
        .select();

      if (error) {
        console.error('❌ Error unsaving job:', error);
        throw error;
      }

      return {
        success: true,
        message: 'Job unsaved successfully!',
        data,
      };
    } catch (error) {
      console.error('❌ Error in unsaveJob:', error);
      return {
        success: false,
        message: error.message || 'Failed to unsave job',
        error,
      };
    }
  }

  /**
   * Toggle save status of a job (save if not saved, unsave if saved)
   * @param {string} studentId - Student's UUID
   * @param {number} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Toggle result with isSaved status
   */
  static async toggleSaveJob(studentId, opportunityId) {
    try {
      const isSaved = await this.isSaved(studentId, opportunityId);

      if (isSaved) {
        const result = await this.unsaveJob(studentId, opportunityId);
        return {
          ...result,
          isSaved: false,
        };
      } else {
        const result = await this.saveJob(studentId, opportunityId);
        return {
          ...result,
          isSaved: true,
        };
      }
    } catch (error) {
      console.error('❌ Error in toggleSaveJob:', error);
      return {
        success: false,
        message: error.message || 'Failed to toggle save status',
        error,
      };
    }
  }

  /**
   * Check if student has saved a job
   * @param {string} studentId - Student's UUID
   * @param {number} opportunityId - Opportunity's ID
   * @returns {Promise<boolean>} True if job is saved
   */
  static async isSaved(studentId, opportunityId) {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('id')
        .eq('student_id', studentId)
        .eq('opportunity_id', opportunityId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error checking saved status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isSaved:', error);
      return false;
    }
  }

  /**
   * Get all saved jobs for a student (just IDs)
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Array>} List of saved job IDs
   */
  static async getSavedJobIds(studentId) {
    try {
      const { data, error } = await supabase
        .from('saved_jobs')
        .select('opportunity_id')
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching saved job IDs:', error);
        throw error;
      }

      return data.map((item) => item.opportunity_id);
    } catch (error) {
      console.error('Error in getSavedJobIds:', error);
      return [];
    }
  }

  /**
   * Get all saved jobs for a student with full opportunity details
   * @param {string} studentId - Student's UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of saved jobs with details
   */
  static async getSavedJobsWithDetails(studentId, options = {}) {
    try {
      let query = supabase
        .from('saved_jobs')
        .select(
          `
          *,
          opportunity:opportunities (
            id,
            title,
            job_title,
            company_name,
            company_logo,
            employment_type,
            location,
            mode,
            stipend_or_salary,
            salary_range_min,
            salary_range_max,
            experience_required,
            experience_level,
            skills_required,
            description,
            application_link,
            deadline,
            posted_date,
            is_active,
            department,
            created_at
          )
        `
        )
        .eq('student_id', studentId);

      // Apply filters
      if (options.activeOnly) {
        // Filter for active opportunities only (requires join, done via RPC or post-filter)
      }

      // Sort by saved date (most recent first)
      query = query.order('saved_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching saved jobs:', error);
        throw error;
      }

      // Map to flatten opportunity data and add applied status check
      const savedJobs = data.map((item) => ({
        saved_job_id: item.id,
        saved_at: item.saved_at,
        ...item.opportunity,
      }));

      // Filter out inactive jobs if requested
      if (options.activeOnly) {
        return savedJobs.filter((job) => job.is_active);
      }

      return savedJobs;
    } catch (error) {
      console.error('Error in getSavedJobsWithDetails:', error);
      throw error;
    }
  }

  /**
   * Get saved jobs with applied status
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Array>} Saved jobs with applied status
   */
  static async getSavedJobsWithAppliedStatus(studentId) {
    try {
      // First get saved jobs
      const savedJobs = await this.getSavedJobsWithDetails(studentId);

      // Then get applied jobs
      const { data: appliedJobs, error } = await supabase
        .from('applied_jobs')
        .select('opportunity_id, application_status, applied_at')
        .eq('student_id', studentId);

      if (error) {
        console.error('Error fetching applied status:', error);
        return savedJobs; // Return without applied status
      }

      // Create a map for quick lookup
      const appliedMap = new Map(appliedJobs.map((app) => [app.opportunity_id, app]));

      // Merge applied status
      return savedJobs.map((job) => ({
        ...job,
        has_applied: appliedMap.has(job.id),
        application_status: appliedMap.get(job.id)?.application_status || null,
        applied_at: appliedMap.get(job.id)?.applied_at || null,
      }));
    } catch (error) {
      console.error('Error in getSavedJobsWithAppliedStatus:', error);
      throw error;
    }
  }

  /**
   * Get count of saved jobs
   * @param {string} studentId - Student's UUID
   * @returns {Promise<number>} Count of saved jobs
   */
  static async getSavedJobsCount(studentId) {
    try {
      const { count, error } = await supabase
        .from('saved_jobs')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error in getSavedJobsCount:', error);
      return 0;
    }
  }

  /**
   * Remove all saved jobs for inactive opportunities
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Object>} Result
   */
  static async removeInactiveSavedJobs(studentId) {
    try {
      // Get all saved jobs
      const savedJobs = await this.getSavedJobsWithDetails(studentId);

      // Filter inactive ones
      const inactiveJobIds = savedJobs.filter((job) => !job.is_active).map((job) => job.id);

      if (inactiveJobIds.length === 0) {
        return {
          success: true,
          message: 'No inactive saved jobs to remove',
          count: 0,
        };
      }

      // Delete them
      const { error } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('student_id', studentId)
        .in('opportunity_id', inactiveJobIds);

      if (error) throw error;

      return {
        success: true,
        message: `Removed ${inactiveJobIds.length} inactive saved jobs`,
        count: inactiveJobIds.length,
      };
    } catch (error) {
      console.error('Error removing inactive saved jobs:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove inactive jobs',
        error,
      };
    }
  }

  /**
   * Get saved jobs statistics
   * @param {string} studentId - Student's UUID
   * @returns {Promise<Object>} Statistics
   */
  static async getSavedJobsStats(studentId) {
    try {
      const savedJobs = await this.getSavedJobsWithAppliedStatus(studentId);

      const stats = {
        total: savedJobs.length,
        active: savedJobs.filter((job) => job.is_active).length,
        inactive: savedJobs.filter((job) => !job.is_active).length,
        applied: savedJobs.filter((job) => job.has_applied).length,
        not_applied: savedJobs.filter((job) => !job.has_applied).length,
        by_type: {},
      };

      // Group by employment type
      savedJobs.forEach((job) => {
        const type = job.employment_type || 'unknown';
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error in getSavedJobsStats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        applied: 0,
        not_applied: 0,
        by_type: {},
      };
    }
  }
}

export default SavedJobsService;

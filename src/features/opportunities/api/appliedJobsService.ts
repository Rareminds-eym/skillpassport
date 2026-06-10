import { createlearnerNotification } from '@/features/notifications';
import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('appliedJobsService');

/**
 * Service for managing job applications
 */
export class AppliedJobsService {
  /**
   * Apply to a job opportunity
   * @param {string} learnerId - Learner's ID (learners.id, not user_id)
   * @param {string} opportunityId - Opportunity's ID
   * @returns {Promise<Object>} Application result
   */
  static async applyToJob(learnerId, opportunityId) {
    try {
      // Check if opportunity has available openings
      const response: any = await apiPost('/opportunities', { action: 'apply-to-job', learner_id: learnerId, opportunity_id: opportunityId });
      return response.data;
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
      const response: any = await apiPost('/opportunities', { action: 'has-applied', learner_id: learnerId, opportunity_id: opportunityId });
      return response?.data?.hasApplied || false;
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
      const response: any = await apiPost('/opportunities', { action: 'get-learner-applications', learner_id: learnerId, status: options.status, limit: options.limit });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.applications || [];
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
      const response: any = await apiPost('/opportunities', { action: 'get-learner-application-stats', learner_id: learnerId });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.stats;
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
      const response: any = await apiPost('/opportunities', { action: 'update-application-status', id: applicationId, status });
      if (response?.error) throw new Error(response.error.message);
      const data = response?.data?.application;

      // Send notification to learner
      try {
        await createlearnerNotification(
          data?.learners?.email || '',
          'application_update',
          `Application Status Updated: ${data?.opportunities?.title || 'Position'}`,
          `Your application status has been updated to: ${status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
        );
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
      const response: any = await apiPost('/opportunities', { action: 'withdraw-application', id: applicationId, learner_id: learnerId });
      if (response?.error) return { success: false, message: response.error.message || 'Failed to withdraw application', error: response.error };
      return response.data;
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
      const response: any = await apiPost('/opportunities', { action: 'delete-application', id: applicationId, learner_id: learnerId });
      if (response?.error) return { success: false, message: response.error.message || 'Failed to delete application', error: response.error };
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
      const response: any = await apiPost('/opportunities', { action: 'get-recent-applications', learner_id: learnerId });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.applications || [];
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
      const response: any = await apiPost('/opportunities', { action: 'get-all-applicants', ...options });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.applicants || [];
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
      const response: any = await apiPost('/opportunities', { action: 'get-applicant-stats' });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.stats;
    } catch (error) {
      logger.error('Failed to get applicant stats', error as Error);
      throw error;
    }
  }
}

export default AppliedJobsService;

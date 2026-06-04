import { apiPost } from '@/shared/api/apiClient';

export class SavedJobsService {
  static async saveJob(learnerId, opportunityId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'save-job', learner_id: learnerId, opportunity_id: opportunityId });
      if (response?.error) return { success: false, message: response.error.message, error: response.error };
      return response.data || { success: true, message: 'Job saved successfully!', alreadySaved: false };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to save job', error };
    }
  }

  static async unsaveJob(learnerId, opportunityId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'unsave-job', learner_id: learnerId, opportunity_id: opportunityId });
      if (response?.error) return { success: false, message: response.error.message, error: response.error };
      return response.data || { success: true, message: 'Job unsaved successfully!' };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to unsave job', error };
    }
  }

  static async toggleSaveJob(learnerId, opportunityId) {
    try {
      const isSaved = await this.isSaved(learnerId, opportunityId);
      if (isSaved) {
        const result = await this.unsaveJob(learnerId, opportunityId);
        return { ...result, isSaved: false };
      } else {
        const result = await this.saveJob(learnerId, opportunityId);
        return { ...result, isSaved: true };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Failed to toggle save status', error };
    }
  }

  static async isSaved(learnerId, opportunityId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'is-saved', learner_id: learnerId, opportunity_id: opportunityId });
      if (response?.error) return false;
      return response?.data?.isSaved || false;
    } catch (error) {
      return false;
    }
  }

  static async getSavedJobIds(learnerId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-saved-job-ids', learner_id: learnerId });
      if (response?.error) return [];
      return response?.data?.ids || [];
    } catch (error) {
      return [];
    }
  }

  static async getSavedJobsWithDetails(learnerId, options = {}) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-saved-jobs-with-details', learner_id: learnerId, ...options });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.savedJobs || [];
    } catch (error) {
      throw error;
    }
  }

  static async getSavedJobsWithAppliedStatus(learnerId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-saved-jobs-with-applied-status', learner_id: learnerId });
      if (response?.error) return [];
      return response?.data?.savedJobs || [];
    } catch (error) {
      throw error;
    }
  }

  static async getSavedJobsCount(learnerId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-saved-jobs-count', learner_id: learnerId });
      if (response?.error) return 0;
      return response?.data?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  static async removeInactiveSavedJobs(learnerId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'remove-inactive-saved-jobs', learner_id: learnerId });
      if (response?.error) return { success: false, message: response.error.message, error: response.error };
      return response.data || { success: true, message: 'No inactive saved jobs to remove', count: 0 };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to remove inactive jobs', error };
    }
  }

  static async getSavedJobsStats(learnerId) {
    try {
      const savedJobs = await this.getSavedJobsWithAppliedStatus(learnerId);
      const stats = {
        total: savedJobs.length,
        active: savedJobs.filter(job => job.is_active).length,
        inactive: savedJobs.filter(job => !job.is_active).length,
        applied: savedJobs.filter(job => job.has_applied).length,
        not_applied: savedJobs.filter(job => !job.has_applied).length,
        by_type: {} as Record<string, number>
      };
      savedJobs.forEach(job => {
        const type = job.employment_type || 'unknown';
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
      });
      return stats;
    } catch (error) {
      return { total: 0, active: 0, inactive: 0, applied: 0, not_applied: 0, by_type: {} };
    }
  }
}

export default SavedJobsService;

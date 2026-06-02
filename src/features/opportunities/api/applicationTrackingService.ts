import { getLogger } from '@/shared/config/logging';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('applicationTrackingService');

export interface ApplicationTrackingData {
  id: number;
  learner_id: string;
  opportunity_id: number;
  application_status: 'applied' | 'viewed' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  updated_at: string;
  viewed_at?: string;
  interview_scheduled_at?: string;
  notes?: string;
  
  // Joined data
  learner?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    contact_number?: string;
    university?: string;
    branch_field?: string;
    course_name?: string;
    college_school_name?: string;
    district_name?: string;
    currentCgpa?: number;
    expectedGraduationDate?: string;
    approval_status?: string;
    profile?: any;
  };
  
  opportunity?: {
    id: number;
    title: string;
    job_title: string;
    company_name: string;
    department: string;
    employment_type: string;
    location: string;
    mode?: string;
    salary_range_min?: number;
    salary_range_max?: number;
    stipend_or_salary?: string;
    experience_required?: string;
    skills_required?: string[] | string;
    description?: string;
    deadline?: string;
    is_active: boolean;
    created_at: string;
  };
  
  company?: {
    id: string;
    name: string;
    industry?: string;
    companySize?: string;
    hqCity?: string;
    hqState?: string;
    website?: string;
    accountStatus?: string;
  };
}

export interface ApplicationFilters {
  search?: string;
  status?: string;
  company_name?: string;
  department?: string;
  employment_type?: string;
  date_from?: string;
  date_to?: string;
  college_id?: string;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  viewed: number;
  under_review: number;
  interview_scheduled: number;
  interviewed: number;
  offer_received: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

class ApplicationTrackingService {
  /**
   * Get all applications with learner, opportunity, and company details
   */
  async getAllApplications(filters: ApplicationFilters = {}): Promise<ApplicationTrackingData[]> {
    try {
      // First get applied jobs
      const response: any = await apiPost('/opportunities', { action: 'get-all-applications', ...filters });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.applications || [];
    } catch (error) {
      logger.error('Failed to fetch all applications', error as Error);
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(filters: ApplicationFilters = {}): Promise<ApplicationStats> {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-application-stats', ...filters });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.stats || {
        total: 0, applied: 0, viewed: 0, under_review: 0,
        interview_scheduled: 0, interviewed: 0, offer_received: 0,
        accepted: 0, rejected: 0, withdrawn: 0
      };
    } catch (error) {
      logger.error('Failed to get application stats', error as Error);
      throw error;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: number, 
    status: string, 
    notes?: string
  ): Promise<ApplicationTrackingData> {
    try {
      const response: any = await apiPost('/opportunities', { action: 'update-application-status', id: applicationId, status, notes });
      if (response?.error) throw new Error(response.error.message);

      // Return the updated application with joined data
      const applications = await this.getAllApplications();
      const updatedApplication = applications.find(app => app.id === applicationId);
      
      return updatedApplication || response?.data?.application;
    } catch (error) {
      logger.error('Failed to update application status', error as Error);
      throw error;
    }
  }

  /**
   * Bulk update application statuses
   */
  async bulkUpdateApplications(
    applicationIds: number[], 
    status: string, 
    notes?: string
  ): Promise<ApplicationTrackingData[]> {
    try {
      const response: any = await apiPost('/opportunities', { action: 'bulk-update-applications', ids: applicationIds, status, notes });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.applications || [];
    } catch (error) {
      logger.error('Failed to bulk update applications', error as Error);
      throw error;
    }
  }

  /**
   * Get unique companies from applications
   */
  async getCompaniesWithApplications(): Promise<Array<{id: string, name: string}>> {
    try {
      // Get all opportunities that have applications
      const response: any = await apiPost('/opportunities', { action: 'get-companies-with-applications' });
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.companies || [];
    } catch (error) {
      logger.error('Failed to get companies with applications', error as Error);
      throw error;
    }
  }

  /**
   * Get unique departments from applications
   */
  async getDepartmentsWithApplications(): Promise<string[]> {
    try {
      const applications = await this.getAllApplications();
      
      const departments = new Set<string>();
      
      applications.forEach(app => {
        if (app.learner?.branch_field) departments.add(app.learner.branch_field);
        if (app.learner?.course_name) departments.add(app.learner.course_name);
        if (app.opportunity?.department) departments.add(app.opportunity.department);
      });

      return Array.from(departments).filter(dept => dept && dept.trim().length > 0);
    } catch (error) {
      logger.error('Failed to get departments with applications', error as Error);
      throw error;
    }
  }

  /**
   * Get pipeline data for a specific application
   */
  async getPipelineDataForApplication(learnerId: string, opportunityId: number): Promise<any> {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-pipeline-data-for-application', learner_id: learnerId, opportunity_id: opportunityId });
      if (response?.error) return null;
      return response?.data?.pipelineCandidate;
    } catch (error) {
      logger.error('Failed to get pipeline data for application', error as Error);
      return null;
    }
  }

  /**
   * Get application by ID with full details
   */
  async getApplicationById(id: number): Promise<ApplicationTrackingData | null> {
    try {
      const applications = await this.getAllApplications();
      return applications.find(app => app.id === id) || null;
    } catch (error) {
      logger.error('Failed to get application by ID', error as Error);
      throw error;
    }
  }
}

export const applicationTrackingService = new ApplicationTrackingService();
export default applicationTrackingService;
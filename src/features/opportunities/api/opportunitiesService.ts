import { apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost } from '@/shared/api/apiClient';

const logger = getLogger('opportunitiesService');

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: any;
  meta: {
    requestId: string;
    timestamp: string;
    durationMs?: number;
  };
}

export interface Opportunity {
  id:string;
  title: string;
  company_name: string;
  company_logo?: string;
  employment_type: string;
  location: string;
  mode?: string;
  stipend_or_salary?: string;
  salary_range_min?: number;
  salary_range_max?: number;
  experience_required?: string;
  skills_required?: string[] | string;
  description?: string;
  application_link?: string;
  deadline?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department: string;
  experience_level?: string;
  status?: string;
  posted_date?: string;
  closing_date?: string;
  requirements?: string[] | string;
  responsibilities?: string[] | string;
  benefits?: string[] | string;
  applications_count: number;
  messages_count: number;
  views_count: number;
  created_by?: string;
  job_title: string;
  recruiter_id?: string;
  requisition_id?: string;
  sector?: string;
  exposure_type?: string;
  total_hours?: number;
  duration_weeks?: number;
  duration_days?: number;
  schedule_note?: string;
  what_youll_learn?: string;
  what_youll_do?: string;
  final_artifact_type?: string;
  final_artifact_description?: string;
  mentor_bio?: string;
  safety_note?: string;
  parent_role?: string;
  cost_inr?: number;
  cost_note?: string;
  prerequiste?: string;
}

export interface OpportunityFilters {
  search?: string;
  status?: string;
  employment_type?: string;
  mode?: string;
  department?: string;
  is_active?: boolean;
  includeFactoryVisits?: boolean;
}

class OpportunitiesService {
  async getAllOpportunities(filters?: OpportunityFilters): Promise<Opportunity[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('sortBy', 'newest');
      if (filters?.search) params.set('search', filters.search);
      if (filters?.employment_type) params.set('employmentType', filters.employment_type);
      if (filters?.mode) params.set('mode', filters.mode);
      if (filters?.department) params.set('department', filters.department);
      const response = await apiGet<ApiResponse<{ opportunities: Opportunity[] }>>(`/opportunities?${params.toString()}`);
      const opportunities = response?.data?.opportunities || [];
      if (filters?.status) return opportunities.filter((o: any) => o.status === filters.status);
      if (filters?.is_active !== undefined) return opportunities.filter((o: any) => o.is_active === filters.is_active);
      return opportunities;
    } catch (error) {
      console.error('Error in getAllOpportunities:', error);
      throw error;
    }
  }

  async getOpportunityById(id: number | string): Promise<Opportunity | null> {
    try {
      const response = await apiGet<ApiResponse<{ opportunity: Opportunity }>>(`/opportunities?id=${id}`);
      console.log('getOpportunityById response:', response);
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      if (response.error) throw new Error(response.error.message || 'Failed to fetch opportunity');
      return response.data.opportunity || null;
    } catch (error) {
      console.error('Error in getOpportunityById:', error);
      throw error;
    }
  }

  async createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const response = await apiPost<ApiResponse<{ opportunity: Opportunity }>>('/opportunities', { action: 'create-opportunity', opportunity });
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      if (response.error) throw new Error(response.error.message || 'Failed to create opportunity');
      return response.data.opportunity;
    } catch (error) {
      console.error('Error in createOpportunity:', error);
      throw error;
    }
  }

  async updateOpportunity(id: number | string, updates: Partial<Opportunity>): Promise<Opportunity> {
    try {
      console.log('updateOpportunity called with:', { id, updates });
      const response = await apiPost<ApiResponse<{ opportunity: Opportunity }>>('/opportunities', { action: 'update-opportunity', id, updates });
      console.log('updateOpportunity response:', response);
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      if (response.error) throw new Error(response.error.message || 'Failed to update opportunity');
      return response.data.opportunity;
    } catch (error) {
      console.error('Error in updateOpportunity:', error);
      throw error;
    }
  }

  async deleteOpportunity(id: number | string): Promise<void> {
    try {
      const response = await apiPost<ApiResponse<{ deleted: boolean }>>('/opportunities', { action: 'delete-opportunity', id });
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      if (response.error) throw new Error(response.error.message || 'Failed to delete opportunity');
    } catch (error) {
      console.error('Error in deleteOpportunity:', error);
      throw error;
    }
  }

  async incrementViewCount(id: number | string): Promise<void> {
    try {
      console.log('incrementViewCount called with id:', id);
      const response = await apiPost<ApiResponse<{ incremented: boolean }>>('/opportunities', { action: 'increment-view-count', id });
      console.log('incrementViewCount response:', response);
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      if (response.error) {
        logger.error('Failed to increment view count', new Error(response.error.message || 'Unknown error'));
        throw new Error(response.error.message || 'Failed to increment view count');
      }
    } catch (error) {
      logger.error('Failed to increment view count', error as Error);
      throw error;
    }
  }

  // Helper method to format salary display
  formatSalary(opportunity: Opportunity): string {
    if (opportunity.stipend_or_salary) {
      return opportunity.stipend_or_salary;
    }
    
    if (opportunity.salary_range_min && opportunity.salary_range_max) {
      const minLakhs = (opportunity.salary_range_min / 100000).toFixed(1);
      const maxLakhs = (opportunity.salary_range_max / 100000).toFixed(1);
      return `₹${minLakhs}L - ₹${maxLakhs}L`;
    }
    
    if (opportunity.salary_range_min) {
      const lakhs = (opportunity.salary_range_min / 100000).toFixed(1);
      return `₹${lakhs}L+`;
    }
    
    return 'Not specified';
  }

  // Helper method to format skills
  formatSkills(skills: string[] | string | null | undefined): string[] {
    if (!skills) return [];
    
    if (typeof skills === 'string') {
      // Handle comma-separated string or single skill
      return skills.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
    }
    
    if (Array.isArray(skills)) {
      return skills.filter(skill => skill && skill.trim().length > 0);
    }
    
    return [];
  }

  // Helper method to get status badge color
  getStatusBadgeColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Format opportunity for display in UI
  formatOpportunityForDisplay(opportunity: Opportunity): Opportunity & {
    formattedSalary: string;
    formattedSkills: string[];
    statusBadgeColor: string;
  } {
    return {
      ...opportunity,
      formattedSalary: this.formatSalary(opportunity),
      formattedSkills: this.formatSkills(opportunity.skills_required),
      statusBadgeColor: this.getStatusBadgeColor(opportunity.status),
    };
  }

  // Search opportunities by term
  async searchOpportunities(searchTerm: string): Promise<Opportunity[]> {
    try {
      const params = new URLSearchParams({ search: searchTerm, limit: '50' });
      const response = await apiGet<ApiResponse<{ opportunities: Opportunity[] }>>(`/opportunities?${params.toString()}`);
      if (response?.error) throw new Error(response.error.message);
      return response?.data?.opportunities || [];
    } catch (error) {
      logger.error('Failed to search opportunities', error as Error);
      throw error;
    }
  }

  // Get filtered opportunities
  async getFilteredOpportunities(filters: OpportunityFilters): Promise<Opportunity[]> {
    return this.getAllOpportunities(filters);
  }

  // Get paginated opportunities with server-side pagination
  async getPaginatedOpportunities(options: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    sortBy?: string;
    filters?: any;
    activeOnly?: boolean;
  }): Promise<{ data: Opportunity[]; count: number }> {
    try {
      const {
        page = 1,
        pageSize = 6,
        searchTerm = '',
        sortBy = 'newest',
        filters = {},
        activeOnly = true
      } = options;

      const params = new URLSearchParams();
      params.set('limit', String(pageSize));
      params.set('offset', String((page - 1) * pageSize));
      if (searchTerm) params.set('search', searchTerm);
      params.set('sortBy', sortBy);
      params.set('activeOnly', String(activeOnly));
      if (filters.employmentType?.length) params.set('employmentType', filters.employmentType.join(','));
      if (filters.experienceLevel?.length) params.set('experienceLevel', filters.experienceLevel.join(','));
      if (filters.mode?.length) params.set('mode', filters.mode.join(','));
      if (filters.department?.length) params.set('department', filters.department.join(','));
      if (filters.salaryMin) params.set('salaryMin', filters.salaryMin);
      if (filters.salaryMax) params.set('salaryMax', filters.salaryMax);
      if (filters.postedWithin) params.set('postedWithin', filters.postedWithin);

      const response = await apiGet<ApiResponse<{ opportunities: Opportunity[]; total: number }>>(`/opportunities?${params.toString()}`);
      const data = response?.data?.opportunities ?? [];
      const total = response?.data?.total ?? data.length;
      return { data, count: total };
    } catch (error: any) {
      console.error('[opportunitiesService] Error in getPaginatedOpportunities:', error);
      if (error?.message?.includes('416') || error?.message?.includes('Range Not Satisfiable')) {
        return {
          data: [],
          count: 0
        };
      }
      throw error;
    }
  }

  // Get placement statistics from applied_jobs table (simplified direct approach)
  async getPlacementStats(): Promise<{
    learnersPlaced: number;
    placementRate: number;
    totallearners: number;
    avgCTC: number;
    medianCTC: number;
    highestCTC: number;
  }> {
    try {
      // Get current user's college_id
      const user = useAuthStore.getState().user;
      let currentCollegeId = null;
      
      if (user) {
        // Try to get college_id from college_lecturers table
        // College lookup handled server-side
      }

      // Get total learners from learners table (filter by college)
      const response = await apiPost<ApiResponse<{
        learnersPlaced: number;
        placementRate: number;
        totallearners: number;
        avgCTC: number;
        medianCTC: number;
        highestCTC: number;
      }>>('/opportunities', { action: 'get-placement-stats' });
      if (response?.error) throw new Error(response.error.message);
      return response.data || { learnersPlaced: 0, placementRate: 0, totallearners: 0, avgCTC: 0, medianCTC: 0, highestCTC: 0 };
    } catch (error) {
      console.error('Error in getPlacementStats:', error);
      return {
        learnersPlaced: 0,
        placementRate: 0,
        totallearners: 0,
        avgCTC: 0,
        medianCTC: 0,
        highestCTC: 0
      };
    }
  }

  // Get opportunities statistics
  async getOpportunitiesStats(): Promise<{
    total: number;
    active: number;
    draft: number;
    closed: number;
    cancelled: number;
  }> {
    try {
      // Get total count
      const response = await apiPost<ApiResponse<{
        total: number;
        active: number;
        draft: number;
        closed: number;
        cancelled: number;
      }>>('/opportunities', { action: 'get-opportunities-stats' });
      if (response?.error) throw new Error(response.error.message);
      return response.data || { total: 0, active: 0, draft: 0, closed: 0, cancelled: 0 };
    } catch (error) {
      console.error('Error in getOpportunitiesStats:', error);
      throw error;
    }
  }
}

export const opportunitiesService = new OpportunitiesService();

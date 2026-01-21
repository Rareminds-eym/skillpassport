import { supabase } from '../lib/supabaseClient';

export interface Opportunity {
  id: number;
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
}

class OpportunitiesService {
  async getAllOpportunities(filters?: OpportunityFilters): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,department.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%`
        );
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.employment_type) {
        query = query.eq('employment_type', filters.employment_type);
      }

      if (filters?.mode) {
        query = query.eq('mode', filters.mode);
      }

      if (filters?.department) {
        query = query.eq('department', filters.department);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error } = await query;

      if (error) {
        console.error('OpportunitiesService: Error fetching opportunities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('OpportunitiesService: Error in getAllOpportunities:', error);
      throw error;
    }
  }

  async getOpportunityById(id: number): Promise<Opportunity | null> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching opportunity:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOpportunityById:', error);
      throw error;
    }
  }

  async createOpportunity(opportunity: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([opportunity])
        .select()
        .single();

      if (error) {
        console.error('Error creating opportunity:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createOpportunity:', error);
      throw error;
    }
  }

  async updateOpportunity(id: number, updates: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating opportunity:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateOpportunity:', error);
      throw error;
    }
  }

  async deleteOpportunity(id: number): Promise<void> {
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);

      if (error) {
        console.error('Error deleting opportunity:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteOpportunity:', error);
      throw error;
    }
  }

  async incrementViewCount(id: number): Promise<void> {
    try {
      // First get the current count
      const { data: currentData, error: fetchError } = await supabase
        .from('opportunities')
        .select('views_count')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current view count:', fetchError);
        throw fetchError;
      }

      const currentCount = currentData?.views_count || 0;

      // Then update with incremented count
      const { error } = await supabase
        .from('opportunities')
        .update({ views_count: currentCount + 1 })
        .eq('id', id);

      if (error) {
        console.error('Error incrementing view count:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in incrementViewCount:', error);
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
      return skills
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);
    }

    if (Array.isArray(skills)) {
      return skills.filter((skill) => skill && skill.trim().length > 0);
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
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .or(
          `title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching opportunities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchOpportunities:', error);
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
        activeOnly = true,
      } = options;

      // Calculate offset
      const offset = (page - 1) * pageSize;

      // Build query
      let query = supabase.from('opportunities').select('*', { count: 'exact' });

      // Apply active filter
      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      // Apply search term
      if (searchTerm && searchTerm.trim()) {
        query = query.or(
          `title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`
        );
      }

      // Apply filters
      if (filters.employmentType && filters.employmentType.length > 0) {
        query = query.in('employment_type', filters.employmentType);
      }

      if (filters.experienceLevel && filters.experienceLevel.length > 0) {
        query = query.in('experience_level', filters.experienceLevel);
      }

      if (filters.mode && filters.mode.length > 0) {
        query = query.in('mode', filters.mode);
      }

      if (filters.department && filters.department.length > 0) {
        query = query.in('department', filters.department);
      }

      if (filters.salaryMin) {
        query = query.gte('salary_range_min', parseInt(filters.salaryMin));
      }

      if (filters.salaryMax) {
        query = query.lte('salary_range_max', parseInt(filters.salaryMax));
      }

      if (filters.postedWithin) {
        const daysAgo = parseInt(filters.postedWithin);
        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
        query = query.gte('created_at', dateThreshold.toISOString());
      }

      // Apply sorting
      const ascending = sortBy === 'oldest';
      query = query.order('created_at', { ascending });

      // Apply pagination
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching paginated opportunities:', error);
        throw error;
      }

      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      console.error('Error in getPaginatedOpportunities:', error);
      throw error;
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
      const { count: total, error: totalError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total opportunities count:', totalError);
        throw totalError;
      }

      // Get active count (status = 'open' or is_active = true)
      const { count: active, error: activeError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.open,is_active.eq.true');

      if (activeError) {
        console.error('Error fetching active opportunities count:', activeError);
        throw activeError;
      }

      // Get draft count
      const { count: draft, error: draftError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      if (draftError) {
        console.error('Error fetching draft opportunities count:', draftError);
        throw draftError;
      }

      // Get closed count
      const { count: closed, error: closedError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed');

      if (closedError) {
        console.error('Error fetching closed opportunities count:', closedError);
        throw closedError;
      }

      // Get cancelled count
      const { count: cancelled, error: cancelledError } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled');

      if (cancelledError) {
        console.error('Error fetching cancelled opportunities count:', cancelledError);
        throw cancelledError;
      }

      return {
        total: total || 0,
        active: active || 0,
        draft: draft || 0,
        closed: closed || 0,
        cancelled: cancelled || 0,
      };
    } catch (error) {
      console.error('Error in getOpportunitiesStats:', error);
      throw error;
    }
  }
}

export const opportunitiesService = new OpportunitiesService();

import { getCurrentSession, getCurrentUser } from '@/shared/api/authUtils';
import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('circulars-service');

export interface Circular {
  id: string;
  college_id?: string;
  title: string;
  content: string;
  audience: 'all' | 'learners' | 'faculty' | 'staff';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publish_date: string;
  expire_date?: string;
  attachment_url?: string;
  attachment_filename?: string;
  attachment_file_size?: number;
  status: 'draft' | 'published' | 'archived';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  creator_name?: string; // For joined data
}

export interface CreateCircularData {
  title: string;
  content: string;
  audience: 'all' | 'learners' | 'faculty' | 'staff';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publish_date: string;
  expire_date?: string;
  attachment_url?: string;
  attachment_filename?: string;
  attachment_file_size?: number;
  status: 'draft' | 'published' | 'archived';
  college_id?: string;
}

export interface UpdateCircularData extends Partial<CreateCircularData> {
  id: string;
}

export interface CircularsFilters {
  status?: 'all' | 'published' | 'draft' | 'archived';
  priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
}

class CircularsService {
  // Get all circulars with optional filters
  async getCirculars(filters: CircularsFilters = {}): Promise<{ data: Circular[] | null; error: any }> {
    try {
      // Get user's college ID to filter circulars
      const collegeId = await this.getUserCollegeId();
      
      let query = supabase
        .from('college_circulars')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by college ID if available
      if (collegeId) {
        query = query.eq('college_id', collegeId);
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply priority filter
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%,audience.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch circulars', error instanceof Error ? error : new Error(String(error)));
        return { data: null, error };
      }

      // Transform data to include creator name
      // Note: Since there's no foreign key relationship with users table,
      // we use a default value. In the future, this could be enhanced to
      // manually join with users table if needed.
      const transformedData = data?.map(circular => ({
        ...circular,
        creator_name: 'College Admin' // Default value
      })) || [];

      return { data: transformedData, error: null };
    } catch (error) {
      logger.error('Exception in getCirculars', error instanceof Error ? error : new Error(String(error)), {
        filters
      });
      return { data: null, error };
    }
  }

  // Get a single circular by ID
  async getCircularById(id: string): Promise<{ data: Circular | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('college_circulars')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Failed to fetch circular by ID', error instanceof Error ? error : new Error(String(error)), {
          circularId: id
        });
        return { data: null, error };
      }

      // Transform data to include default creator name
      const transformedData = {
        ...data,
        creator_name: 'College Admin' // Default value
      };

      return { data: transformedData, error: null };
    } catch (error) {
      logger.error('Exception in getCircularById', error instanceof Error ? error : new Error(String(error)), {
        circularId: id
      });
      return { data: null, error };
    }
  }

  // Get user's college ID
  private async getUserCollegeId(): Promise<string | null> {
    try {
      const { data: { user } } = getCurrentUser();
      if (!user) {
        logger.warn('No authenticated user found for college lookup');
        return null;
      }

      // First try to get organization with type 'college'
      let { data, error } = await supabase
        .from('organizations')
        .select('id, name, organization_type')
        .eq('admin_id', user.id)
        .eq('organization_type', 'college')
        .limit(1)
        .maybeSingle();

      // If no college type found, try organizations with 'college' in the name
      if (!data && !error) {
        const { data: collegeData, error: collegeError } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .eq('admin_id', user.id)
          .ilike('name', '%college%')
          .limit(1)
          .maybeSingle();
        
        data = collegeData;
        error = collegeError;
      }

      if (error) {
        logger.error('Failed to fetch college for user', error instanceof Error ? error : new Error(String(error)));
        return null;
      }

      if (!data) {
        logger.warn('No college found for user', {
          userId: user.id
        });
        return null;
      }

      return data.id;
    } catch (error) {
      logger.error('Exception getting user college ID', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  // Create a new circular
  async createCircular(circularData: CreateCircularData): Promise<{ data: Circular | null; error: any }> {
    try {
      // Get current user
      const { data: { user } } = getCurrentUser();
      
      // Get user's college ID
      const collegeId = await this.getUserCollegeId();
      
      const { data, error } = await supabase
        .from('college_circulars')
        .insert([
          {
            ...circularData,
            created_by: user?.id,
            college_id: collegeId, // Set the college ID
          }
        ])
        .select('*')
        .single();

      if (error) {
        logger.error('Failed to create circular', error instanceof Error ? error : new Error(String(error)), {
          title: circularData.title,
          audience: circularData.audience
        });
        return { data: null, error };
      }

      // Transform data to include default creator name
      const transformedData = {
        ...data,
        creator_name: 'College Admin' // Default value
      };

      return { data: transformedData, error: null };
    } catch (error) {
      logger.error('Exception in createCircular', error instanceof Error ? error : new Error(String(error)), {
        title: circularData.title
      });
      return { data: null, error };
    }
  }

  // Update an existing circular
  async updateCircular(updateData: UpdateCircularData): Promise<{ data: Circular | null; error: any }> {
    try {
      const { id, ...dataToUpdate } = updateData;
      
      const { data, error } = await supabase
        .from('college_circulars')
        .update({
          ...dataToUpdate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        logger.error('Failed to update circular', error instanceof Error ? error : new Error(String(error)), {
          circularId: id
        });
        return { data: null, error };
      }

      // Transform data to include default creator name
      const transformedData = {
        ...data,
        creator_name: 'Admin' // Default value since we don't have user relationship
      };

      return { data: transformedData, error: null };
    } catch (error) {
      logger.error('Exception in updateCircular', error instanceof Error ? error : new Error(String(error)), {
        circularId: id
      });
      return { data: null, error };
    }
  }

  // Delete a circular
  async deleteCircular(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('college_circulars')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete circular', error instanceof Error ? error : new Error(String(error)), {
          circularId: id
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      logger.error('Exception in deleteCircular', error instanceof Error ? error : new Error(String(error)), {
        circularId: id
      });
      return { error };
    }
  }

  // Toggle circular status (publish/unpublish)
  async toggleCircularStatus(id: string, currentStatus: string): Promise<{ data: Circular | null; error: any }> {
    try {
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      
      const { data, error } = await supabase
        .from('college_circulars')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        logger.error('Failed to toggle circular status', error instanceof Error ? error : new Error(String(error)), {
          circularId: id,
          newStatus
        });
        return { data: null, error };
      }

      // Transform data to include default creator name
      const transformedData = {
        ...data,
        creator_name: 'Admin' // Default value since we don't have user relationship
      };

      return { data: transformedData, error: null };
    } catch (error) {
      logger.error('Exception in toggleCircularStatus', error instanceof Error ? error : new Error(String(error)), {
        circularId: id
      });
      return { data: null, error };
    }
  }

  // Get circulars statistics
  async getCircularsStats(): Promise<{ 
    data: { 
      total: number; 
      published: number; 
      draft: number; 
      urgent_priority: number; 
    } | null; 
    error: any 
  }> {
    try {
      // Get user's college ID to filter stats
      const collegeId = await this.getUserCollegeId();
      
      let query = supabase
        .from('college_circulars')
        .select('status, priority');

      // Filter by college ID if available
      if (collegeId) {
        query = query.eq('college_id', collegeId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch circulars stats', error instanceof Error ? error : new Error(String(error)), {
          collegeId
        });
        return { data: null, error };
      }

      const stats = {
        total: data.length,
        published: data.filter(c => c.status === 'published').length,
        draft: data.filter(c => c.status === 'draft').length,
        urgent_priority: data.filter(c => c.priority === 'urgent').length,
      };

      return { data: stats, error: null };
    } catch (error) {
      logger.error('Exception in getCircularsStats', error instanceof Error ? error : new Error(String(error)));
      return { data: null, error };
    }
  }
}

export const circularsService = new CircularsService();
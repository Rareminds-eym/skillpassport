import { apiPost } from '@/shared/api/apiClient';

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
  creator_name?: string;
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
  async getCirculars(filters: CircularsFilters = {}): Promise<{ data: Circular[] | null; error: any }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'get-circulars',
        ...filters
      });

      if (!result.success) {
        return { data: null, error: result.error };
      }

      const transformedData = (result.data || []).map((circular: Circular) => ({
        ...circular,
        creator_name: 'College Admin'
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getCircularById(id: string): Promise<{ data: Circular | null; error: any }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'get-circular-by-id',
        id
      });

      if (!result.success) {
        return { data: null, error: result.error };
      }

      return {
        data: { ...result.data, creator_name: 'College Admin' },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createCircular(circularData: CreateCircularData): Promise<{ data: Circular | null; error: any }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'create-circular',
        ...circularData
      });

      if (!result.success) {
        return { data: null, error: result.error };
      }

      return {
        data: { ...result.data, creator_name: 'College Admin' },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateCircular(updateData: UpdateCircularData): Promise<{ data: Circular | null; error: any }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'update-circular',
        ...updateData
      });

      if (!result.success) {
        return { data: null, error: result.error };
      }

      return {
        data: { ...result.data, creator_name: 'Admin' },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteCircular(id: string): Promise<{ error: any }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'delete-circular',
        id
      });

      if (!result.success) {
        return { error: result.error };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async toggleCircularStatus(id: string, currentStatus: string): Promise<{ data: Circular | null; error: any }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'toggle-circular-status',
        id,
        current_status: currentStatus
      });

      if (!result.success) {
        return { data: null, error: result.error };
      }

      return {
        data: { ...result.data, creator_name: 'Admin' },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getCircularsStats(): Promise<{
    data: { total: number; published: number; draft: number; urgent_priority: number; } | null;
    error: any
  }> {
    try {
      const result = await apiPost<any>('/college-admin/college-circulars', {
        action: 'get-circulars-stats'
      });

      if (!result.success) {
        return { data: null, error: result.error };
      }

      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const circularsService = new CircularsService();

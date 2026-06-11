import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export interface Circular {
  id: string;
  title: string;
  message: string;
  audience_type: 'all' | 'department' | 'program' | 'semester' | 'batch' | 'section' | 'custom';
  audience_filter: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'archived' | 'expired';
  attachments: Array<{ name: string; url: string; size: number; type: string }>;
  publish_date?: string;
  expiry_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
  views_count: number;
  college_id?: string;
}

export interface CircularRecipient {
  id: string;
  circular_id: string;
  user_id: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface CreateCircularData {
  title: string;
  message: string;
  audience_type: Circular['audience_type'];
  audience_filter?: Record<string, any>;
  priority?: Circular['priority'];
  attachments?: Circular['attachments'];
  publish_date?: string;
  expiry_date?: string;
  college_id?: string;
}

export interface UpdateCircularData extends Partial<CreateCircularData> {
  status?: Circular['status'];
}

class CircularService {
  async createCircular(data: CreateCircularData): Promise<Circular> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'create', ...data });
    return result.data;
  }

  async updateCircular(id: string, data: UpdateCircularData): Promise<Circular> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'update', id, ...data });
    return result.data;
  }

  async publishCircular(id: string): Promise<Circular> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'publish', id });
    return result.data;
  }

  async archiveCircular(id: string): Promise<Circular> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'archive', id });
    return result.data;
  }

  async deleteCircular(id: string): Promise<void> {
    await apiPost('/college-admin/circulars', { action: 'delete', id });
  }

  async getCirculars(filters?: { status?: string; college_id?: string; search?: string }): Promise<Circular[]> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'get-all', ...filters });
    return result.data || [];
  }

  async getCircular(id: string): Promise<Circular> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'get', id });
    return result.data;
  }

  async getMyCirculars(): Promise<Circular[]> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'get-my' });
    return result.data || [];
  }

  async getUnreadCount(): Promise<number> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'get-unread-count' });
    return result.data || 0;
  }

  async markAsRead(circularId: string): Promise<void> {
    await apiPost('/college-admin/circulars', { action: 'mark-read', circular_id: circularId });
  }

  async getCircularStats(circularId: string): Promise<{ total_recipients: number; read_count: number; unread_count: number; read_percentage: number }> {
    const result: any = await apiPost('/college-admin/circulars', { action: 'get-stats', circular_id: circularId });
    return result.data;
  }

  async uploadAttachment(file: File, circularId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${circularId}/${Date.now()}.${fileExt}`;
    const base64 = await fileToBase64(file);
    const result: any = await apiPost('/college-admin/storage', {
      action: 'upload',
      bucket: 'circular-attachments',
      path: fileName,
      file_base64: base64,
      content_type: file.type || 'application/octet-stream',
    });
    return result?.data?.publicUrl;
  }

  async autoExpireCirculars(): Promise<void> {
    await apiPost('/college-admin/circulars', { action: 'auto-expire' });
  }
}

export const circularService = new CircularService();

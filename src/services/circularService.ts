import { supabase } from '@/lib/supabaseClient';

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
  /**
   * Create a new circular
   */
  async createCircular(data: CreateCircularData): Promise<Circular> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data: circular, error } = await supabase
      .from('circulars')
      .insert({
        ...data,
        created_by: user.user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return circular;
  }

  /**
   * Update a circular
   */
  async updateCircular(id: string, data: UpdateCircularData): Promise<Circular> {
    const { data: circular, error } = await supabase
      .from('circulars')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return circular;
  }

  /**
   * Publish a circular
   */
  async publishCircular(id: string): Promise<Circular> {
    const { data: circular, error } = await supabase
      .from('circulars')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        publish_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create recipients
    await this.createRecipients(id);

    return circular;
  }

  /**
   * Archive a circular
   */
  async archiveCircular(id: string): Promise<Circular> {
    const { data: circular, error } = await supabase
      .from('circulars')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return circular;
  }

  /**
   * Delete a circular
   */
  async deleteCircular(id: string): Promise<void> {
    const { error } = await supabase.from('circulars').delete().eq('id', id);
    if (error) throw error;
  }

  /**
   * Get all circulars (admin view)
   */
  async getCirculars(filters?: {
    status?: string;
    college_id?: string;
    search?: string;
  }): Promise<Circular[]> {
    let query = supabase
      .from('circulars')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.college_id) {
      query = query.eq('college_id', filters.college_id);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single circular
   */
  async getCircular(id: string): Promise<Circular> {
    const { data, error } = await supabase
      .from('circulars')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get circulars for current user
   */
  async getMyCirculars(): Promise<Circular[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('circulars')
      .select(`
        *,
        circular_recipients!inner(is_read, read_at)
      `)
      .eq('circular_recipients.user_id', user.user.id)
      .eq('status', 'published')
      .order('publish_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get unread circulars count
   */
  async getUnreadCount(): Promise<number> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { count, error } = await supabase
      .from('circular_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.user.id)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Mark circular as read
   */
  async markAsRead(circularId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase.rpc('mark_circular_read', {
      p_circular_id: circularId,
      p_user_id: user.user.id,
    });

    if (error) throw error;
  }

  /**
   * Create recipients for a circular
   */
  private async createRecipients(circularId: string): Promise<void> {
    const { error } = await supabase.rpc('create_circular_recipients', {
      p_circular_id: circularId,
    });

    if (error) throw error;
  }

  /**
   * Get circular statistics
   */
  async getCircularStats(circularId: string): Promise<{
    total_recipients: number;
    read_count: number;
    unread_count: number;
    read_percentage: number;
  }> {
    const { data: recipients, error: recipientsError } = await supabase
      .from('circular_recipients')
      .select('is_read')
      .eq('circular_id', circularId);

    if (recipientsError) throw recipientsError;

    const total = recipients?.length || 0;
    const read = recipients?.filter((r) => r.is_read).length || 0;
    const unread = total - read;
    const percentage = total > 0 ? (read / total) * 100 : 0;

    return {
      total_recipients: total,
      read_count: read,
      unread_count: unread,
      read_percentage: Math.round(percentage * 10) / 10,
    };
  }

  /**
   * Upload attachment
   */
  async uploadAttachment(file: File, circularId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${circularId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('circular-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('circular-attachments')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  /**
   * Auto-expire circulars
   */
  async autoExpireCirculars(): Promise<void> {
    const { error } = await supabase.rpc('auto_expire_circulars');
    if (error) throw error;
  }
}

export const circularService = new CircularService();

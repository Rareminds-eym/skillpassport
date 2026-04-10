import { supabase } from '@/shared/api/supabaseClient';

export const collegeEventsService = {
  async getCollegeEvents(collegeId?: string) {
    let query = supabase
      .from('college_events')
      .select('*')
      .order('start_date', { ascending: true });
    
    if (collegeId) {
      query = query.eq('college_id', collegeId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createCollegeEvent(eventData: any, collegeId: string, userId?: string) {
    const { error } = await supabase
      .from('college_events')
      .insert({
        ...eventData,
        college_id: collegeId,
        created_by: userId
      });
    
    if (error) throw error;
  },

  async updateCollegeEvent(id: string, updates: any) {
    const { error } = await supabase
      .from('college_events')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteCollegeEvent(id: string) {
    const { error } = await supabase
      .from('college_events')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async publishCollegeEvent(id: string) {
    const { error } = await supabase
      .from('college_events')
      .update({ status: 'published' })
      .eq('id', id);
    
    if (error) throw error;
  },

  async cancelCollegeEvent(id: string) {
    const { error } = await supabase
      .from('college_events')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) throw error;
  },

  async rescheduleCollegeEvent(id: string, startDate: string, endDate: string) {
    const { error } = await supabase
      .from('college_events')
      .update({
        start_date: startDate,
        end_date: endDate
      })
      .eq('id', id);
    
    if (error) throw error;
  }
};

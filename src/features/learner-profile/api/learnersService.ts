import { supabase } from '@/shared/api/supabaseClient';

export const learnersService = {
  async getLearners(limit?: number) {
    let query = supabase
      .from('learners')
      .select('id, name, email, college_school_name, grade');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

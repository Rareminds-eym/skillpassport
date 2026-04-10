import { supabase } from '@/shared/api/supabaseClient';

export const studentsService = {
  async getStudents(limit?: number) {
    let query = supabase
      .from('students')
      .select('id, name, email, college_school_name, grade');
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

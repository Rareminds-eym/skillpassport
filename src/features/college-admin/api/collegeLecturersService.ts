import { supabase } from '@/shared/api/supabaseClient';

export const collegeLecturersService = {
  async getCollegeLecturer(userId: string) {
    const { data, error } = await supabase
      .from('college_lecturers')
      .select('collegeId')
      .or(`userId.eq.${userId},user_id.eq.${userId}`)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createLecturer(lecturerData: any) {
    const { error } = await supabase
      .from('college_lecturers')
      .insert(lecturerData);
    
    if (error) throw error;
  }
};

import { supabase } from '@/shared/api/supabaseClient';

export const collegeBreaksService = {
  async createBreak(breakData: any) {
    const { error } = await supabase
      .from('college_breaks')
      .insert(breakData);
    
    if (error) throw error;
  },

  async deleteBreak(breakId: string) {
    const { error } = await supabase
      .from('college_breaks')
      .delete()
      .eq('id', breakId);
    
    if (error) throw error;
  }
};

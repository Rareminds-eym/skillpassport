import { supabase } from '@/shared/api/supabaseClient';

export const collegeFacultyLeavesService = {
  async createLeave(leaveData: any) {
    const { error } = await supabase
      .from('college_faculty_leaves')
      .insert(leaveData);
    
    if (error) throw error;
  }
};

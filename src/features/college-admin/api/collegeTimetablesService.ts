import { supabase } from '@/shared/api/supabaseClient';

export const collegeTimetablesService = {
  async publishTimetable(timetableId: string) {
    const { error } = await supabase
      .from('college_timetables')
      .update({ status: 'published' })
      .eq('id', timetableId);
    
    if (error) throw error;
  }
};

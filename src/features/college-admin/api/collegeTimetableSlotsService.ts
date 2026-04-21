import { supabase } from '@/shared/api/supabaseClient';

export const collegeTimetableSlotsService = {
  async createSlot(slotData: any) {
    const { error } = await supabase
      .from('college_timetable_slots')
      .insert(slotData);
    
    if (error) throw error;
  },

  async updateSlot(id: string, slotData: any) {
    const { error } = await supabase
      .from('college_timetable_slots')
      .update(slotData)
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteSlot(id: string) {
    const { error } = await supabase
      .from('college_timetable_slots')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

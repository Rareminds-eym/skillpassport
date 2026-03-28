import { supabase } from '@/shared/api/supabaseClient';

export interface TeacherWorkload {
  total_periods: number;
  max_consecutive: number;
  exceeds_limit: boolean;
  consecutive_violation: boolean;
}

export const timetableSlotsService = {
  async createSlot(slotData: any) {
    const { error } = await supabase
      .from('timetable_slots')
      .insert(slotData);
    
    if (error) throw error;
  },

  /**
   * Calculate teacher workload for a timetable
   * @param teacherId - The teacher's ID
   * @param timetableId - The timetable ID
   * @returns Teacher workload data
   */
  async calculateTeacherWorkload(
    teacherId: string,
    timetableId: string
  ): Promise<TeacherWorkload | null> {
    const { data, error } = await supabase.rpc('calculate_teacher_workload', {
      p_teacher_id: teacherId,
      p_timetable_id: timetableId,
    });

    if (error) {
      console.error('Error calculating teacher workload:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  }
};

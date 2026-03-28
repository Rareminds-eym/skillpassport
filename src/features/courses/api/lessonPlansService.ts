import { supabase } from '@/shared/api/supabaseClient';

export const lessonPlansService = {
  async deleteLessonPlan(id: string) {
    const { error } = await supabase
      .from('lesson_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

import { supabase } from '@/shared/api/supabaseClient';

export const mentorNotesService = {
  async deleteMentorNote(id: string) {
    const { data, error } = await supabase
      .from('mentor_notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  }
};

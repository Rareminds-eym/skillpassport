import { supabase } from '@/shared/api/supabaseClient';

export const collegeFacultySubstitutionsService = {
  async createSubstitutions(substitutionEntries: any[]) {
    const { error } = await supabase
      .from('college_faculty_substitutions')
      .insert(substitutionEntries);
    
    if (error) throw error;
  }
};

import { supabase } from '@/shared/api/supabaseClient';

export const organizationsService = {
  async getCollegeOrganization(userId: string, userEmail: string) {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('organization_type', 'college')
      .or(`admin_id.eq.${userId},email.eq.${userEmail}`)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }
};

import { supabase } from './supabaseClient';

export const fetchMaintenanceMode = async (): Promise<{ isEnabled: boolean, bypassToken: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_bypass_token']);

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[MaintenanceService] Error fetching maintenance config:', error);
      }
      return { isEnabled: false, bypassToken: null };
    }

    const modeConfig = data?.find(d => d.key === 'maintenance_mode');
    const tokenConfig = data?.find(d => d.key === 'maintenance_bypass_token');

    return { 
      isEnabled: modeConfig?.value === 'true',
      bypassToken: tokenConfig?.value || null
    };
  } catch (err) {
    console.error('[MaintenanceService] Check failed:', err);
    return { isEnabled: false, bypassToken: null };
  }
};

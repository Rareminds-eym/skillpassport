/**
 * Internal API endpoint for maintenance mode status
 * Called by sp-dash to fetch current maintenance mode state
 *
 * GET /api/internal/maintenance/status
 *
 * This endpoint returns the current maintenance mode configuration
 * from the skillpassport database.
 */

import { apiError, apiSuccess } from '../../../../lib/response';
import type { PagesEnv } from '../../../../lib/types';
import { getServiceClient } from '../../../../lib/supabase';

export const onRequestGet: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_bypass_token']);

    if (error) {
      console.error('[Maintenance Status] Failed to fetch maintenance config:', error);
      return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch maintenance status', request);
    }

    const modeConfig = data?.find(d => d.key === 'maintenance_mode');
    const tokenConfig = data?.find(d => d.key === 'maintenance_bypass_token');

    return apiSuccess({
      enabled: modeConfig?.value === 'true',
      bypassToken: tokenConfig?.value || null
    });
  } catch (error) {
    console.error('[Maintenance Status] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};

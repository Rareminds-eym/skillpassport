import type { PagesEnv } from '../../lib/types';
import { apiSuccess, apiError } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';

const log = createLogger('maintenance');

export const onRequestGet: PagesFunction<PagesEnv> = async (context) => {
  const supabase = getServiceClient(context.env);

  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('key, value')
      .in('key', ['maintenance_mode', 'maintenance_bypass_token']);

    if (error) {
      log.error('Failed to read maintenance config', error);
      return apiError(500, 'DB_ERROR', 'Failed to read maintenance config', context.request);
    }

    const modeConfig = data?.find(d => d.key === 'maintenance_mode');
    const tokenConfig = data?.find(d => d.key === 'maintenance_bypass_token');

    const res = apiSuccess({
      enabled: modeConfig?.value === 'true',
      bypassToken: tokenConfig?.value || null,
    }, context.request, { status: 200 });
    const headers = new Headers(res.headers);
    headers.set('Cache-Control', 'public, max-age=30');
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    log.error('Unexpected error in maintenance GET', error as Error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal error', context.request);
  }
};

/**
 * Internal API endpoint for maintenance mode updates
 * Called by sp-dash maintenance-worker to update the skillpassport database
 *
 * POST /api/internal/maintenance/update
 *
 * This endpoint is called by the sp-dash maintenance-worker via HTTP
 * to update maintenance mode configuration in the database and send
 * queue announcements for realtime WebSocket updates.
 */

import { notifyBroadcast } from '../../../../lib/realtime';
import { apiError, apiSuccess } from '../../../../lib/response';
import { getServiceClient } from '../../../../lib/supabase';
import type { PagesEnv } from '../../../../lib/types';

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  try {
    // Verify the request is from the maintenance-worker
    const authHeader = request.headers.get('Authorization');
    const internalSecret = env.INTERNAL_WEBHOOK_SECRET;

    if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
      return apiError(401, 'UNAUTHORIZED', 'Invalid or missing internal webhook secret', request);
    }

    const body = await request.json() as { action: string; data: Record<string, unknown> };
    const { action, data } = body;

    const supabase = getServiceClient(env);

    if (action === 'toggle') {
      const enabled = data.enabled === true;
      const { error } = await supabase
        .from('app_config')
        .upsert({
          key: 'maintenance_mode',
          value: enabled ? 'true' : 'false'
        }, { onConflict: 'key' });

      if (error) {
        console.error('[Maintenance Update] Failed to update maintenance_mode:', error);
        return apiError(500, 'INTERNAL_ERROR', 'Failed to update maintenance mode', request);
      }

      // Send queue announcement for realtime WebSocket updates
      await notifyBroadcast(env, 'maintenance-config-updates', 'update', { key: 'maintenance_mode', value: enabled ? 'true' : 'false' }, 'skillpassport');

      return apiSuccess({ success: true, message: 'Maintenance mode updated' });
    } else if (action === 'bypass_token') {
      const tokenAction = data.action as string;
      const token = data.token as string | null;

      if (tokenAction === 'generate' && token) {
        const { error } = await supabase
          .from('app_config')
          .upsert({
            key: 'maintenance_bypass_token',
            value: token
          }, { onConflict: 'key' });

        if (error) {
          console.error('[Maintenance Update] Failed to update maintenance_bypass_token:', error);
          return apiError(500, 'INTERNAL_ERROR', 'Failed to update bypass token', request);
        }
      } else if (tokenAction === 'revoke') {
        const { error } = await supabase
          .from('app_config')
          .delete()
          .eq('key', 'maintenance_bypass_token');

        if (error) {
          console.error('[Maintenance Update] Failed to revoke maintenance_bypass_token:', error);
          return apiError(500, 'INTERNAL_ERROR', 'Failed to revoke bypass token', request);
        }
      }

      // Send queue announcement for realtime WebSocket updates
      await notifyBroadcast(env, 'maintenance-config-updates', 'update', { key: 'maintenance_bypass_token', value: token }, 'skillpassport');

      return apiSuccess({ success: true, message: 'Bypass token updated' });
    } else {
      return apiError(400, 'INVALID_ACTION', 'Invalid maintenance action', request);
    }
  } catch (error) {
    console.error('[Maintenance Update] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Internal server error', request);
  }
};

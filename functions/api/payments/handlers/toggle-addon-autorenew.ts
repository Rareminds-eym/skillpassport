/**
 * Toggle Addon Auto Renew Handler — Industrial Grade
 *
 * POST /api/payments/toggle-addon-autorenew
 */

import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../../lib/response';
import { ToggleAutoRenewSchema, validateBody } from '../../../lib/validation';

export async function handleToggleAddonAutoRenew(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    let body: unknown;
    try { body = await context.request.json(); } catch {
      return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON', context.request, { startTime });
    }

    const validation = validateBody(ToggleAutoRenewSchema, body, context.request);
    if (!validation.success) return validation.response;

    const { entitlementId, autoRenew } = validation.data;
    const supabase = getServiceClient(env);
    const user = getContextUser(context);
    const userId = user.id;

    const { data, error } = await supabase
      .from('user_entitlements')
      .update({ auto_renew: autoRenew, updated_at: new Date().toISOString() })
      .eq('id', entitlementId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return apiError(404, 'ENTITLEMENT_NOT_FOUND', 'Entitlement not found or not owned by you', context.request, { startTime });
      }
      return apiDbError(error, context.request, { startTime });
    }

    return apiSuccess(data, context.request, { startTime });
  } catch (error) {
    console.error('[ToggleAutoRenew] Unhandled error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}

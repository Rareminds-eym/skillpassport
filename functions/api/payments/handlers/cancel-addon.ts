/**
 * Cancel Addon Handler — Industrial Grade
 *
 * POST /api/payments/cancel-addon
 *
 * - Zod input validation
 * - Proper HTTP status codes (400/404/500)
 * - Safe error mapping (no DB internals leaked)
 * - CORS + Request ID headers
 * - Ownership check via JWT user_id
 */

import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../../lib/response';
import { CancelAddonSchema, validateBody } from '../../../lib/validation';

export async function handleCancelAddon(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // --- Input validation ---
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON', context.request, { startTime });
    }

    const validation = validateBody(CancelAddonSchema, body, context.request);
    if (!validation.success) return validation.response;

    const { entitlementId } = validation.data;
    const supabase = getServiceClient(env);
    const user = getContextUser(context);
    const userId = user.id;

    const { data, error } = await supabase
      .from('user_entitlements')
      .update({
        status: 'cancelled',
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', entitlementId)
      .eq('user_id', userId)  // Ownership check
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
    console.error('[CancelAddon] Unhandled error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}

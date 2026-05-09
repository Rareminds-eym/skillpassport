/**
 * Get User Entitlements Handler — Industrial Grade
 *
 * GET /api/payments/get-user-entitlements
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiDbError, apiError } from '../../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetUserEntitlements(context);
});

export async function handleGetUserEntitlements(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);

    const { data, error } = await supabase
      .from('user_entitlements')
      .select('*')
      .eq('user_id', context.data.user.sub)
      .order('created_at', { ascending: false });

    if (error) return apiDbError(error, context.request, { startTime });

    return apiSuccess(data || [], context.request, { startTime });
  } catch (error) {
    console.error('[GetUserEntitlements] Unhandled error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}

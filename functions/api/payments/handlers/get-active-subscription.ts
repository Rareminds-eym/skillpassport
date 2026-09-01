/**
 * Get Active Subscription Handler
 *
 * GET /api/payments/get-active-subscription
 *
 * Queries subscription_cache (shadow table) for the user's active subscription.
 * Also checks license_assignments for org license holders.
 * Falls back to auth DB via SSO worker if cache is stale.
 *
 * Requires SSO authentication.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';
import { resolveUserEntitlement } from '../../../shared/lib/org-subscription';

export async function handleGetActiveSubscription(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const user = getContextUser(context);
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);
    const userId = user.id;

    // Use canonical entitlement resolution engine (5-step waterfall)
    const entitlement = await resolveUserEntitlement(supabase, userId);
    return apiSuccess(entitlement, context.request, { startTime });
  } catch (error) {
    console.error('[GetActiveSubscription] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}


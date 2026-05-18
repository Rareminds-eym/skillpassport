/**
 * Create Freemium Subscription Handler
 *
 * POST /api/payments/create-freemium-subscription
 *
 * Creates a Freemium (pay_as_you_go) subscription without payment processing.
 * Writes to auth DB via SSO worker, then syncs shadow table in app DB.
 *
 * Requires SSO authentication.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError, apiValidationError } from '../../../lib/response';
import { validateCreateFreemiumRequest } from '../../../shared/lib/validation';
import { ssoCreateFreemiumSubscription, ssoSyncSubscription } from '../../../lib/sso-client';
import { syncSubscriptionCache } from '../../../lib/sync-shadow';

interface CreateFreemiumRequest {
  userId: string;
  email: string;
}

function extractAuthToken(request: Request): string {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No auth token found');
  }
  return authHeader.slice(7);
}

export async function handleCreateFreemiumSubscription(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string; SSO_SERVICE: Fetcher };

  try {
    let body: CreateFreemiumRequest;
    try {
      body = await context.request.json();
    } catch {
      return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON', context.request, { startTime });
    }

    const validation = validateCreateFreemiumRequest(body);
    if (!validation.valid) {
      return apiValidationError(validation.issues!, context.request);
    }

    if (body.userId !== user.sub) {
      return apiError(403, 'FORBIDDEN', 'Cannot create subscription for another user', context.request, { startTime });
    }

    const supabase = getServiceClient(env);
    const authToken = extractAuthToken(context.request);

    // Ensure user exists in shadow table (for FK constraints in app DB)
    const { data: existingShadowUser } = await supabase
      .from('users_shadow')
      .select('id')
      .eq('id', body.userId)
      .maybeSingle();

    if (!existingShadowUser) {
      const { error: shadowUserError } = await supabase
        .from('users_shadow')
        .insert({ id: body.userId, email: body.email });

      if (shadowUserError) {
        console.error('[CreateFreemiumSubscription] Error creating shadow user:', shadowUserError);
        return apiDbError(shadowUserError, context.request, { startTime });
      }
    }

    // Create subscription in auth DB via SSO worker
    let subscription: Record<string, unknown>;
    try {
      subscription = await ssoCreateFreemiumSubscription(env, authToken, {
        user_id: body.userId,
        email: body.email,
        full_name: (user as any).name || 'Freemium User',
      });
    } catch (ssoError: any) {
      if (ssoError.message?.includes('23505') || ssoError.message?.includes('duplicate')) {
        return apiError(409, 'SUBSCRIPTION_EXISTS', 'User already has an active subscription', context.request, { startTime });
      }
      console.error('[CreateFreemiumSubscription] SSO error:', ssoError);
      return apiError(500, 'SSO_ERROR', 'Failed to create subscription in auth service', context.request, { startTime });
    }

    // Sync shadow table in app DB (non-blocking on failure)
    try {
      const syncData = await ssoSyncSubscription(env, authToken, body.userId);
      if (syncData.subscription) {
        await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
      }
    } catch (syncError) {
      console.error('[CreateFreemiumSubscription] Shadow sync failed (non-critical):', syncError);
    }

    return apiSuccess(
      {
        id: subscription.id,
        userId: subscription.user_id,
        planId: subscription.plan_id,
        planCode: subscription.plan_code || 'pay_as_you_go',
        planName: 'Freemium',
        status: subscription.status,
        startDate: subscription.subscription_start_date,
        endDate: subscription.subscription_end_date,
        autoRenew: subscription.auto_renew,
        createdAt: subscription.created_at,
      },
      context.request,
      { startTime }
    );
  } catch (error) {
    console.error('[CreateFreemiumSubscription] Unexpected error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}


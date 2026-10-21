import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';
import { getServiceClient } from '../../../lib/supabase';
import { isHealEnabled } from '../../../lib/healConfig';
import { withResilience } from '../../../lib/resilience';
import { ssoSyncSubscription, type SsoEnv } from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import { resolveUserEntitlement, subscriptionScope } from '../../../shared/lib/org-subscription';

/** Existing subscription gateway: validate every source with the same catalogue policy. */
export async function handleGetActiveSubscription(context: AuthenticatedContext): Promise<Response> {
  const user = getContextUser(context);
  try {
    const scope = subscriptionScope(user, new URL(context.request.url).searchParams.get('scope'));
    const identity = { roles: user.roles, org_id: user.org_id, scope };
    const supabase = getServiceClient(context.env as Parameters<typeof getServiceClient>[0]);
    let subscription = await resolveUserEntitlement(supabase, user.id, identity);
    if (!subscription && await isHealEnabled(context.env as Record<string, unknown>, 'subscription-cache-heal')) {
      const synced = await withResilience('heal:syncSubscription',
        () => ssoSyncSubscription(context.env as unknown as SsoEnv, user.id),
        { env: context.env as Record<string, unknown> });
      if (synced.subscription) {
        await syncUserShadow(supabase, user.id, user.email);
        await syncSubscriptionCache(supabase, synced.subscription, synced.plan);
        // Never return an unvalidated RPC payload or manufacture access on sync failure.
        subscription = await resolveUserEntitlement(supabase, user.id, identity);
      }
    }
    return apiSuccess(subscription, context.request);
  } catch (error) {
    if (error instanceof Error && error.message === 'SUBSCRIPTION_SCOPE_FORBIDDEN') {
      return apiError(403, 'FORBIDDEN', 'The requested dashboard is not available for your role.', context.request);
    }
    console.error('[subscription-gateway] Verification failed:', error);
    return apiError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify your subscription. Please retry.', context.request);
  }
}

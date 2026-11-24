import { SKILLPASSPORT_PRODUCT_ID } from '../../../lib/subscription-config';
import type { SeatRequestContext } from '../../../lib/seat-access';
import { getContextUser } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';
import { getAuthToken, getServiceClient } from '../../../lib/supabase';
import { isHealEnabled } from '../../../lib/healConfig';
import { withResilience } from '../../../lib/resilience';
import { ssoSyncSubscription, type SsoEnv } from '../../../lib/sso-client';
import { syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import { resolveUserEntitlement, subscriptionScope, type EntitlementResult } from '../../../shared/lib/org-subscription';
import { currentSubscriptionSchema } from '../../../lib/subscriptions/current-subscription';
import type { PagesEnv } from '../../../lib/types';
import { z } from 'zod';

const ownerDenial = z.object({ kind: z.literal('forbidden') }).strict();
class SubscriptionReadDenied extends Error {}

/** Existing subscription gateway: validate every source with the same catalogue policy. */
export async function handleGetActiveSubscription(context: SeatRequestContext): Promise<Response> {
  const user = getContextUser(context);
  try {
    const scope = subscriptionScope(user, new URL(context.request.url).searchParams.get('scope'));
    const identity = { roles: user.roles, org_id: user.org_id, scope };
    const supabase = getServiceClient(context.env as Parameters<typeof getServiceClient>[0]);
    const authorizeRead = async (candidate: EntitlementResult): Promise<EntitlementResult | null> => {
      // Historical, uninitialized contracts keep their existing date policy.
      // An initialized contract must never use cached status when its owner fails.
      if (!candidate.plan_revision_id) {
        if (candidate.lifecycle_state != null) throw new Error('Incomplete lifecycle binding');
        return candidate;
      }
      const env = context.env as unknown as PagesEnv;
      const token = getAuthToken(context.request);
      if (!token || !env.SSO_SERVICE) throw new Error('Lifecycle owner unavailable');
      const raw = await env.SSO_SERVICE.getCurrentSubscriptionExecution(token, candidate.id, SKILLPASSPORT_PRODUCT_ID);
      if (ownerDenial.safeParse(raw).success) throw new SubscriptionReadDenied();
      const current = currentSubscriptionSchema.parse(raw);
      if (current.actorId !== user.id || current.state.id !== candidate.id || current.state.productId !== SKILLPASSPORT_PRODUCT_ID
        || current.state.productId !== candidate.product_id || current.state.planId !== candidate.plan_id
        || current.state.revisionId !== candidate.plan_revision_id || candidate.is_organization_subscription === true
        || current.state.subject.kind !== 'user' || current.state.subject.id !== user.id) throw new Error('Lifecycle owner scope differs');
      if (current.access === 'suspended') return null;
      return { ...candidate, status: current.state.status, lifecycle_state: current.state, lifecycle_access: current.access,
        auto_renew: current.state.renewalEnabled, cancelled_at: current.state.cancelledAt === null ? null : new Date(current.state.cancelledAt).toISOString(),
        subscription_start_date: new Date(current.state.periodStartsAt).toISOString(),
        subscription_end_date: current.state.periodEndsAt === null ? null : new Date(current.state.periodEndsAt).toISOString() };
    };
    const readPolicy = { authorizeRead };
    let subscription = await resolveUserEntitlement(supabase, user.id, identity, readPolicy);
    if (!subscription && await isHealEnabled(context.env as Record<string, unknown>, 'subscription-cache-heal')) {
      const synced = await withResilience('heal:syncSubscription',
        () => ssoSyncSubscription(context.env as unknown as SsoEnv, user.id),
        { env: context.env as Record<string, unknown> });
      if (synced.subscription) {
        await syncUserShadow(supabase, user.id, user.email);
        await syncSubscriptionCache(supabase, synced.subscription, synced.plan);
        // Never return an unvalidated RPC payload or manufacture access on sync failure.
        subscription = await resolveUserEntitlement(supabase, user.id, identity, readPolicy);
      }
    }
    const response = apiSuccess(subscription, context.request);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    if (error instanceof SubscriptionReadDenied) {
      return apiError(403, 'SUBSCRIPTION_FORBIDDEN', 'Your account is not authorized to read this subscription.', context.request);
    }
    if (error instanceof Error && error.message === 'SUBSCRIPTION_SCOPE_FORBIDDEN') {
      return apiError(403, 'FORBIDDEN', 'The requested dashboard is not available for your role.', context.request);
    }
    console.error('[subscription-gateway] Verification failed:', error);
    return apiError(503, 'SUBSCRIPTION_UNAVAILABLE', 'Unable to verify your subscription. Please retry.', context.request);
  }
}

import { SKILLPASSPORT_PRODUCT_ID } from '../../../lib/subscription-config';
import type { SeatRequestContext } from '../../../lib/seat-access';
import { getContextUser } from '../../../lib/auth';
import { apiSuccess, apiError } from '../../../lib/response';
import { getAuthToken, getServiceClient } from '../../../lib/supabase';
import { isHealEnabled } from '../../../lib/healConfig';
import { withResilience } from '../../../lib/resilience';
import { ssoSyncSubscription, type SsoEnv } from '../../../lib/sso-client';
import { syncPlanCache, syncSubscriptionCache, syncUserShadow } from '../../../lib/sync-shadow';
import { ensureAppUserAndLearner } from '../../../lib/heal-user';
import { ApplicationProfilePending, resolveUserEntitlement, subscriptionScope, type EntitlementResult } from '../../../shared/lib/org-subscription';
import { readCurrentSubscriptionOwner } from '../../../lib/subscriptions/current-subscription';
import type { PagesEnv } from '../../../lib/types';
import { SubscriptionReadDenied } from '../../../lib/subscriptions/read-cache';

/** Existing subscription gateway: validate every source with the same catalogue policy. */
export async function handleGetActiveSubscription(context: SeatRequestContext): Promise<Response> {
  const user = getContextUser(context);
  try {
    const scope = subscriptionScope(user, new URL(context.request.url).searchParams.get('scope'));
    const identity = { roles: user.roles, org_id: user.org_id, scope };
    const supabase = getServiceClient(context.env as Parameters<typeof getServiceClient>[0]);
    const authorizeRead = async (candidate: EntitlementResult): Promise<EntitlementResult | null> => {
      // Historical, uninitialized contracts keep their existing date policy.
      // Initialized contracts use the validated read-through snapshot, invalidated by synchronization and writes.
      if (!candidate.plan_revision_id) {
        if (candidate.lifecycle_state != null) throw new Error('Incomplete lifecycle binding');
        return candidate;
      }
      const env = context.env as unknown as PagesEnv;
      const token = getAuthToken(context.request);
      if (!token || !env.SSO_SERVICE) throw new Error('Lifecycle owner unavailable');
      const current = await readCurrentSubscriptionOwner(supabase, { env, token, request: context.request,
        actorId: user.id, organizationId: user.org_id ?? null, roles: user.roles, productId: SKILLPASSPORT_PRODUCT_ID }, candidate.id);
      // The shared reader already binds actor, subscription, product and subject identity.
      // This boundary additionally binds the local entitlement candidate and its personal scope.
      if (current.state.productId !== candidate.product_id || current.state.planId !== candidate.plan_id
        || current.state.revisionId !== candidate.plan_revision_id || candidate.is_organization_subscription === true
        || current.state.subject.kind !== 'user') throw new Error('Lifecycle owner scope differs');
      if (current.access === 'suspended') return null;
      return { ...candidate, status: current.state.status, lifecycle_state: current.state, lifecycle_access: current.access,
        auto_renew: current.state.renewalEnabled, cancelled_at: current.state.cancelledAt === null ? null : new Date(current.state.cancelledAt).toISOString(),
        subscription_start_date: new Date(current.state.periodStartsAt).toISOString(),
        subscription_end_date: current.state.periodEndsAt === null ? null : new Date(current.state.periodEndsAt).toISOString() };
    };
    const readPolicy = { authorizeRead };
    let subscription: EntitlementResult | null;
    try {
      subscription = await resolveUserEntitlement(supabase, user.id, identity, readPolicy);
    } catch (error) {
      // OAuth projection events and the background auth heal may still be in flight.
      // Wait for identity recovery before evaluating access, then apply the same policy.
      if (!(error instanceof ApplicationProfilePending)
        || !await isHealEnabled(context.env as Record<string, unknown>, 'heal-user')) throw error;
      await ensureAppUserAndLearner(supabase, context.env, { sub: user.id, email: user.email });
      subscription = await resolveUserEntitlement(supabase, user.id, identity, readPolicy);
    }
    if (!subscription && await isHealEnabled(context.env as Record<string, unknown>, 'subscription-cache-heal')) {
      const synced = await withResilience('heal:syncSubscription',
        () => ssoSyncSubscription(context.env as unknown as SsoEnv, user.id),
        { env: context.env as Record<string, unknown> });
      if (synced.subscription) {
        await syncUserShadow(supabase, user.id, user.email);
        if (synced.plan) await syncPlanCache(supabase, synced.plan);
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

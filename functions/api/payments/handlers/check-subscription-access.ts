/**
 * Check Subscription Access Handler
 *
 * GET /api/payments/check-subscription-access
 *
 * Queries Supabase directly to determine if the user has active subscription access.
 * Implements a 7-day grace period after expiry.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleCheckSubscriptionAccess(context);
});

export async function handleCheckSubscriptionAccess(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);

    // Query user's active or paused subscription
    const { data: subscription, error } = await supabase
      .from('subscription_cache')
      .select('*')
      .eq('user_id', user.sub)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[CheckSubscriptionAccess] Supabase error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          hasAccess: false,
          accessReason: 'error',
          subscription: null,
          showWarning: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // No subscription found
    if (!subscription) {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: false,
          accessReason: 'no_subscription',
          subscription: null,
          showWarning: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const endDate = subscription.subscription_end_date
      ? new Date(subscription.subscription_end_date)
      : null;

    // No end date set — treat as active
    if (!endDate) {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: true,
          accessReason: 'active_subscription',
          subscription,
          showWarning: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / msPerDay);

    // Subscription is still valid
    if (endDate > now) {
      // Warn if expiring within 7 days
      if (daysUntilExpiry <= 7) {
        return new Response(
          JSON.stringify({
            success: true,
            hasAccess: true,
            accessReason: 'active_subscription',
            subscription,
            showWarning: true,
            warningType: 'expiring_soon',
            warningMessage: `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Please renew to maintain access.`,
            daysUntilExpiry,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: true,
          accessReason: 'active_subscription',
          subscription,
          showWarning: false,
          daysUntilExpiry,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Subscription has expired — check grace period (7 days)
    const daysSinceExpiry = Math.ceil((now.getTime() - endDate.getTime()) / msPerDay);
    const gracePeriodDays = 7;

    if (daysSinceExpiry <= gracePeriodDays) {
      return new Response(
        JSON.stringify({
          success: true,
          hasAccess: true,
          accessReason: 'grace_period',
          subscription,
          showWarning: true,
          warningType: 'grace_period',
          warningMessage: `Your subscription expired ${daysSinceExpiry} day${daysSinceExpiry === 1 ? '' : 's'} ago. You have ${gracePeriodDays - daysSinceExpiry} day${(gracePeriodDays - daysSinceExpiry) === 1 ? '' : 's'} of grace period remaining. Please renew to maintain access.`,
          daysUntilExpiry: -(daysSinceExpiry),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Expired beyond grace period
    return new Response(
      JSON.stringify({
        success: true,
        hasAccess: false,
        accessReason: 'expired',
        subscription,
        showWarning: false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[CheckSubscriptionAccess] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        hasAccess: false,
        accessReason: 'error',
        subscription: null,
        showWarning: false,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

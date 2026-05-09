/**
 * Get Active Subscription Handler
 *
 * GET /api/payments/get-active-subscription
 *
 * Full replacement for the frontend's getActiveSubscription() function.
 * Queries subscriptions AND license_assignments server-side using the
 * service_role key, bypassing RLS restrictions that block the anonymous
 * frontend client.
 *
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError } from '../../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleGetActiveSubscription(context);
});

export async function handleGetActiveSubscription(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    const supabase = getServiceClient(env);
    const userId = user.sub;
    const now = new Date().toISOString();

    // =========================================================================
    // STEP 1: Check for organization license assignment FIRST
    // =========================================================================
    const { data: licenseAssignment, error: licenseError } = await supabase
      .from('license_assignments')
      .select(`
        id,
        status,
        expires_at,
        assigned_at,
        organization_subscription_id,
        organization_subscriptions!inner (
          id,
          status,
          start_date,
          end_date,
          organization_id,
          organization_type,
          subscription_plan_id,
          subscription_plans (
            id,
            name,
            plan_code
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!licenseError && licenseAssignment) {
      const orgSub = (licenseAssignment as any).organization_subscriptions;

      if (orgSub && orgSub.status === 'active') {
        const orgEndDate = new Date(orgSub.end_date);

        if (orgEndDate > new Date()) {
          const licenseExpiry = licenseAssignment.expires_at ? new Date(licenseAssignment.expires_at) : null;
          const effectiveEndDate = licenseExpiry && licenseExpiry < orgEndDate ? licenseExpiry : orgEndDate;

          if (effectiveEndDate > new Date()) {
            const orgSubscriptionData = {
              id: orgSub.id,
              user_id: userId,
              plan_id: orgSub.subscription_plan_id,
              plan_type: orgSub.subscription_plans?.name || 'Organization Plan',
              plan_code: orgSub.subscription_plans?.plan_code,
              status: 'active',
              subscription_start_date: orgSub.start_date,
              subscription_end_date: effectiveEndDate.toISOString(),
              auto_renew: false,
              is_organization_license: true,
              organization_id: orgSub.organization_id,
              organization_type: orgSub.organization_type,
              license_assignment_id: licenseAssignment.id,
              subscription_plans: orgSub.subscription_plans,
            };

            return apiSuccess(orgSubscriptionData, context.request, { startTime });
          }
        }
      }
    }

    // =========================================================================
    // STEP 1.5: Check for revoked license assignments
    // =========================================================================
    const { data: revokedLicense } = await supabase
      .from('license_assignments')
      .select(`
        id,
        status,
        revoked_at,
        organization_subscriptions (
          subscription_plans (
            name,
            plan_code
          )
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'revoked')
      .order('revoked_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // =========================================================================
    // STEP 2: Check for individual subscription
    // =========================================================================
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans (
          id,
          name,
          plan_code
        )
      `)
      .eq('user_id', userId)
      .in('status', ['active', 'paused', 'cancelled'])
      .gte('subscription_end_date', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return apiDbError(error, context.request, { startTime });
    }

    if (!data) {
      // If user had a revoked org license, show as expired
      if (revokedLicense) {
        const revokedOrgSub = (revokedLicense as any).organization_subscriptions;
        return apiSuccess({
          id: revokedLicense.id,
          user_id: userId,
          status: 'expired',
          plan_type: revokedOrgSub?.subscription_plans?.name || 'Organization License',
          plan_code: revokedOrgSub?.subscription_plans?.plan_code,
          is_organization_license: true,
          was_revoked: true,
          revoked_at: revokedLicense.revoked_at,
        }, context.request, { startTime });
      }

      // Get most recent subscription for display purposes
      const { data: recentSub } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            plan_code
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return apiSuccess(recentSub || null, context.request, { startTime });
    }

    return apiSuccess(data, context.request, { startTime });
  } catch (error) {
    console.error('[GetActiveSubscription] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}

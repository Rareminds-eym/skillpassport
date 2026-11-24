import { getContextUser } from '../../../lib/auth';
import { authorizeSeatOrganization, type SeatRequestContext as AuthenticatedContext } from '../../../lib/seat-access';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleOrganizationQueries(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);
  const userId = user.id;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const orgId = url.searchParams.get('orgId');

  try {
    const supabase = getServiceClient(env);

    // Guard: Require authorization for any org-scoped action
    if (orgId && (action === 'getOrganizationSubscription' || action === 'getOrganizationMembers')) {
      const denied = await authorizeSeatOrganization(supabase, user.id, orgId, context.request, true);
      if (denied) return denied;
    }

    if (action === 'getOrganizationSubscription' && orgId) {
      const { data, error } = await supabase
        .from('subscription_cache')
        .select('*')
        .eq('organization_id', orgId)
        .in('status', ['active', 'grace_period'])
        .maybeSingle();

      if (error) throw error;

      // Shape response to include subscription_plans for backward compat
      const shaped = data ? {
        ...data,
        subscription_plans: {
          id: data.plan_id,
          name: data.plan_name || data.plan_type,
          plan_code: data.plan_code,
          base_features: data.features,
        },
      } : null;

      return apiSuccess(shaped, context.request);
    }

    if (action === 'getOrganizationMembers' && orgId) {
      const { data: subscriptions, error: subscriptionError } = await supabase.from('subscription_cache').select('id').eq('organization_id', orgId);
      if (subscriptionError) throw subscriptionError;
      if (!subscriptions?.length) return apiSuccess([], context.request);
      const { data, error } = await supabase.from('license_assignments')
        .select('*, users_shadow:users (id, email)').in('organization_subscription_id', subscriptions.map(sub => sub.id))
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return apiSuccess(data || [], context.request);
    }

    if (action === 'getUserLicenseAssignment') {
      const { data, error } = await supabase
        .from('license_assignments')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      // Look up subscription details from cache
      let shaped = data;
      if (data?.organization_subscription_id) {
        const { data: subCache } = await supabase
          .from('subscription_cache')
          .select('id, status, subscription_start_date, subscription_end_date, plan_code, plan_name')
          .eq('id', data.organization_subscription_id)
          .maybeSingle();

        if (subCache) {
          shaped = {
            ...data,
            subscription_cache: {
              id: subCache.id,
              status: subCache.status,
              start_date: subCache.subscription_start_date,
              end_date: subCache.subscription_end_date,
              subscription_plans: {
                name: subCache.plan_name,
                plan_code: subCache.plan_code,
              },
            },
          };
        }
      }

      return apiSuccess(shaped, context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action', context.request);
  } catch (error) {
    console.error('[OrganizationQueries] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}

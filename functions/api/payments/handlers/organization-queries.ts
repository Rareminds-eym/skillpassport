import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export async function handleOrganizationQueries(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);
  const userId = user.id;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const orgId = url.searchParams.get('orgId');

  try {
    const supabase = getServiceClient(env);

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

      return new Response(JSON.stringify({ success: true, data: shaped, error: null }), { status: 200 });
    }

    if (action === 'getOrganizationMembers' && orgId) {
      const { data, error } = await supabase
        .from('license_assignments')
        .select(`*, users_shadow (id, email)`)
        .eq('organization_id', orgId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: data || [], error: null }), { status: 200 });
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
      if (data?.subscription_id) {
        const { data: subCache } = await supabase
          .from('subscription_cache')
          .select('id, status, subscription_start_date, subscription_end_date, plan_code, plan_name')
          .eq('id', data.subscription_id)
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

      return new Response(JSON.stringify({ success: true, data: shaped, error: null }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400 });
  } catch (error) {
    console.error('[OrganizationQueries] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200 }
    );
  }
}

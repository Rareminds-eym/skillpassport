import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleOrganizationQueries(context);
});

export async function handleOrganizationQueries(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const orgId = url.searchParams.get('orgId');

  try {
    const supabase = getServiceClient(env);

    if (action === 'getOrganizationSubscription' && orgId) {
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(`*, subscription_plans (id, name, plan_code, features)`)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, error: null }), { status: 200 });
    }

    if (action === 'getOrganizationMembers' && orgId) {
      const { data, error } = await supabase
        .from('license_assignments')
        .select(`*, users (id, email, full_name)`)
        .eq('organization_id', orgId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: data || [], error: null }), { status: 200 });
    }

    if (action === 'getUserLicenseAssignment') {
      const { data, error } = await supabase
        .from('license_assignments')
        .select(`*, organization_subscriptions (id, status, start_date, end_date, subscription_plans (name, plan_code))`)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, error: null }), { status: 200 });
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

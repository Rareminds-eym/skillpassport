
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleLicensePoolQueries(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const poolId = url.searchParams.get('poolId');
  const orgId = url.searchParams.get('orgId');

  try {
    const supabase = getServiceClient(env);
    const user = getContextUser(context);

    // Helper for auth
    const authorizeOrg = async (checkOrgId: string) => {
      const { data: membership } = await supabase
        .from('license_assignments')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', checkOrgId)
        .limit(1)
        .maybeSingle();
      return !!membership;
    };

    if (action === 'getLicensePools' && orgId) {
      if (!(await authorizeOrg(orgId))) return apiError(403, 'FORBIDDEN', 'Not authorized for this organization', context.request);
      const { data, error } = await supabase
        .from('license_pools')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return apiSuccess(data || [], context.request);
    }

    if (action === 'getLicensePoolById' && poolId) {
      const { data: poolAuth } = await supabase.from('license_pools').select('organization_id').eq('id', poolId).single();
      if (!poolAuth || !(await authorizeOrg(poolAuth.organization_id))) return apiError(403, 'FORBIDDEN', 'Not authorized', context.request);
      const { data, error } = await supabase
        .from('license_pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (error) throw error;
      return apiSuccess(data, context.request);
    }

    if (action === 'getPoolAssignments' && poolId) {
      const { data: poolAuth } = await supabase.from('license_pools').select('organization_id').eq('id', poolId).single();
      if (!poolAuth || !(await authorizeOrg(poolAuth.organization_id))) return apiError(403, 'FORBIDDEN', 'Not authorized', context.request);
      const { data, error } = await supabase
        .from('license_assignments')
        .select(`*, users (id, email, full_name)`)
        .eq('license_pool_id', poolId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return apiSuccess(data || [], context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action or missing params', context.request);
  } catch (error) {
    console.error('[LicensePoolQueries] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}

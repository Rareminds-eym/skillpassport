import { getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { authorizeSeatOrganization, type SeatRequestContext } from '../../../lib/seat-access';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleLicensePoolQueries(context: SeatRequestContext): Promise<Response> {
  const supabase = getServiceClient(context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string });
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const poolId = url.searchParams.get('poolId');
  let orgId = url.searchParams.get('orgId');
  try {
    if (!['getLicensePools', 'getLicensePoolById', 'getPoolAssignments'].includes(action ?? '')) {
      return apiError(400, 'VALIDATION_ERROR', 'Invalid seat query action', context.request);
    }
    let pool;
    if (action !== 'getLicensePools') {
      if (!poolId) return apiError(400, 'VALIDATION_ERROR', 'poolId is required', context.request);
      const result = await supabase.from('license_pools').select('*').eq('id', poolId).maybeSingle();
      if (result.error) throw result.error;
      if (!result.data) return apiError(404, 'NOT_FOUND', 'License pool not found', context.request);
      pool = result.data;
      orgId = pool.organization_id;
    }
    const denied = await authorizeSeatOrganization(supabase, getContextUser(context).id, orgId ?? '', context.request);
    if (denied) return denied;
    if (action === 'getLicensePoolById') return apiSuccess(pool, context.request);
    const result = action === 'getLicensePools'
      ? await supabase.from('license_pools').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
      : await supabase.from('license_assignments').select('*').eq('license_pool_id', poolId).order('assigned_at', { ascending: false });
    if (result.error) throw result.error;
    return apiSuccess(result.data, context.request);
  } catch (error) {
    console.error('[LicensePoolQueries] Failed seat query', error);
    return apiError(500, 'INTERNAL_ERROR', 'Unable to read license pools', context.request);
  }
}

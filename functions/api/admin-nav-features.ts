/** Nav catalog and grants resolved using the same organization policy as API requests. */
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth, getContextUser } from '../lib/auth';
import { getHybridOrganizationAccess, type AdminOrganizationType } from '../lib/hybrid-features';
import { apiError, apiSuccess } from '../lib/response';
import { getServiceClient } from '../lib/supabase';

import type { PagesEnv, PagesFunction } from '../lib/types';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const role = new URL(context.request.url).searchParams.get('role');
  const user = getContextUser(context);
  if (!role || !['college_admin', 'school_admin', 'university_admin'].includes(role)) {
    return apiError(400, 'VALIDATION_ERROR', 'A supported admin role is required', context.request);
  }
  if (!user.roles?.includes(role)) return apiError(403, 'FORBIDDEN', 'Admin role required', context.request);
  try {
    const supabase = getServiceClient(context.env as unknown as PagesEnv);
    const access = await getHybridOrganizationAccess(supabase, user.id, role.replace('_admin', '') as AdminOrganizationType, user.org_id);
    const { data, error } = await supabase.from('feature_keys_cache')
      .select('key, role, nav_group, nav_label, nav_path, display_order, is_active')
      .eq('product_code', 'skillpassport').eq('role', role).order('display_order', { ascending: true });
    if (error || (access.isHybrid && !data?.length)) throw new Error('Feature catalog unavailable');
    return apiSuccess({ featureKeys: (data || []).filter(row => row.is_active), ...access }, context.request);
  } catch {
    return apiError(503, 'FEATURE_ACCESS_UNAVAILABLE', 'Unable to verify organization feature access', context.request);
  }
});

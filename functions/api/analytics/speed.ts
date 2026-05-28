/**
 * Analytics - Speed/Performance Metrics API
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const { data, error } = await supabase
    .from('analytics_speed')
    .select('*')
    .eq('org_id', user.org_id)
    .order('measured_at', { ascending: false })
    .limit(100);

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ metrics: data }, context.request);
});

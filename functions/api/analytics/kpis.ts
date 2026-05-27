/**
 * Analytics - KPIs API
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const period = url.searchParams.get('period') || 'month';

  const { data, error } = await supabase
    .from('analytics_kpis')
    .select('*')
    .eq('org_id', user.org_id)
    .eq('period', period)
    .order('date', { ascending: false })
    .limit(30);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ kpis: data });
});

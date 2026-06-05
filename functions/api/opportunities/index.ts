/**
 * Opportunities API — list with filters (ORG-SCOPED)
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { verifyOrgAccess } from '../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const type = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const orgId = url.searchParams.get('org_id') || user.org_id;

  if (!orgId) {
    return Response.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  // Verify user has access to this organization
  const access = await verifyOrgAccess(supabase, user.sub, orgId);
  if (!access.allowed) {
    return access.error!;
  }

  let query = supabase
    .from('opportunities')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId) // ORG SCOPING
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);
  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ opportunities: data, total: count });
});

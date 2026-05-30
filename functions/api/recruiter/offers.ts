/**
 * Recruiter - Offers API (ORG-SCOPED)
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const orgId = url.searchParams.get('org_id') || user.org_id;
  const viewAll = url.searchParams.get('view_all') === 'true'; // Admin view

  if (!orgId) {
    return Response.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  // Verify user has access to this organization
  const access = await verifyOrgAccess(supabase, user.sub, orgId);
  if (!access.allowed) {
    return access.error!;
  }

  let query = supabase
    .from('offers')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId) // ORG SCOPING
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // If not viewing all (admin), filter by recruiter
  if (!viewAll) {
    query = query.eq('recruiter_id', user.sub);
  }

  const { data, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ offers: data, total: count });
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const orgId = body.org_id || user.org_id;

  if (!orgId) {
    return Response.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  // Verify user has permission to create offers
  const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_CANDIDATES);
  if (!access.allowed) {
    return access.error!;
  }

  body.recruiter_id = user.sub;
  body.org_id = orgId;

  const { data, error } = await supabase
    .from('offers')
    .upsert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ offer: data });
});

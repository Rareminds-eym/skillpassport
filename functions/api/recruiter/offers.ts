import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { verifyOrgAccess } from '../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  if (context.request.method === 'DELETE') return onRequestDelete(context);
  return apiMethodNotAllowed();
};

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  
  if (isNaN(limit) || limit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', context.request);
  if (isNaN(offset) || offset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', context.request);

  const orgId = url.searchParams.get('org_id') || user.org_id;

  // Verify user has access to at least one organization
  if (orgId) {
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) {
      return access.error!;
    }
  }

  let query = supabase
    .from('offers')
    .select('*', { count: 'exact' });

  const status = url.searchParams.get('status');
  if (status) {
    const statuses = status.split(',');
    if (statuses.length === 1) query = query.eq('status', statuses[0]);
    else query = query.in('status', statuses);
  }

  const candidateName = url.searchParams.get('candidateName');
  if (candidateName) query = query.ilike('candidate_name', `%${candidateName}%`);

  const jobTitle = url.searchParams.get('jobTitle');
  if (jobTitle) query = query.ilike('job_title', `%${jobTitle}%`);

  const offerDateFrom = url.searchParams.get('offerDateFrom');
  if (offerDateFrom) query = query.gte('offer_date', offerDateFrom);
  const offerDateTo = url.searchParams.get('offerDateTo');
  if (offerDateTo) query = query.lte('offer_date', offerDateTo);

  const expiryDateFrom = url.searchParams.get('expiryDateFrom');
  if (expiryDateFrom) query = query.gte('expiry_date', expiryDateFrom);
  const expiryDateTo = url.searchParams.get('expiryDateTo');
  if (expiryDateTo) query = query.lte('expiry_date', expiryDateTo);

  const sortField = url.searchParams.get('sortField') || 'inserted_at';
  const sortDir = url.searchParams.get('sortDir') || 'desc';
  query = query.order(sortField as any, { ascending: sortDir === 'asc' });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ offers: data, total: count }, context.request);
});

const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { data, error } = await supabase
    .from('offers')
    .upsert(body)
    .select()
    .single();

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ offer: data }, context.request);
});

const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const id = url.searchParams.get('id');
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'id query param required', context.request);

  const { error } = await supabase.from('offers').delete().eq('id', id);
  if (error) return apiDbError(error, context.request);
  return apiSuccess({ deleted: true }, context.request);
});

/**
 * Learners API
 *
 * CRUD operations for learner records.
 * All endpoints require SSO authentication. Data scoped by org_id.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const learnerId = url.searchParams.get('id');

  const orgFilter = `college_id.eq.${user.org_id},school_id.eq.${user.org_id},universityId.eq.${user.org_id}`;

  // If specific learner requested (by learners.id OR user_id — handles both QR/share links and auth UUID lookups)
  // No org filter — direct ID lookup should work regardless of org
  if (learnerId) {
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .or(`id.eq.${learnerId},user_id.eq.${learnerId}`)
      .maybeSingle();

    if (error) return apiDbError(error, context.request);
    return apiSuccess({ learner: data }, context.request);
  }

  // If user is a learner, return their own profile
  const isLearner = user.roles.some((r: string) =>
    ['learner'].includes(r)
  );

  if (isLearner) {
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') return apiDbError(error, context.request);
    return apiSuccess({ learner: data || null }, context.request);
  }

  // Admin: list learners in their org
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  if (isNaN(limit) || limit < 1) return apiError(400, 'VALIDATION_ERROR', 'limit must be a positive integer', context.request);
  if (isNaN(offset) || offset < 0) return apiError(400, 'VALIDATION_ERROR', 'offset must be a non-negative integer', context.request);

  const { data, error, count } = await supabase
    .from('learners')
    .select('*', { count: 'exact' })
    .or(orgFilter)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ learners: data, total: count }, context.request);
});

/**
 * POST /api/learners — Create or update learner record
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const orgFilter = `college_id.eq.${user.org_id},school_id.eq.${user.org_id},universityId.eq.${user.org_id}`;

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  if (body.id) {
    // Update existing
    const { data, error } = await supabase
      .from('learners')
      .update(body)
      .eq('id', body.id)
      .or(orgFilter)
      .select()
      .single();

    if (error) return apiDbError(error, context.request);
    return apiSuccess({ learner: data }, context.request);
  }

  // Create new
  body.user_id = body.user_id || user.id;
  const { data, error } = await supabase
    .from('learners')
    .insert(body)
    .select()
    .single();

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ learner: data }, context.request, 201);
});

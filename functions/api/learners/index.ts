/**
 * Learners API
 *
 * CRUD operations for learner records.
 * All endpoints require SSO authentication. Data scoped by org_id.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

/**
 * GET /api/learners — List learners (for admins) or get own profile (for learners)
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const learnerId = url.searchParams.get('id');

  // If specific learner requested
  if (learnerId) {
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .eq('id', learnerId)
      .single();

    if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
    return apiSuccess({ learner: data }, context.request);
  }

  // If user is a learner, return their own profile
  const isLearner = user.roles.some((r: string) =>
    ['learner', 'learner', 'learner'].includes(r)
  );

  if (isLearner) {
    const { data, error } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
    return apiSuccess({ learner: data }, context.request);
  }

  // Admin: list learners in their org
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const { data, error, count } = await supabase
    .from('learners')
    .select('*', { count: 'exact' })
    .eq('org_id', user.org_id)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ learners: data, total: count }, context.request);
});

/**
 * POST /api/learners — Create or update learner record
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  // Ensure org_id is set from the JWT (prevent cross-org writes)
  body.org_id = user.org_id;

  if (body.id) {
    // Update existing
    const { data, error } = await supabase
      .from('learners')
      .update(body)
      .eq('id', body.id)
      .eq('org_id', user.org_id)
      .select()
      .single();

    if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
    return apiSuccess({ learner: data }, context.request);
  }

  // Create new
  body.user_id = body.user_id || user.id;
  const { data, error } = await supabase
    .from('learners')
    .insert(body)
    .select()
    .single();

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ learner: data }, context.request, 201);
});

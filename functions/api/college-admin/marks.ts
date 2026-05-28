/**
 * College Admin - Marks/Grades API
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const learnerId = url.searchParams.get('learner_id');
  const semester = url.searchParams.get('semester');

  let query = supabase
    .from('marks')
    .select('*')
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false });

  if (learnerId) query = query.eq('learner_id', learnerId);
  if (semester) query = query.eq('semester', semester);

  const { data, error } = await query;
  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ marks: data }, context.request);
});

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

  body.org_id = user.org_id;

  const { data, error } = await supabase
    .from('marks')
    .upsert(body)
    .select()
    .single();

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ mark: data }, context.request);
});

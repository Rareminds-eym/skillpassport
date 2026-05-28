/**
 * Recruiter - Offers API
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
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const { data, error, count } = await supabase
    .from('offers')
    .select('*', { count: 'exact' })
    .eq('recruiter_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ offers: data, total: count }, context.request);
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

  body.recruiter_id = user.id;
  body.org_id = user.org_id;

  const { data, error } = await supabase
    .from('offers')
    .upsert(body)
    .select()
    .single();

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ offer: data }, context.request);
});

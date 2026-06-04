/**
 * Courses - Performance API
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
  const courseId = url.searchParams.get('course_id');
  const learnerId = url.searchParams.get('learner_id') || user.id;

  let query = supabase
    .from('course_performance')
    .select('*')
    .eq('learner_id', learnerId);

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  return apiSuccess({ performance: data }, context.request);
});

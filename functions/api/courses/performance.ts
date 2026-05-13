/**
 * Courses - Performance API
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const courseId = url.searchParams.get('course_id');
  const learnerId = url.searchParams.get('learner_id') || user.sub;

  let query = supabase
    .from('course_performance')
    .select('*')
    .eq('learner_id', learnerId);

  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ performance: data });
});

/**
 * College Admin - Transcripts API
 */
import { withAuth, requireRole } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const learnerId = url.searchParams.get('learner_id');

  let query = supabase
    .from('transcripts')
    .select('*')
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false });

  if (learnerId) {
    query = query.eq('learner_id', learnerId);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ transcripts: data });
});

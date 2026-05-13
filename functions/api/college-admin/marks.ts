/**
 * College Admin - Marks/Grades API
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = context.data.user;
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
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ marks: data });
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

  body.org_id = user.org_id;

  const { data, error } = await supabase
    .from('marks')
    .upsert(body)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ mark: data });
});

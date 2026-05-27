/**
 * Educator API — geographic, hiring, diversity data
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const resource = url.searchParams.get('resource') || 'profile';

  if (resource === 'profile') {
    const { data, error } = await supabase
      .from('educators')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ educator: data });
  }

  // Admin view: list educators in org
  const { data, error } = await supabase
    .from('educators')
    .select('*')
    .eq('org_id', user.org_id)
    .order('created_at', { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ educators: data });
});

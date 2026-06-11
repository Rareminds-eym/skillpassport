/**
 * Educator API — geographic, hiring, diversity data
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiMethodNotAllowed } from '../../lib/response';

export const onRequest = async (context: any) => {
  if (context.request.method === 'GET') return onRequestGet(context);
  return apiMethodNotAllowed();
};

const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
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

    if (error) return apiDbError(error, context.request);
    return apiSuccess({ educator: data }, context.request);
  }

  // Admin view: list educators in org
  const { data, error } = await supabase
    .from('educators')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return apiDbError(error, context.request);
  return apiSuccess({ educators: data }, context.request);
});

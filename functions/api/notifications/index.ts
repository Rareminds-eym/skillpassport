import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const unreadOnly = url.searchParams.get('unread') === 'true';
  const before = url.searchParams.get('before');

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  if (unreadOnly) {
    query = query.eq('read', false);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }

  return apiSuccess({ notifications: data, total: count }, context.request);
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: { action: string; ids?: string[] };
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  if (!body.action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);
  }

  switch (body.action) {
    case 'mark-read': {
      if (!body.ids || body.ids.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'ids are required for mark-read', context.request);
      }
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .in('id', body.ids);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    case 'mark-all-read': {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('read', false);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    case 'delete': {
      if (!body.ids || body.ids.length === 0) {
        return apiError(400, 'VALIDATION_ERROR', 'ids are required for delete', context.request);
      }
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', user.id)
        .in('id', body.ids);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${body.action}`, context.request);
  }
});

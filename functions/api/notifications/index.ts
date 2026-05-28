/**
 * Notifications API
 *
 * CRUD operations for user notifications.
 * All endpoints require SSO authentication via withAuth.
 * Data is scoped to the authenticated user's org.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

/**
 * GET /api/notifications — List notifications for the current user
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  const url = new URL(context.request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const unreadOnly = url.searchParams.get('unread') === 'true';

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error, count } = await query;

  if (error) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }

  return apiSuccess({ notifications: data, total: count }, context.request);
});

/**
 * POST /api/notifications — Mark as read or delete
 * Body: { action: 'mark-read' | 'mark-all-read' | 'delete', ids?: string[] }
 */
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
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .in('id', body.ids);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    case 'mark-all-read': {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

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
        .eq('user_id', user.id)
        .in('id', body.ids);

      if (error) return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
      return apiSuccess(null, context.request);
    }

    default:
      return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${body.action}`, context.request);
  }
});

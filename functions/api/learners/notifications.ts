import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';
import { notifyRealtime } from '../../lib/realtime';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request, { startTime });
  }

  const { action, ...params } = body;
  if (!action) {
    return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request, { startTime });
  }

  try {
    switch (action) {
      case 'get-notifications': {
        const { learnerId, unreadOnly, type, limit: queryLimit } = params;
        let query = supabase.from('learner_notifications').select('*')
          .eq('learner_id', learnerId)
          .order('created_at', { ascending: false });
        if (unreadOnly) query = query.eq('is_read', false);
        if (type) query = query.eq('notification_type', type);
        if (queryLimit) query = query.limit(queryLimit);
        const { data, error } = await query;
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ data: data || [] }, context.request, { startTime });
      }

      case 'get-unread-count': {
        const { learnerId } = params;
        const { count, error } = await supabase
          .from('learner_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('learner_id', learnerId)
          .eq('is_read', false);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        return apiSuccess({ count: count || 0 }, context.request, { startTime });
      }

      case 'mark-as-read': {
        const { notificationId, learnerId } = params;
        const { data, error } = await supabase
          .from('learner_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', notificationId)
          .eq('learner_id', learnerId)
          .select()
          .single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        if (data) {
          context.waitUntil(notifyRealtime(env as any, 'learner_notifications', 'UPDATE', data));
        }
        return apiSuccess({ success: !!data }, context.request, { startTime });
      }

      case 'mark-all-as-read': {
        const { learnerId } = params;
        const { data, error } = await supabase
          .from('learner_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('learner_id', learnerId)
          .eq('is_read', false)
          .select();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        if (data) {
          data.forEach((notification: any) => context.waitUntil(notifyRealtime(env as any, 'learner_notifications', 'UPDATE', notification)));
        }
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'create-notification': {
        const { data: insertData, error } = await supabase
          .from('learner_notifications')
          .insert([{
            learner_id: params.learner_id,
            notification_type: params.notification_type,
            title: params.title,
            message: params.message,
            pipeline_candidate_id: params.pipeline_candidate_id || null,
            opportunity_id: params.opportunity_id || null,
            interview_id: params.interview_id || null,
            application_id: params.application_id || null,
            metadata: params.metadata || null,
          }])
          .select()
          .single();
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        context.waitUntil(notifyRealtime(env as any, 'learner_notifications', 'INSERT', insertData));
        return apiSuccess({ data: insertData }, context.request, { startTime });
      }

      case 'delete-notification': {
        const { notificationId, learnerId } = params;
        const { error } = await supabase
          .from('learner_notifications')
          .delete()
          .eq('id', notificationId)
          .eq('learner_id', learnerId);
        if (error) return apiError(500, 'DB_ERROR', error.message, context.request, { startTime });
        context.waitUntil(notifyRealtime(env as any, 'learner_notifications', 'DELETE', { id: notificationId }));
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error) {
    console.error('[Notifications] Error:', error);
    return apiError(500, 'INTERNAL_ERROR', error instanceof Error ? error.message : 'Unknown error', context.request, { startTime });
  }
});

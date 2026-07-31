import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { withAuth } from '../../../lib/auth';
import { apiDbError, apiError, apiSuccess } from '../../../lib/response';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env;
  const supabase = getServiceClient(env);
  const startTime = Date.now();

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  try {
    switch (action) {
      case 'get-promotional-event': {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('promotional_events')
          .select('*')
          .eq('is_active', true)
          .lte('start_date', now)
          .gte('end_date', now)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || null, context.request, { startTime });
      }

      case 'debug-supabase': {
        const { data, error } = await supabase
          .from('learners')
          .select('*')
          .limit(3);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      case 'debug-recent-updates': {
        const { data, error } = await supabase
          .from('recent_updates')
          .select('*', { count: 'exact' });
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ data: data || [], count: (data || []).length }, context.request, { startTime });
      }

      case 'debug-recent-updates-by-user': {
        const { userId } = params;
        if (!userId) return apiError(400, 'VALIDATION_ERROR', 'Missing userId', context.request, { startTime });
        const { data, error } = await supabase
          .from('recent_updates')
          .select('*')
          .eq('user_id', userId);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data || [], context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[shared-widgets/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

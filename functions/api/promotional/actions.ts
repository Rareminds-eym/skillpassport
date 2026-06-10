import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try { body = await context.request.json() as any; } catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request); }

  const { action } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action', context.request);

  const startTime = Date.now();

  try {
    switch (action) {

      case 'fetch-promotional-event': {
        const { data, error } = await supabase
          .from('promotional_events')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) return apiDbError(error, context.request, { startTime });

        return apiSuccess(data ?? null, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[promotional/actions] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'Missing action parameter', context.request);

  const startTime = Date.now();

  try {
    switch (action) {
      case 'upload': {
        const { bucket, path, file_base64, content_type } = params;
        if (!bucket || !path || !file_base64) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing bucket, path, or file_base64', context.request, { startTime });
        }
        const buffer = Uint8Array.from(atob(file_base64), c => c.charCodeAt(0));
        const { data, error } = await supabase.storage.from(bucket).upload(path, buffer, {
          contentType: content_type || 'application/octet-stream',
          upsert: true,
        });
        if (error) return apiDbError(error, context.request, { startTime });
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return apiSuccess({ path: data?.path || path, publicUrl }, context.request, { startTime });
      }

      case 'get-url': {
        const { bucket, path } = params;
        if (!bucket || !path) return apiError(400, 'VALIDATION_ERROR', 'Missing bucket or path', context.request, { startTime });
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
        return apiSuccess({ publicUrl }, context.request, { startTime });
      }

      case 'delete': {
        const { bucket, path } = params;
        if (!bucket || !path) return apiError(400, 'VALIDATION_ERROR', 'Missing bucket or path', context.request, { startTime });
        const paths = Array.isArray(path) ? path : [path];
        const { data, error } = await supabase.storage.from(bucket).remove(paths);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ deleted: data }, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[storage POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});

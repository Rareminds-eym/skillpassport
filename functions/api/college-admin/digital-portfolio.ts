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
      case 'insert-certificate': {
        const { data, error } = await supabase
          .from('certificates')
          .insert([params])
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'update-enrollment-certificate': {
        const { learner_id, course_id, certificate_url } = params;
        if (!learner_id || !course_id || !certificate_url) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id, course_id, or certificate_url', context.request, { startTime });
        }
        const { error } = await supabase
          .from('course_enrollments')
          .update({ certificate_url })
          .eq('learner_id', learner_id)
          .eq('course_id', course_id);
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess({ success: true }, context.request, { startTime });
      }

      case 'get-learner': {
        const { id } = params;
        if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner id', context.request, { startTime });
        const { data, error } = await supabase
          .from('learners')
          .select('*')
          .eq('id', id)
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      case 'save-badges': {
        const { learner_id, metadata } = params;
        if (!learner_id || !metadata) {
          return apiError(400, 'VALIDATION_ERROR', 'Missing learner_id or metadata', context.request, { startTime });
        }
        const { data, error } = await supabase
          .from('learners')
          .update({ metadata })
          .eq('id', learner_id)
          .select()
          .single();
        if (error) return apiDbError(error, context.request, { startTime });
        return apiSuccess(data, context.request, { startTime });
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request, { startTime });
    }
  } catch (error: any) {
    console.error(`[digital-portfolio POST] action=${action}:`, error?.message || error);
    return apiDbError(error, context.request, { startTime });
  }
});

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});

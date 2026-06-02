import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: any;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action, ...params } = body;
  if (!action) return apiError(400, 'VALIDATION_ERROR', 'action is required', context.request);

  try {
    switch (action) {
      case 'get': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'email is required', context.request);

        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (learnerError) throw learnerError;
        if (!learnerData) return apiSuccess({ updates: [] }, context.request);

        const { data: updatesData } = await supabase
          .from('recent_updates')
          .select('updates')
          .eq('learner_id', learnerData.id)
          .maybeSingle();

        const updates = updatesData?.updates?.updates || [];
        return apiSuccess({ updates }, context.request);
      }

      case 'add': {
        const { email, update: newUpdate } = params;
        if (!email || !newUpdate) {
          return apiError(400, 'VALIDATION_ERROR', 'email and update are required', context.request);
        }

        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (learnerError) throw learnerError;
        if (!learnerData) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request);

        const { data: existingData } = await supabase
          .from('recent_updates')
          .select('updates')
          .eq('learner_id', learnerData.id)
          .maybeSingle();

        const currentUpdates = existingData?.updates?.updates || [];
        const updatedUpdates = [newUpdate, ...currentUpdates].slice(0, 10);

        const { error } = await supabase
          .from('recent_updates')
          .upsert(
            { learner_id: learnerData.id, updates: { updates: updatedUpdates } },
            { onConflict: 'learner_id' }
          );

        if (error) throw error;
        return apiSuccess({ updates: updatedUpdates }, context.request);
      }

      case 'clear': {
        const { email } = params;
        if (!email) return apiError(400, 'VALIDATION_ERROR', 'email is required', context.request);

        const { data: learnerData, error: learnerError } = await supabase
          .from('learners')
          .select('id')
          .eq('email', email)
          .maybeSingle();

        if (learnerError) throw learnerError;
        if (!learnerData) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request);

        const { error } = await supabase
          .from('recent_updates')
          .upsert(
            { learner_id: learnerData.id, updates: { updates: [] } },
            { onConflict: 'learner_id' }
          );

        if (error) throw error;
        return apiSuccess({ updates: [] }, context.request);
      }

      default:
        return apiError(400, 'VALIDATION_ERROR', `Unknown action: ${action}`, context.request);
    }
  } catch (error: any) {
    return apiError(500, 'INTERNAL_ERROR', error.message, context.request);
  }
});
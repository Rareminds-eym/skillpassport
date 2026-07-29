import { withAuth, getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../../lib/response';

interface AchievementRecord {
  learner_id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  approval_status: string;
  enabled: boolean;
}

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as PagesEnv;
  const supabase = getServiceClient(env);
  const startTime = Date.now();

  let body: { records?: AchievementRecord[] };
  try {
    body = (await context.request.json()) as { records?: AchievementRecord[] };
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { records } = body;
  if (!records || !Array.isArray(records) || records.length === 0) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing or empty records array', context.request, { startTime });
  }

  for (const record of records) {
    if (!record.learner_id) {
      return apiError(400, 'VALIDATION_ERROR', 'Each record must have a learner_id', context.request, { startTime });
    }
  }

  const { data, error } = await supabase.from('achievements').insert(records).select();
  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime: Date.now() });
});

export const onRequestGet = withAuth(async () => apiMethodNotAllowed());
export const onRequestPatch = withAuth(async () => apiMethodNotAllowed());
export const onRequestDelete = withAuth(async () => apiMethodNotAllowed());

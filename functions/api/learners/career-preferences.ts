import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiMethodNotAllowed } from '../../lib/response';
import { privateRecommendations } from '../../lib/job-recommendations';
import { careerPreferencesSchema, careerPreferencesRevisionSchema, emptyCareerPreferences } from '../../../shared/contracts/career-preferences';
import { z } from 'zod';

const saveSchema = z.object({ learnerId: z.string().uuid(), preferences: careerPreferencesSchema, expectedRevision: careerPreferencesRevisionSchema }).strict();

const handle = withAuth(async context => {
  const user = getContextUser(context);
  const db = getServiceClient(context.env as any);
  const owned = await db.from('learners').select('id').eq('user_id', user.id).maybeSingle();
  if (owned.error) return apiError(503, 'PROFILE_UNAVAILABLE', 'Your profile is temporarily unavailable.', context.request);
  if (!owned.data) return apiError(404, 'NOT_FOUND', 'Create your learner profile first.', context.request);
  const learnerId = owned.data.id;
  if (context.request.method === 'GET') {
    const result = await db.from('learner_career_preferences').select('preferences,revision').eq('learner_id', learnerId).maybeSingle();
    if (result.error) return apiError(503, 'PREFERENCES_UNAVAILABLE', 'Career preferences are temporarily unavailable.', context.request);
    const parsed = careerPreferencesSchema.safeParse(result.data?.preferences ?? emptyCareerPreferences());
    const revision = careerPreferencesRevisionSchema.safeParse(result.data ? result.data.revision : null);
    if (!parsed.success || !revision.success || (result.data && revision.data === null)) return apiError(503, 'PREFERENCES_UNAVAILABLE', 'Career preferences could not be read.', context.request);
    return apiSuccess({ learnerId, preferences: parsed.data, preferencesRevision: revision.data }, context.request);
  }
  let body: unknown;
  try { body = await context.request.json(); }
  catch { return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body.', context.request); }
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return apiError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Invalid career preferences.', context.request);
  if (parsed.data.learnerId !== learnerId) return apiError(409, 'PROFILE_CHANGED', 'Your profile changed. Reload before saving preferences.', context.request);
  const result = await db.rpc('save_learner_career_preferences_v2', { p_learner_id: learnerId, p_user_id: user.id, p_preferences: parsed.data.preferences, p_expected_revision: parsed.data.expectedRevision });
  if (result.error?.code === '40001') return apiError(409, 'PREFERENCES_CHANGED', 'Career preferences changed elsewhere. Reload the latest preferences before saving.', context.request);
  if (result.error) return apiError(result.error.code === '42501' ? 409 : 503, 'PREFERENCES_SAVE_FAILED', 'Preferences could not be saved. Please retry.', context.request);
  return apiSuccess(result.data, context.request);
});

export const onRequest: PagesFunction = async context => privateRecommendations(
  ['GET', 'PUT'].includes(context.request.method) ? await handle(context) : apiMethodNotAllowed(),
);

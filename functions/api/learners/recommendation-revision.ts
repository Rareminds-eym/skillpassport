import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess, apiError, apiMethodNotAllowed } from '../../lib/response';
import { privateRecommendations } from '../../lib/job-recommendations';
import { readRecommendationFreshness } from '../embedding/services/textBuilder';
import { careerPreferencesSchema } from '../../../shared/contracts/career-preferences';
import { prepareRecommendationLearning } from '../../lib/recommendation-learning';

const get = withAuth(async context => {
  const user = getContextUser(context);
  const learnerId = new URL(context.request.url).searchParams.get('learnerId');
  if (!learnerId || !/^[a-f0-9-]{36}$/i.test(learnerId)) return apiError(400, 'VALIDATION_ERROR', 'A learner ID is required.', context.request);
  const db = getServiceClient(context.env as any);
  const own = await db.from('learners').select('id').eq('user_id', user.id).eq('id', learnerId).maybeSingle();
  if (own.error) return apiError(503, 'PROFILE_UNAVAILABLE', 'Your profile is temporarily unavailable.', context.request);
  if (!own.data) return apiError(403, 'FORBIDDEN', 'The learner profile is unavailable for this account.', context.request);
  try {
    const row = await db.from('learner_career_preferences').select('preferences').eq('learner_id', learnerId).maybeSingle();
    if (row.error) throw new Error('Preferences unavailable');
    await prepareRecommendationLearning(db, context.env as any, learnerId, user.id, careerPreferencesSchema.parse(row.data?.preferences ?? {}));
    return apiSuccess({ learnerId, ...await readRecommendationFreshness(db, learnerId, user.id) }, context.request);
  }
  catch { return apiError(503, 'EVIDENCE_UNAVAILABLE', 'Career context is temporarily unavailable.', context.request); }
});
export const onRequest: PagesFunction = async context => privateRecommendations(context.request.method === 'GET' ? await get(context) : apiMethodNotAllowed());

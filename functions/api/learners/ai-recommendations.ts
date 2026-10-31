/**
 * Learner AI Recommendations API
 *
 * GET /api/learners/ai-recommendations
 *
 * Fetches AI-powered job recommendations for a learner including:
 * - Matched jobs based on skills and profile
 * - Match scores and reasons
 * - Opportunity details
 *
 * Uses service_role to bypass RLS. Requires SSO authentication.
 */
import { withAuth, getContextUser } from '../../lib/auth';
import { ensureAppUserAndLearner } from '../../lib/heal-user';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
type AuthenticatedContext = Parameters<PagesFunction>[0];
import { apiSuccess, apiError } from '../../lib/response';
import { privateRecommendations, stringSkills } from '../../lib/job-recommendations';
import { rankRecommendationCandidates } from '../../lib/recommendation-ranking';
import { prepareRecommendationLearning } from '../../lib/recommendation-learning';
import { learningDecisions, LearningError } from '../../lib/learning-eligibility';
import { hasFeatureEntitlement } from '../../lib/entitlements';
import { buildLearnerRecommendationContext, readRecommendationFreshness } from '../embedding/services/textBuilder';
import { EmbeddingError } from '../embedding/types';
import { recommendationEnvelopeSchema } from '../../../shared/contracts/job-recommendations';

const logger = createLogger('learner-ai-recommendations-api');

const authenticatedGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as unknown as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = getContextUser(context);

  try {
    const userId = user.id;
    const userEmail = user.email;
    if (!await hasFeatureEntitlement(supabase, userId, 'ai_job_matching')) return privateRecommendations(
      apiError(403, 'FEATURE_ACCESS_DENIED', 'Job matching requires an active plan or matching add-on.', context.request),
    );
    logger.info('Fetching AI recommendations', { userId, userEmail });
    
    // Step 1: Get learner by user_id
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      logger.error('Error fetching learner', { userId, error: learnerError });
      return apiError(500, 'DATABASE_ERROR', 'Failed to fetch learner data', context.request, { startTime });
    }

    let finalLearner: any = learnerData;
    if (!learnerData) {
      logger.warn('No learner found', { userId, userEmail });
      const { isHealEnabled } = await import('../../lib/healConfig');
      let heal: { healed: boolean; reason: string } = { healed: false, reason: 'flag_disabled' };
      if (await isHealEnabled(context.env as Record<string, unknown>, 'heal-user')) {
        heal = await ensureAppUserAndLearner(supabase as any, context.env as any, { sub: userId, email: userEmail }, String(startTime));
      } else {
        logger.info('heal_metric', { metric: 'heal_cache_miss_total', status: 'heal_disabled', flag: 'heal-user', userId } as any);
      }
      if (heal.healed) {
        const { data: healed } = await supabase.from('learners').select('*').eq('user_id', userId).maybeSingle();
        if (healed) {
          logger.info('Healed learner for ai-recommendations', { userId, learnerId: healed.id });
          finalLearner = healed;
        } else {
          return apiError(404, 'NOT_FOUND', `No learner record found for user_id "${userId}"`, context.request, { startTime });
        }
      } else {
        return apiError(404, 'NOT_FOUND', `No learner record found for user_id "${userId}"`, context.request, { startTime });
      }
    }

    const learnerId = finalLearner.id;
    const careerContext = await buildLearnerRecommendationContext(supabase, learnerId, userId, env);
    if (careerContext.readiness.state !== 'ready') return privateRecommendations(apiSuccess(
      recommendationEnvelopeSchema.parse({ schemaVersion: 2, state: careerContext.readiness.state,
        readiness: careerContext.readiness, input_revision: careerContext.inputRevision,
        recommendations: [], provenance: 'none', cached: false }), context.request,
    ));
    logger.info('Learner found', { learnerId, userId });
    const freshness = await readRecommendationFreshness(supabase, learnerId, userId);
    if (freshness.inputRevision !== careerContext.inputRevision) return apiError(409, 'RECOMMENDATIONS_CHANGED', 'Profile changed; please refresh recommendations.', context.request);

    // Step 2: Get learner's skills for matching
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('name, type, proficiency_level')
      .eq('learner_id', learnerId)
      .eq('enabled',true).eq('approval_status','approved');

    if (skillsError) {
      logger.error('Error fetching skills', { learnerId, error: skillsError });
      return privateRecommendations(apiError(503, 'EVIDENCE_UNAVAILABLE', 'Profile skills are temporarily unavailable', context.request));
    }

    const learnerSkills = skillsData || [];
    const technicalSkills = stringSkills(learnerSkills.filter(s => s.type === 'technical').map(s => s.name));
    const softSkills = stringSkills(learnerSkills.filter(s => s.type === 'soft').map(s => s.name));

    logger.info('Fetched learner skills', { 
      learnerId, 
      technicalCount: technicalSkills.length,
      softCount: softSkills.length 
    });

    // Apply ownership, applications, dismissals and required preferences in SQL
    // before the bounded candidate limit. Ranking uses the shared evidence policy.
    const { data: opportunities, error: oppError } = await supabase.rpc('get_recommendation_candidates_v1', {
      p_learner_id: learnerId, p_user_id: userId,
    });
    if (oppError || !Array.isArray(opportunities)) return apiError(503, 'MATCHING_UNAVAILABLE', 'Job candidates are temporarily unavailable.', context.request);
    const topRecommendations = rankRecommendationCandidates(
      await learningDecisions(supabase, env, userId, learnerId, opportunities), careerContext,
    ).slice(0, 20);

    logger.info('Generated AI recommendations', { 
      learnerId, 
      userId,
      totalOpportunities: opportunities?.length || 0,
      recommendations: topRecommendations.length,
      topScore: topRecommendations[0]?.match_percentage || 0
    });

    const responseData = {
      schemaVersion: 2,
      state: topRecommendations.length ? 'ready' : 'no_matches',
      readiness: careerContext.readiness,
      input_revision: careerContext.inputRevision,
      catalog_revision: freshness.catalogRevision,
      source_status: careerContext.sourceStatus,
      recommendations: topRecommendations,
      cached: false,
      fallback: false,
      provenance: 'rules',
      learnerProfile: {
        skills: {
          technical: technicalSkills,
          soft: softSkills
        },
        preferences: {
          employmentTypes: careerContext.preferences.employmentTypes,
          locations: careerContext.preferences.locations,
          departments: careerContext.preferences.departments
        }
      }
    };

    if (careerContext.preferences.useVerifiedLearning) await prepareRecommendationLearning(supabase, env, learnerId, userId, careerContext.preferences);
    const latest = await readRecommendationFreshness(supabase, learnerId, userId);
    if (latest.inputRevision !== careerContext.inputRevision || latest.catalogRevision !== freshness.catalogRevision)
      return privateRecommendations(apiError(409, 'RECOMMENDATIONS_CHANGED', 'Profile changed; please refresh recommendations', context.request));
    return privateRecommendations(apiSuccess(recommendationEnvelopeSchema.parse(responseData), context.request, { startTime }));

  } catch (err) {
    if (err instanceof LearningError) return apiError(503, 'LEARNING_UNAVAILABLE', 'Learning recommendations are temporarily unavailable.', context.request);
    if (err instanceof EmbeddingError) return apiError(
      err.code === 'CONTEXT_CHANGED' ? 409 : 503,
      err.code === 'CONTEXT_CHANGED' ? 'RECOMMENDATIONS_CHANGED' : 'EVIDENCE_UNAVAILABLE',
      err.code === 'CONTEXT_CHANGED' ? 'Profile changed; please refresh recommendations' : 'Career context is temporarily unavailable. Please retry.',
      context.request,
    );
    logger.error('Unexpected error fetching AI recommendations', { error: err });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});

export const onRequestGet: PagesFunction = async context => privateRecommendations(await authenticatedGet(context));

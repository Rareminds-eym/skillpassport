/**
 * Recommend Opportunities Handler - AI-powered job matching
 *
 * Features:
 * - Verified embedding similarity against current job content
 * - Auto-generation of learner embeddings if missing
 * - Approved learning evidence included in the learner embedding
 * - Caching via database RPCs
 * - Dismissal filtering
 * - Personalized results only; unavailable dependencies return explicit errors
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { isValidUUID } from '../../../lib/validation';
import { checkRateLimit, getRateLimitInfo } from '../utils/rate-limit';

import { buildLearnerRecommendationContext } from '../../embedding/services/textBuilder';
import { EmbeddingError } from '../../embedding/types';
import { recommendationEnvelopeSchema } from '../../../../shared/contracts/job-recommendations';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
import { hydrateJobs } from '../../../lib/job-recommendations';
import {
  readRecommendationState,
  publishRecommendationVector,
} from '../utils/recommendation-state';
import {
  RECOMMENDATION_PREPROCESSING_VERSION,
  RECOMMENDATION_RANKING_POLICY_VERSION,
} from '../utils/recommendation-versions';
import { refreshJobMatchingIndex } from '../utils/job-matching-index';
import { rankRecommendationCandidates } from '../../../lib/recommendation-ranking';
import { prepareRecommendationLearning } from '../../../lib/recommendation-learning';
import { learningDecisions, LearningError } from '../../../lib/learning-eligibility';

const RECOMMEND_CONFIG = {
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20,
};

function validIndexStatus(value: unknown): value is { total: number; verified: number } {
  if (!value || typeof value !== 'object') return false;
  const counts = value as { total: number; verified: number };
  return Number.isInteger(counts.total) && Number.isInteger(counts.verified)
    && counts.total >= 0 && counts.verified >= 0 && counts.verified <= counts.total;
}

// ==================== MAIN HANDLER ====================

export async function handleRecommendOpportunities(
  request: Request,
  env: Record<string, string>,
  authenticatedUserId: string,
): Promise<Response> {
  if (request.method !== 'POST') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }

  // This identity comes from the verified auth context, never the request body.
  if (typeof authenticatedUserId !== 'string' || !authenticatedUserId.trim()) {
    return apiError(401, 'AUTH_REQUIRED', 'Authentication required', request);
  }

  const startTime = Date.now();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return apiError(
      400,
      'VALIDATION_ERROR',
      'Request body must be an object',
      request,
    );
  }

  const {
    learnerId: requestedLearnerId,
    forceRefresh = false,
    limit = RECOMMEND_CONFIG.DEFAULT_LIMIT,
  } = body as Record<string, unknown>;

  if (
    typeof requestedLearnerId !== 'string' ||
    !isValidUUID(requestedLearnerId)
  ) {
    return apiError(
      400,
      'VALIDATION_ERROR',
      'Invalid learnerId format',
      request,
    );
  }

  if (typeof forceRefresh !== 'boolean') {
    return apiError(
      400,
      'VALIDATION_ERROR',
      'forceRefresh must be a boolean',
      request,
    );
  }

  if (
    typeof limit !== 'number' ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
  ) {
    return apiError(
      400,
      'VALIDATION_ERROR',
      'limit must be an integer between 1 and 50',
      request,
    );
  }

  const supabase = createSupabaseAdminClient(env);
  let identity: { id: string; user_id: string } | null;
  try {
    const { data, error } = await supabase
      .from('learners')
      .select('id, user_id')
      .eq('user_id', authenticatedUserId)
      .maybeSingle();

    if (error) {
      console.error('[RECOMMEND AUTHORIZATION] Learner lookup failed', {
        code: error.code,
      });
      return apiError(
        500,
        'DATABASE_ERROR',
        'Failed to resolve learner profile',
        request,
      );
    }
    identity = data;
  } catch {
    console.error('[RECOMMEND AUTHORIZATION] Learner lookup unavailable');
    return apiError(
      500,
      'DATABASE_ERROR',
      'Failed to resolve learner profile',
      request,
    );
  }

  if (!identity) {
    return apiError(404, 'NOT_FOUND', 'Learner profile not found', request);
  }

  if (
    !isValidUUID(identity.id) ||
    typeof identity.user_id !== 'string' ||
    identity.user_id.toLowerCase() !== authenticatedUserId.toLowerCase()
  ) {
    return apiError(
      500,
      'DATABASE_ERROR',
      'Failed to resolve learner profile',
      request,
    );
  }

  // Reject foreign and nonexistent targets alike, before cache or profile work.
  if (requestedLearnerId.toLowerCase() !== identity.id.toLowerCase()) {
    return apiError(
      403,
      'FORBIDDEN',
      'Only your own recommendations may be requested',
      request,
    );
  }

  const learnerId = identity.id;
  // Interactions reference learners.user_id; vectors/cache reference learners.id.
  const learnerUserId = identity.user_id;
  if (env.JOB_MATCHING_ENABLED === 'false') {
    return apiError(
      503,
      'MATCHING_DISABLED',
      'Job matching is temporarily unavailable',
      request,
    );
  }
  if (!(await checkRateLimit(`matching:${learnerUserId}`, env))) {
    const response = apiError(429, 'MATCHING_RATE_LIMITED', 'Please wait before requesting recommendations again.', request);
    response.headers.set('Retry-After', String(Math.max(1, Math.ceil((getRateLimitInfo(`matching:${learnerUserId}`).resetAt - Date.now()) / 1000))));
    return response;
  }
  const safeLimit = limit;

  try {
    // Readiness runs before the global index, cached cards and stored vectors.
    const context = await buildLearnerRecommendationContext(supabase, learnerId, learnerUserId, env);
    if (context.readiness.state !== 'ready') {
      return apiSuccess(recommendationEnvelopeSchema.parse({
        schemaVersion: 2, state: context.readiness.state, readiness: context.readiness,
        recommendations: [], provenance: 'none', cached: false,
        input_revision: context.inputRevision,
      }), request);
    }
    const { data: dismissed, error: dismissalError } = await supabase
      .from('opportunity_interactions')
      .select('opportunity_id')
      .eq('learner_id', learnerUserId)
      .eq('action', 'dismiss');
    if (dismissalError)
      return apiError(
        503,
        'FEEDBACK_UNAVAILABLE',
        'Recommendation feedback is temporarily unavailable',
        request,
      );
    const dismissedIds = dismissed?.map((d) => d.opportunity_id) || [];

    // The index carries per-vector model/source provenance. Never trust legacy
    // vectors or an operator flag as evidence of compatibility.
    const model = env.MATCHING_EMBEDDING_MODEL;
    if (!model)
      return apiError(
        503,
        'MATCHING_MODEL_UNCONFIGURED',
        'AI recommendations are unavailable while the matching model is being configured.',
        request,
      );
    const initialIndex = await supabase.rpc('job_matching_index_status', {
      p_model: model,
    });
    let indexStatus = initialIndex.data;
    const indexError = initialIndex.error;
    if (
      indexError ||
      !validIndexStatus(indexStatus)
    )
      return apiError(
        503,
        'MATCHING_INDEX_UNAVAILABLE',
        'The AI job index is temporarily unavailable. Please retry.',
        request,
      );
    if (indexStatus.verified < indexStatus.total) {
      try {
        await refreshJobMatchingIndex(supabase, env, model);
      } catch {
        return apiError(
          503,
          'MATCHING_INDEX_UNAVAILABLE',
          'The AI job index could not be updated. Please retry.',
          request,
        );
      }
      const refreshed = await supabase.rpc('job_matching_index_status', {
        p_model: model,
      });
      if (
        refreshed.error ||
        !validIndexStatus(refreshed.data)
      )
        return apiError(
          503,
          'MATCHING_INDEX_UNAVAILABLE',
          'The AI job index is temporarily unavailable. Please retry.',
          request,
        );
      indexStatus = refreshed.data;
    }
    if (indexStatus.verified < indexStatus.total && indexStatus.total === initialIndex.data.total && indexStatus.verified > initialIndex.data.verified) {
      // A bounded repair batch made verified progress. Subsequent ordinary
      // requests can advance it; no background job or learner vector is claimed.
      const latest = await readRecommendationState(supabase, learnerId, learnerUserId, model);
      if (latest.revision !== context.inputRevision) return apiError(409, 'RECOMMENDATIONS_CHANGED', 'Profile changed; please refresh recommendations', request);
      const response = apiSuccess(recommendationEnvelopeSchema.parse({
        schemaVersion: 2, state: 'index_building', readiness: context.readiness,
        recommendations: [], provenance: 'none', cached: false,
        input_revision: context.inputRevision, catalog_revision: latest.catalog_revision,
        retry_after_seconds: 3,
      }), request, 202);
      response.headers.set('Retry-After', '3');
      return response;
    }
    if (indexStatus.verified < indexStatus.total)
      return apiError(
        503,
        'MATCHING_INDEX_BUILDING',
        'AI job recommendations are being prepared. Please retry shortly.',
        request,
      );
    const state = await readRecommendationState(
      supabase,
      learnerId,
      learnerUserId,
      model,
    );
    const current = async (requireVector = false) => {
      const latest = await readRecommendationState(
        supabase,
        learnerId,
        learnerUserId,
        model,
      );
      return (
        latest.revision === state.revision &&
        latest.catalog_revision === state.catalog_revision &&
        (!requireVector || latest.embedding !== null)
      );
    };
    const obsolete = () =>
      apiError(
        409,
        'RECOMMENDATIONS_CHANGED',
        'Profile or catalog changed; please refresh recommendations',
        request,
      );
    if (state.revision !== context.inputRevision) return obsolete();
    const recommendationSuccess = async (data: Record<string, unknown> & { recommendations: unknown[] }) => {
      if (context.preferences?.useVerifiedLearning) await prepareRecommendationLearning(supabase, env, learnerId, learnerUserId, context.preferences);
      // Eligibility may await another service. Fence the response after that
      // await as well, including both profile and catalogue revision changes.
      if (!(await current(true))) return obsolete();
      return apiSuccess(recommendationEnvelopeSchema.parse({ ...data, schemaVersion: 2,
        state: data.recommendations.length ? 'ready' : 'no_matches', readiness: context.readiness,
        input_revision: context.inputRevision, catalog_revision: state.catalog_revision, cached: data.cached === true, source_status: context.sourceStatus,
      }), request);
    };

    // ==================== CACHE CHECK ====================
    if (!forceRefresh) {
      if (state.matches) {
        const cachedMatches = rankRecommendationCandidates(await learningDecisions(
          supabase, env, learnerUserId, learnerId, await hydrateJobs(supabase, state.matches, dismissedIds),
        ), context).slice(0, safeLimit);
        if (!(await current(true))) return obsolete();
        const executionTime = Date.now() - startTime;
        return await recommendationSuccess(
          {
            recommendations: cachedMatches,
            cached: true,
            computed_at: state.computed_at,
            provenance: 'embedding',
            freshness: 'current',
            input_revision: state.revision,
            model,
            preprocessing_version: RECOMMENDATION_PREPROCESSING_VERSION,
            ranking_policy_version: RECOMMENDATION_RANKING_POLICY_VERSION,
            algorithmVersion: state.algorithm_version,
            entityEmbeddingsEnabled: false,
            count: cachedMatches.length,
            totalMatches: cachedMatches.length,
            executionTime,
            message: 'Recommendations retrieved from cache',
          },
        );
      }
      console.log('[RECOMMEND]', { stage: 'cache', outcome: 'miss' });
    } else {
      console.log(`[FORCE REFRESH] Learner ${learnerId} - bypassing cache`);
    }

    // ==================== GET LEARNER PROFILE ====================
    const { data: learner, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('id', learnerId)
      .eq('user_id', learnerUserId)
      .maybeSingle();

    if (learnerError || !learner) {
      console.error('Learner not found:', { learnerId, error: learnerError });
      return apiError(
        503,
        'PROFILE_UNAVAILABLE',
        'Learner profile is temporarily unavailable',
        request,
      );
    }

    // Check if learner has embedding - auto-generate if missing
    let learnerEmbedding = state.embedding;
    if (!learnerEmbedding) {
      try {
        console.log(
          `[AUTO-EMBED] Generating embedding for learner ${learnerId}...`,
        );

        // Build enriched text from learner profile
        const text = context.text;
        // The multi-query builder must observe one unchanged input revision.
        if (!(await current())) return obsolete();
        console.log(
          `[AUTO-EMBED] Built text of length ${text.length} for learner ${learnerId}`,
        );

        // Generate embedding vector
        const embedding = await callEmbeddingWorker(text, env);
        console.log(
          `[AUTO-EMBED] Generated embedding with ${embedding.length} dimensions for learner ${learnerId}`,
        );

        // Persist to database for future requests
        if (
          !(await publishRecommendationVector(
            supabase,
            learnerId,
            learnerUserId,
            state.revision,
            model,
            embedding,
          ))
        )
          return obsolete();
        console.log(
          `[AUTO-EMBED] Successfully saved embedding for learner ${learnerId}`,
        );

        // Use the newly generated embedding
        learnerEmbedding = embedding;
      } catch {
        console.error('[RECOMMEND]', {
          stage: 'vector_generation',
          outcome: 'unavailable',
        });
        return apiError(
          503,
          'EMBEDDING_GENERATION_FAILED',
          'Your AI matching profile could not be prepared. Please retry.',
          request,
        );
      }
    } else {
      console.log(
        `[RECOMMEND] Learner ${learnerId} - using existing embedding`,
      );
    }

    // Rank only jobs whose vectors have the same verified model and unchanged
    // source text. Approved skills, courses, certificates and projects are already
    // included in the current learner profile text; no legacy entity vectors run.
    const algorithmVersion = 'semantic-v3';
    const { data: recommendations, error: matchError } = await supabase.rpc(
      'match_verified_opportunities',
      {
        p_learner_id: learnerId,
        p_user_id: learnerUserId,
        p_model: model,
        p_revision: state.revision,
        p_limit: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS,
      },
    );
    if (matchError || !Array.isArray(recommendations)) {
      console.error('[RECOMMEND]', {
        stage: 'ranking',
        outcome: 'unavailable',
      });
      return apiError(
        503,
        'MATCHING_UNAVAILABLE',
        'AI recommendations are temporarily unavailable. Please retry.',
        request,
      );
    }
    if (!recommendations.length) {
      if (!(await current(true))) return obsolete();
      return await recommendationSuccess(
        {
          recommendations: [],
          provenance: 'embedding',
          freshness: 'current',
          model,
          count: 0,
        },
      );
    }

    // ==================== RESPONSE ENRICHMENT ====================
    const hydrated = await hydrateJobs(supabase, recommendations, dismissedIds);
    const topRecommendations = rankRecommendationCandidates(await learningDecisions(
      supabase, env, learnerUserId, learnerId, hydrated,
    ), context).slice(0, safeLimit);
    const executionTime = Date.now() - startTime;

    // ==================== SAVE TO CACHE ====================
    let cacheSaved = false;
    try {
      const { data: saved, error: saveError } = await supabase.rpc(
        'save_recommendation_matches_v3',
        {
          p_learner_id: learnerId,
          p_user_id: learnerUserId,
          p_revision: state.revision,
          p_catalog_revision: state.catalog_revision,
          p_matches: hydrated,
          p_model: model,
          p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION,
          p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION,
          p_algorithm: algorithmVersion,
        },
      );
      if (!saveError && saved === false) return obsolete();
      cacheSaved = !saveError && saved === true;
      if (!cacheSaved)
        console.error('[RECOMMEND CACHE] Save unavailable', {
          code: saveError?.code,
        });
    } catch (cacheSaveError) {
      console.error('[CACHE SAVE ERROR]', cacheSaveError);
    }

    if (!(await current(true))) return obsolete();

    return await recommendationSuccess(
      {
        recommendations: topRecommendations,
        cached: false,
        cache_saved: cacheSaved,
        provenance: 'embedding',
        freshness: 'current',
        input_revision: state.revision,
        model,
        preprocessing_version: RECOMMENDATION_PREPROCESSING_VERSION,
        ranking_policy_version: RECOMMENDATION_RANKING_POLICY_VERSION,
        computed_at: new Date().toISOString(),
        count: topRecommendations.length,
        totalMatches: hydrated.length,
        executionTime,
        algorithmVersion,
        entityEmbeddingsEnabled: false,
      },
    );
  } catch (error) {
    if (error instanceof LearningError) return apiError(503, 'LEARNING_UNAVAILABLE', 'Learning recommendations are temporarily unavailable.', request);
    if (error instanceof EmbeddingError && error.code === 'CONTEXT_CHANGED') return apiError(
      409, 'RECOMMENDATIONS_CHANGED', 'Profile changed; please refresh recommendations', request,
    );
    console.error('[RECOMMEND] Required dependency unavailable');
    return apiError(
      503,
      'RECOMMENDATIONS_UNAVAILABLE',
      'Recommendations are temporarily unavailable',
      request,
    );
  }
}

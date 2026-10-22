/**
 * Recommend Opportunities Handler - AI-powered job matching
 * 
 * Features:
 * - Embedding-based similarity matching with V2/V1 fallback
 * - Auto-generation of learner embeddings if missing
 * - Entity-level embeddings for certificates, projects, skills
 * - Caching via database RPCs
 * - Dismissal filtering
 * - Fallback to popular opportunities
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isValidUUID } from '../../../lib/validation';
import { checkRateLimit } from '../utils/rate-limit';

import { buildlearnerTextFromDatabase } from '../../embedding/services/textBuilder';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
import { hydrateJobs } from '../../../lib/job-recommendations';
import { readRecommendationState, publishRecommendationVector } from '../utils/recommendation-state';
import { RECOMMENDATION_PREPROCESSING_VERSION, RECOMMENDATION_RANKING_POLICY_VERSION } from '../utils/recommendation-versions';
import { learningDecisions } from '../../../lib/learning-eligibility';

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.01,
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20
};

// ==================== FALLBACK HANDLER ====================

async function getPopularFallback(
  request: Request,
  supabase: SupabaseClient,
  learnerId: string,
  userId: string,
  limit: number,
  startTime: number,
  reason: string,
  dismissedIds: string[] = [],
  env: Record<string,string> = {}
): Promise<Response> {
  try {
    // Availability and dismissals are applied BEFORE LIMIT in this actor-bound
    // RPC. Fetching a limited legacy list and then dropping dismissed IDs can
    // incorrectly turn an available catalog into an empty recommendation feed.
    const { data: popular, error } = await supabase.rpc('get_generic_recommendations_v3', {
      p_learner_id: learnerId, p_user_id: userId, p_limit: limit,
    });

    if (error || !Array.isArray(popular)) throw new Error('GENERIC_RECOMMENDATIONS_UNAVAILABLE');

    const jobs = await hydrateJobs(supabase, popular || [], dismissedIds);
    const executionTime = Date.now() - startTime;
    return apiSuccess({
      recommendations: await learningDecisions(supabase,env,userId,learnerId,jobs),
      fallback: true,
      provenance: 'generic',
      freshness: 'not_personalized',
      reason,
      count: jobs.length,
      executionTime
    }, request);
  } catch (fallbackError) {
    console.error('[RECOMMEND]', {stage:'generic_fallback', outcome:'unavailable'});
    return apiError(503, 'RECOMMENDATIONS_UNAVAILABLE', 'Recommendations are temporarily unavailable', request);
  }
}

// ==================== MAIN HANDLER ====================

export async function handleRecommendOpportunities(
  request: Request,
  env: Record<string, string>,
  authenticatedUserId: string
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
    return apiError(400, 'VALIDATION_ERROR', 'Request body must be an object', request);
  }

  const {
    learnerId: requestedLearnerId,
    forceRefresh = false,
    limit = RECOMMEND_CONFIG.DEFAULT_LIMIT
  } = body as Record<string, unknown>;

  if (typeof requestedLearnerId !== 'string' || !isValidUUID(requestedLearnerId)) {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid learnerId format', request);
  }

  if (typeof forceRefresh !== 'boolean') {
    return apiError(400, 'VALIDATION_ERROR', 'forceRefresh must be a boolean', request);
  }

  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > RECOMMEND_CONFIG.MAX_RECOMMENDATIONS) {
    return apiError(400, 'VALIDATION_ERROR', 'limit must be an integer between 1 and 50', request);
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
      console.error('[RECOMMEND AUTHORIZATION] Learner lookup failed', { code: error.code });
      return apiError(500, 'DATABASE_ERROR', 'Failed to resolve learner profile', request);
    }
    identity = data;
  } catch {
    console.error('[RECOMMEND AUTHORIZATION] Learner lookup unavailable');
    return apiError(500, 'DATABASE_ERROR', 'Failed to resolve learner profile', request);
  }

  if (!identity) {
    return apiError(404, 'NOT_FOUND', 'Learner profile not found', request);
  }

  if (!isValidUUID(identity.id) || typeof identity.user_id !== 'string' || identity.user_id.toLowerCase() !== authenticatedUserId.toLowerCase()) {
    return apiError(500, 'DATABASE_ERROR', 'Failed to resolve learner profile', request);
  }

  // Reject foreign and nonexistent targets alike, before cache or profile work.
  if (requestedLearnerId.toLowerCase() !== identity.id.toLowerCase()) {
    return apiError(403, 'FORBIDDEN', 'Only your own recommendations may be requested', request);
  }

  const learnerId = identity.id;
  // Interactions reference learners.user_id; vectors/cache reference learners.id.
  const learnerUserId = identity.user_id;
  if (env.JOB_MATCHING_ENABLED === 'false') {
    return apiError(503, 'MATCHING_DISABLED', 'Job matching is temporarily unavailable', request);
  }
  if (!await checkRateLimit(`matching:${learnerUserId}`, env as any)) {
    return apiError(429, 'ERROR', 'Rate limit exceeded', request);
  }
  const safeLimit = limit;

  try {
  const { data: dismissed, error: dismissalError } = await supabase
    .from('opportunity_interactions').select('opportunity_id')
    .eq('learner_id', learnerUserId).eq('action', 'dismiss');
  if (dismissalError) return apiError(503, 'FEEDBACK_UNAVAILABLE', 'Recommendation feedback is temporarily unavailable', request);
  const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

  // Do not compare a new-model vector with an unverified legacy vector space.
  // Operators must attest the deployed catalog AND entity-vector provenance.
  const model = env.MATCHING_EMBEDDING_MODEL;
  if (!model || env.MATCHING_CATALOG_MODEL !== model) {
    return getPopularFallback(request, supabase, learnerId, learnerUserId, safeLimit, startTime, 'model_provenance_unverified', dismissedIds,env);
  }
  if (env.MATCHING_VECTOR_PIPELINE_VERIFIED !== 'true') {
    return getPopularFallback(request, supabase, learnerId, learnerUserId, safeLimit, startTime, 'embedding_pipeline_unverified', dismissedIds,env);
  }
  const state = await readRecommendationState(supabase, learnerId, learnerUserId, model);
  const current = async (requireVector = false) => {
    const latest = await readRecommendationState(supabase, learnerId, learnerUserId, model);
    return latest.revision === state.revision && latest.catalog_revision === state.catalog_revision &&
      (!requireVector || latest.embedding !== null);
  };
  const obsolete = () => apiError(409, 'RECOMMENDATIONS_CHANGED', 'Profile or catalog changed; please refresh recommendations', request);

  // ==================== CACHE CHECK ====================
  if (!forceRefresh) {
      if (state.matches) {
        const cachedMatches = (await hydrateJobs(supabase, state.matches, dismissedIds)).slice(0, safeLimit);
        if (!await current(true)) return obsolete();
        const executionTime = Date.now() - startTime;
        return apiSuccess({
          recommendations: await learningDecisions(supabase,env,learnerUserId,learnerId,cachedMatches),
          cached: true,
          computed_at: state.computed_at,
          provenance: 'embedding', freshness: 'current', input_revision: state.revision, model,
          preprocessing_version: RECOMMENDATION_PREPROCESSING_VERSION, ranking_policy_version: RECOMMENDATION_RANKING_POLICY_VERSION,
          algorithmVersion: state.algorithm_version, entityEmbeddingsEnabled: state.algorithm_version === 'v2.0',
          count: cachedMatches.length,
          totalMatches: cachedMatches.length,
          executionTime,
          message: 'Recommendations retrieved from cache'
        }, request);
      }
      console.log('[RECOMMEND]', {stage:'cache',outcome:'miss'});
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
    return apiError(503, 'PROFILE_UNAVAILABLE', 'Learner profile is temporarily unavailable', request);
  }

  // Check if learner has embedding - auto-generate if missing
  let learnerEmbedding = state.embedding;
  if (!learnerEmbedding) {
    try {
      console.log(`[AUTO-EMBED] Generating embedding for learner ${learnerId}...`);
      
      // Build enriched text from learner profile
      const text = await buildlearnerTextFromDatabase(supabase, learnerId);
      // The multi-query builder must observe one unchanged input revision.
      if (!await current()) return obsolete();
      console.log(`[AUTO-EMBED] Built text of length ${text.length} for learner ${learnerId}`);
      
      // Generate embedding vector
      const embedding = await callEmbeddingWorker(text, env);
      console.log(`[AUTO-EMBED] Generated embedding with ${embedding.length} dimensions for learner ${learnerId}`);
      
      // Persist to database for future requests
      if (!await publishRecommendationVector(supabase, learnerId, learnerUserId, state.revision, model, embedding)) return obsolete();
      console.log(`[AUTO-EMBED] Successfully saved embedding for learner ${learnerId}`);
      
      // Use the newly generated embedding
      learnerEmbedding = embedding;
    } catch (error) {
      console.error('[RECOMMEND]', {stage:'vector_generation',outcome:'unavailable'});
      return await getPopularFallback(request, supabase, learnerId, learnerUserId, safeLimit, startTime, 'embedding_generation_failed', dismissedIds,env);
    }
  } else {
    console.log(`[RECOMMEND] Learner ${learnerId} - using existing embedding`);
  }

  // ==================== GET DISMISSED OPPORTUNITIES ====================

  // ==================== HYBRID MATCHING (V2/V1) ====================
  let recommendations: any[] | null = null;
  let matchError: any = null;
  let algorithmVersion = 'v2.0';

  // Try V2 matching first (with entity-level scoring)
  const { data: v2Recommendations, error: v2MatchError } = await supabase.rpc('match_opportunities_enhanced_v2', {
    query_embedding: learnerEmbedding,
    learner_id_param: learnerId,
    dismissed_ids: dismissedIds,
    match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
    match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
  });

  if (!v2MatchError && v2Recommendations && v2Recommendations.length > 0) {
    recommendations = v2Recommendations;
    console.log(`[MATCH V2] Learner ${learnerId} - using entity-level scoring`);
  } else {
    // Fallback to V1 matching
    console.log(`[MATCH V1 FALLBACK] V2 error or no results, trying V1 for learner ${learnerId}`);
    algorithmVersion = 'v1.0';
    
    const { data: v1Recommendations, error: v1MatchError } = await supabase.rpc('match_opportunities_enhanced', {
      query_embedding: learnerEmbedding,
      learner_id_param: learnerId,
      dismissed_ids: dismissedIds,
      match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
      match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
    });
    
    recommendations = v1Recommendations;
    matchError = v1MatchError;
  }

  if (matchError) {
    console.error('[RECOMMEND]', {stage:'ranking',outcome:'unavailable'});
    return await getPopularFallback(request, supabase, learnerId, learnerUserId, safeLimit, startTime, 'match_error', dismissedIds,env);
  }

  if (!recommendations || recommendations.length === 0) {
    return await getPopularFallback(request, supabase, learnerId, learnerUserId, safeLimit, startTime, 'no_matches', dismissedIds,env);
  }

  // ==================== RESPONSE ENRICHMENT ====================
  const enrichedRecommendations = recommendations.map(rec => ({
    ...rec,
    match_breakdown: rec.certificate_match_score !== undefined ? {
      profile_similarity: Math.round((rec.similarity || 0) * 100),
      skill_match: Math.round((rec.skill_match_score || 0) * 100),
      certificate_relevance: Math.round((rec.certificate_match_score || 0) * 100),
      project_relevance: Math.round((rec.project_match_score || 0) * 100)
    } : undefined
  }));

  const hydrated = await hydrateJobs(supabase, enrichedRecommendations, dismissedIds);
  const topRecommendations = hydrated.slice(0, safeLimit);
  const executionTime = Date.now() - startTime;

  // ==================== SAVE TO CACHE ====================
  let cacheSaved = false;
  try {
    const { data: saved, error: saveError } = await supabase.rpc('save_recommendation_matches_v3', {
      p_learner_id: learnerId,
      p_user_id: learnerUserId, p_revision: state.revision, p_catalog_revision: state.catalog_revision,
      p_matches: hydrated, p_model: model,
      p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION, p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION,
      p_algorithm: algorithmVersion,
    });
    if (!saveError && saved === false) return obsolete();
    cacheSaved = !saveError && saved === true;
    if (!cacheSaved) console.error('[RECOMMEND CACHE] Save unavailable', { code: saveError?.code });
  } catch (cacheSaveError) {
    console.error('[CACHE SAVE ERROR]', cacheSaveError);
  }

  if (!await current(true)) return obsolete();

  return apiSuccess({
    recommendations: await learningDecisions(supabase,env,learnerUserId,learnerId,topRecommendations),
    cached: false,
    cache_saved: cacheSaved,
    provenance: 'embedding', freshness: 'current', input_revision: state.revision, model,
    preprocessing_version: RECOMMENDATION_PREPROCESSING_VERSION, ranking_policy_version: RECOMMENDATION_RANKING_POLICY_VERSION,
    computed_at: new Date().toISOString(),
    count: topRecommendations.length,
    totalMatches: hydrated.length,
    executionTime,
    algorithmVersion,
    entityEmbeddingsEnabled: algorithmVersion === 'v2.0'
  }, request);
  } catch {
    console.error('[RECOMMEND] Required dependency unavailable');
    return apiError(503, 'RECOMMENDATIONS_UNAVAILABLE', 'Recommendations are temporarily unavailable', request);
  }
}

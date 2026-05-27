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

import { jsonResponse } from '../../../../src/functions-lib/response';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID } from '../../lib/validation';
import { checkRateLimit } from '../utils/rate-limit';
import { getOpenRouterKey } from '../[[path]]';
import { API_CONFIG, AI_MODELS } from '../../shared/ai-config';
import { buildlearnerTextFromDatabase } from '../../embedding/services/textBuilder';
import { callEmbeddingWorker } from '../../embedding/services/embeddingWorkerClient';
import { updateEmbedding } from '../../embedding/services/databaseUpdater';

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.01,
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20
};

// ==================== FALLBACK HANDLER ====================

async function getPopularFallback(
  supabase: SupabaseClient,
  learnerId: string,
  limit: number,
  startTime: number,
  reason: string
): Promise<Response> {
  try {
    const { data: popular, error } = await supabase.rpc('get_popular_opportunities', {
      learner_id_param: learnerId,
      limit_count: limit
    });

    if (error) throw error;

    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: popular || [],
      fallback: true,
      reason,
      count: popular?.length || 0,
      executionTime
    });
  } catch (fallbackError) {
    console.error('Fallback failed:', fallbackError);
    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: [],
      fallback: true,
      reason,
      count: 0,
      executionTime
    });
  }
}

// ==================== MAIN HANDLER ====================

export async function handleRecommendOpportunities(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  let body: { learnerId?: string; forceRefresh?: boolean; limit?: number };
  try {
    body = await request.json() as { learnerId?: string; forceRefresh?: boolean; limit?: number };
  } catch {
    return jsonResponse({ error: 'Invalid JSON', recommendations: [] }, 400);
  }

  const { learnerId, forceRefresh = false, limit = RECOMMEND_CONFIG.DEFAULT_LIMIT } = body;
  
  if (!learnerId) {
    return jsonResponse({ error: 'learnerId is required', recommendations: [] }, 400);
  }

  if (!isValidUUID(learnerId)) {
    return jsonResponse({ error: 'Invalid learnerId format', recommendations: [] }, 400);
  }

  if (!await checkRateLimit(learnerId, env as any)) {
    return jsonResponse({ error: 'Rate limit exceeded', recommendations: [] }, 429);
  }

  const safeLimit = Math.min(Math.max(1, limit), RECOMMEND_CONFIG.MAX_RECOMMENDATIONS);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // ==================== CACHE CHECK ====================
  if (!forceRefresh) {
    try {
      const { data: cacheResult, error: cacheError } = await supabase
        .rpc('get_cached_job_matches', { p_learner_id: learnerId });
      
      if (!cacheError && cacheResult && cacheResult.length > 0 && cacheResult[0].is_cached) {
        const cached = cacheResult[0];
        const executionTime = Date.now() - startTime;
        console.log(`[CACHE HIT] Learner ${learnerId} - ${cached.match_count} matches from cache`);
        
        const cachedMatches = (cached.matches || []).slice(0, safeLimit);
        return jsonResponse({
          recommendations: cachedMatches,
          cached: true,
          computed_at: cached.computed_at,
          count: cachedMatches.length,
          totalMatches: cached.match_count,
          executionTime,
          message: 'Recommendations retrieved from cache'
        });
      }
      console.log(`[CACHE MISS] Learner ${learnerId} - computing fresh matches`);
    } catch (cacheCheckError) {
      console.error('[CACHE CHECK ERROR]', cacheCheckError);
    }
  } else {
    console.log(`[FORCE REFRESH] Learner ${learnerId} - bypassing cache`);
  }

  // ==================== GET LEARNER PROFILE ====================
  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select('embedding, id, name')
    .eq('id', learnerId)
    .maybeSingle();

  console.log('Learner query result:', { 
    learner: learner ? { id: learner.id, name: learner.name, hasEmbedding: !!learner.embedding } : null, 
    error: learnerError 
  });

  if (learnerError || !learner) {
    console.error('Learner not found:', { learnerId, error: learnerError });
    return await getPopularFallback(supabase, learnerId, safeLimit, startTime, 'no_profile');
  }

  // Check if learner has embedding - auto-generate if missing
  let learnerEmbedding = learner.embedding;
  if (!learnerEmbedding) {
    try {
      console.log(`[AUTO-EMBED] Generating embedding for learner ${learnerId}...`);
      
      // Build enriched text from learner profile
      const text = await buildlearnerTextFromDatabase(supabase, learnerId);
      console.log(`[AUTO-EMBED] Built text of length ${text.length} for learner ${learnerId}`);
      
      // Generate embedding vector
      const embedding = await callEmbeddingWorker(text, env);
      console.log(`[AUTO-EMBED] Generated embedding with ${embedding.length} dimensions for learner ${learnerId}`);
      
      // Persist to database for future requests
      await updateEmbedding(supabase, 'learners', learnerId, embedding);
      console.log(`[AUTO-EMBED] Successfully saved embedding for learner ${learnerId}`);
      
      // Use the newly generated embedding
      learnerEmbedding = embedding;
    } catch (error) {
      console.error(`[AUTO-EMBED] Failed for learner ${learnerId}:`, error);
      return await getPopularFallback(supabase, learnerId, safeLimit, startTime, 'embedding_generation_failed');
    }
  } else {
    console.log(`[RECOMMEND] Learner ${learnerId} - using existing embedding`);
  }

  // ==================== GET DISMISSED OPPORTUNITIES ====================
  const { data: dismissed } = await supabase
    .from('opportunity_interactions')
    .select('opportunity_id')
    .eq('learner_id', learnerId)
    .eq('action', 'dismiss');

  const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

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
    console.error('Match error:', matchError);
    return await getPopularFallback(supabase, learnerId, safeLimit, startTime, 'match_error');
  }

  if (!recommendations || recommendations.length === 0) {
    return await getPopularFallback(supabase, learnerId, safeLimit, startTime, 'no_matches');
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

  const topRecommendations = enrichedRecommendations.slice(0, safeLimit);
  const executionTime = Date.now() - startTime;

  // ==================== SAVE TO CACHE ====================
  try {
    await supabase.rpc('save_job_matches_cache', {
      p_learner_id: learnerId,
      p_matches: enrichedRecommendations,
      p_algorithm_version: algorithmVersion
    });
    console.log(`[CACHE SAVE] Learner ${learnerId} - saved ${recommendations.length} matches to cache (${algorithmVersion})`);
  } catch (cacheSaveError) {
    console.error('[CACHE SAVE ERROR]', cacheSaveError);
  }

  return jsonResponse({
    recommendations: topRecommendations,
    cached: false,
    computed_at: new Date().toISOString(),
    count: topRecommendations.length,
    totalMatches: recommendations.length,
    executionTime,
    algorithmVersion,
    entityEmbeddingsEnabled: algorithmVersion === 'v2.0'
  });
}

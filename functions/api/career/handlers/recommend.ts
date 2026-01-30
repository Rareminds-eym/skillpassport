/**
 * Recommend Opportunities Handler - AI-powered job matching
 * 
 * Features:
 * - Embedding-based similarity matching
 * - Auto-generation of student embeddings if missing
 * - Caching of recommendations
 * - Fallback to popular opportunities
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { createClient } from '@supabase/supabase-js';
import { isValidUUID } from '../../shared/auth';
import { checkRateLimit } from '../utils/rate-limit';

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.01,
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20,
  CACHE_DURATION_HOURS: 24
};

export async function handleRecommendOpportunities(request: Request, env: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  let body: { studentId?: string; forceRefresh?: boolean; limit?: number };
  try {
    body = await request.json() as { studentId?: string; forceRefresh?: boolean; limit?: number };
  } catch {
    return jsonResponse({ error: 'Invalid JSON', recommendations: [] }, 400);
  }

  const { studentId, forceRefresh = false, limit = RECOMMEND_CONFIG.DEFAULT_LIMIT } = body;
  
  if (!studentId) {
    return jsonResponse({ error: 'studentId is required', recommendations: [] }, 400);
  }

  if (!isValidUUID(studentId)) {
    return jsonResponse({ error: 'Invalid studentId format', recommendations: [] }, 400);
  }

  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded', recommendations: [] }, 429);
  }

  const safeLimit = Math.min(Math.max(1, limit), RECOMMEND_CONFIG.MAX_RECOMMENDATIONS);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Step 1: Check cache unless force refresh
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('recommendation_cache')
        .select('recommendations, created_at')
        .eq('student_id', studentId)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached?.recommendations) {
        const recommendations = Array.isArray(cached.recommendations) 
          ? cached.recommendations.slice(0, safeLimit)
          : [];
        
        return jsonResponse({
          recommendations,
          cached: true,
          computed_at: cached.created_at,
          count: recommendations.length
        });
      }
    }

    // Step 2: Get student embedding
    const { data: student } = await supabase
      .from('students')
      .select('embedding')
      .eq('id', studentId)
      .single();

    if (!student?.embedding) {
      // No embedding - return popular opportunities as fallback
      const { data: popular, error: popularError } = await supabase
        .rpc('get_popular_opportunities', { 
          student_id_param: studentId,
          limit_count: safeLimit 
        });

      if (popularError) {
        console.error('Error fetching popular opportunities:', popularError);
        return jsonResponse({ 
          error: 'Failed to fetch recommendations',
          recommendations: []
        }, 500);
      }

      return jsonResponse({
        recommendations: popular || [],
        cached: false,
        fallback: 'popular',
        message: 'Student profile embedding not yet generated. Showing popular opportunities.',
        count: popular?.length || 0
      });
    }

    // Step 3: Run enhanced matching
    const { data: matches, error: matchError } = await supabase
      .rpc('match_opportunities_enhanced', {
        query_embedding: student.embedding,
        student_id_param: studentId,
        match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
        match_count: safeLimit
      });

    if (matchError) {
      console.error('Error matching opportunities:', matchError);
      
      // Fallback to popular opportunities
      const { data: popular } = await supabase
        .rpc('get_popular_opportunities', { 
          student_id_param: studentId,
          limit_count: safeLimit 
        });

      return jsonResponse({
        recommendations: popular || [],
        cached: false,
        fallback: 'popular',
        error: 'Matching failed, showing popular opportunities',
        count: popular?.length || 0
      });
    }

    const recommendations = matches || [];

    // Step 4: Save to cache (fire and forget)
    if (recommendations.length > 0) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + RECOMMEND_CONFIG.CACHE_DURATION_HOURS);

      // Fire and forget - don't await
      void supabase
        .from('recommendation_cache')
        .upsert({
          student_id: studentId,
          recommendations,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    return jsonResponse({
      recommendations,
      cached: false,
      computed_at: new Date().toISOString(),
      count: recommendations.length
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return jsonResponse({
      error: 'Internal server error',
      recommendations: []
    }, 500);
  }
}

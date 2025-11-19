import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration
const CONFIG = {
  CACHE_DURATION_HOURS: 6,
  DEFAULT_MATCH_COUNT: 20,
  MATCH_THRESHOLD: 0.20, // Lowered to 0.20 to show more results (was 0.30)
  MAX_RECOMMENDATIONS: 50,
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
};

// In-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a student
 */
function checkRateLimit(studentId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(studentId);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(studentId, {
      count: 1,
      resetTime: now + CONFIG.RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (record.count >= CONFIG.RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          recommendations: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const { studentId, forceRefresh = false, limit = CONFIG.DEFAULT_MATCH_COUNT } = body;

    // Validate studentId
    if (!studentId) {
      return new Response(
        JSON.stringify({ 
          error: 'studentId is required',
          recommendations: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!isValidUUID(studentId)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid studentId format',
          recommendations: [] 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Check rate limit
    const rateCheck = checkRateLimit(studentId);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          retryAfter: rateCheck.retryAfter,
          recommendations: [] 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateCheck.retryAfter)
          },
          status: 429 
        }
      );
    }

    console.log(`📊 Getting recommendations for student: ${studentId}`);

    // Validate limit parameter
    const safeLimit = Math.min(Math.max(1, limit), CONFIG.MAX_RECOMMENDATIONS);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Caching disabled - always fetch fresh recommendations

    // Get student profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('embedding, id, name, profile')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.log('⚠️ Student not found, using popular fallback');
      
      // Fallback: return popular opportunities
      try {
        const { data: popular, error: popularError } = await supabase.rpc('get_popular_opportunities', {
          student_id_param: studentId,
          limit_count: safeLimit
        });

        if (popularError) throw popularError;

        const executionTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({ 
            recommendations: popular || [],
            fallback: true,
            reason: 'no_profile',
            count: popular?.length || 0,
            executionTime
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error('❌ Fallback failed:', fallbackError);
        return new Response(
          JSON.stringify({ 
            error: 'Student not found and fallback failed',
            recommendations: [],
            fallback: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404
          }
        );
      }
    }

    // If no embedding, use popular opportunities
    if (!student.embedding) {
      console.log('⚠️ No student embedding, using popular fallback');
      
      try {
        const { data: popular, error: popularError } = await supabase.rpc('get_popular_opportunities', {
          student_id_param: studentId,
          limit_count: safeLimit
        });

        if (popularError) throw popularError;

        const executionTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({ 
            recommendations: popular || [],
            fallback: true,
            reason: 'no_embedding',
            count: popular?.length || 0,
            executionTime
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error('❌ Popular fallback failed:', fallbackError);
        return new Response(
          JSON.stringify({ 
            error: 'No embedding available and fallback failed',
            recommendations: [],
            fallback: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
      }
    }

    // Get dismissed opportunities
    const { data: dismissed } = await supabase
      .from('opportunity_interactions')
      .select('opportunity_id')
      .eq('student_id', studentId)
      .eq('action', 'dismiss');

    const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

    console.log(`🔍 Running enhanced matching with skill scoring (dismissed: ${dismissedIds.length})`);

    // Run enhanced matching (vector similarity + skill matching)
    const { data: recommendations, error: matchError } = await supabase.rpc('match_opportunities_enhanced', {
      query_embedding: student.embedding,
      student_id_param: studentId,
      dismissed_ids: dismissedIds,
      match_threshold: CONFIG.MATCH_THRESHOLD,
      match_count: CONFIG.MAX_RECOMMENDATIONS
    });

    if (matchError) {
      console.error('❌ Match error:', matchError);
      throw matchError;
    }

    // Debug: Check if final_score is in the response
    if (recommendations && recommendations.length > 0) {
      console.log('🔍 First recommendation keys:', Object.keys(recommendations[0]));
      console.log('🔍 Has final_score?', 'final_score' in recommendations[0]);
      console.log('🔍 Final score:', recommendations[0].final_score);
      console.log('🔍 Skill match:', recommendations[0].skill_match_score);
    }

    if (!recommendations || recommendations.length === 0) {
      console.log('⚠️ No vector matches found, trying popular fallback');
      
      try {
        const { data: popular, error: popularError } = await supabase.rpc('get_popular_opportunities', {
          student_id_param: studentId,
          limit_count: safeLimit
        });

        if (popularError) throw popularError;

        const executionTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({ 
            recommendations: popular || [],
            fallback: true,
            reason: 'no_matches',
            count: popular?.length || 0,
            executionTime
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (fallbackError) {
        console.error('❌ Fallback failed:', fallbackError);
        const executionTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({ 
            recommendations: [],
            fallback: true,
            reason: 'no_matches',
            count: 0,
            executionTime
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Take top N recommendations based on limit
    const topRecommendations = recommendations.slice(0, safeLimit);

    console.log(`✅ Found ${topRecommendations.length} recommendations`);

    // Caching disabled

    const executionTime = Date.now() - startTime;
    console.log(`✅ Request completed in ${executionTime}ms`);

    return new Response(
      JSON.stringify({ 
        recommendations: topRecommendations,
        cached: false,
        count: topRecommendations.length,
        totalMatches: recommendations.length,
        executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Unexpected error:', error);
    
    // Log detailed error for debugging
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      executionTime
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        recommendations: [],
        fallback: true,
        executionTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});


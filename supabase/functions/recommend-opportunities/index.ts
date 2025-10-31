import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { studentId, forceRefresh = false } = await req.json();

    if (!studentId) {
      throw new Error('studentId is required');
    }

    console.log(`📊 Getting recommendations for student: ${studentId}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('recommendation_cache')
        .select('recommendations, expires_at')
        .eq('student_id', studentId)
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        console.log('✅ Returning cached recommendations');
        return new Response(
          JSON.stringify({ 
            recommendations: cached.recommendations,
            cached: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get student profile
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.log('⚠️ Student not found or no profile, using popular fallback');
      
      // Fallback: return popular opportunities
      const { data: popular } = await supabase.rpc('get_popular_opportunities', {
        student_id_param: studentId,
        limit_count: 20
      });

      return new Response(
        JSON.stringify({ 
          recommendations: popular || [],
          fallback: true,
          reason: 'no_profile'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no embedding, use popular opportunities
    if (!student.embedding) {
      console.log('⚠️ No student embedding, using popular fallback');
      
      const { data: popular } = await supabase.rpc('get_popular_opportunities', {
        student_id_param: studentId,
        limit_count: 20
      });

      return new Response(
        JSON.stringify({ 
          recommendations: popular || [],
          fallback: true,
          reason: 'no_embedding'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get dismissed opportunities
    const { data: dismissed } = await supabase
      .from('opportunity_interactions')
      .select('opportunity_id')
      .eq('student_id', studentId)
      .eq('action', 'dismiss');

    const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

    console.log(`🔍 Running vector similarity search (dismissed: ${dismissedIds.length})`);

    // Run vector similarity search
    const { data: recommendations, error: matchError } = await supabase.rpc('match_opportunities', {
      query_embedding: student.embedding,
      student_id_param: studentId,
      dismissed_ids: dismissedIds,
      match_threshold: 0.60,
      match_count: 50
    });

    if (matchError) {
      console.error('Match error:', matchError);
      throw matchError;
    }

    // Take top 20 recommendations
    const topRecommendations = (recommendations || []).slice(0, 20);

    console.log(`✅ Found ${topRecommendations.length} recommendations`);

    // Cache the results (expire in 6 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 6);

    await supabase
      .from('recommendation_cache')
      .upsert({
        student_id: studentId,
        recommendations: topRecommendations,
        expires_at: expiresAt.toISOString()
      });

    return new Response(
      JSON.stringify({ 
        recommendations: topRecommendations,
        cached: false,
        count: topRecommendations.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        recommendations: [],
        fallback: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});


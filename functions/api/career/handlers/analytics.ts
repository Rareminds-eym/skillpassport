import { createSupabaseAdminClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleSaveReadinessScore(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as any;
    const supabase = createSupabaseAdminClient(env);
    const { error } = await supabase.from('career_readiness_scores').insert({
      learner_id: userId,
      overall_score: body.overall_score,
      profile_completeness: body.profileCompleteness,
      skills_marketability: body.skillsMarketability,
      experience_level: body.experienceLevel,
      project_quality: body.projectQuality,
      learning_consistency: body.learningConsistency,
      breakdown: body.breakdown,
      recommendations: body.recommendations,
    });

    if (error) throw error;
    return apiSuccess({ saved: true }, request, 201);
  } catch (error) {
    console.error('[ERROR] readiness-score:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to save readiness score', request);
  }
}

export async function handleSaveProfileHealth(env: any, userId: string, request: Request): Promise<Response> {
  try {
    const body = await request.json() as any;
    const supabase = createSupabaseAdminClient(env);
    const { error } = await supabase.from('profile_health_analysis').insert({
      learner_id: userId,
      completeness_score: body.completeness_score,
      missing_sections: body.missing_sections,
      weak_sections: body.weak_sections,
      improvement_suggestions: body.improvement_suggestions,
      estimated_impact: body.estimated_impact,
    });

    if (error) throw error;
    return apiSuccess({ saved: true }, request, 201);
  } catch (error) {
    console.error('[ERROR] profile-health:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to save profile health', request);
  }
}

export async function handleGetPeerBenchmarks(env: any, request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const cohort = url.searchParams.get('cohort') || '';
    if (!cohort) return apiSuccess(null, request);

    const supabase = createSupabaseAdminClient(env);
    const { data, error } = await supabase
      .from('peer_benchmarks')
      .select('*')
      .eq('cohort', cohort)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return apiSuccess(null, request);
    return apiSuccess(data, request);
  } catch (error) {
    console.error('[ERROR] peer-benchmarks:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to fetch peer benchmarks', request);
  }
}

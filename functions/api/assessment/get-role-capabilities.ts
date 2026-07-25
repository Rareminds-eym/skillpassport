import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', context.request, { startTime });
  }

  const { roleId, learnerId, assessmentResultId } = body;

  // Validate inputs
  if (!roleId || !learnerId || !assessmentResultId) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing roleId, learnerId, or assessmentResultId', context.request, { startTime });
  }

  try {
    console.log(`[get-role-capabilities] Fetching for role=${roleId}, learner=${learnerId}`);

    // Step 1: Check if capabilities already cached in DB for this role
    const { data: cachedCaps, error: cacheError } = await supabase
      .from('learner_course_recommendations')
      .select('course_id, capability_id, capability_name, capability_code, capability_description, role_id, match_reasons, skill_gaps_addressed, relevance_score')
      .eq('learner_id', learnerId)
      .eq('role_id', roleId)
      .eq('assessment_result_id', assessmentResultId)
      .eq('status', 'active')
      .order('relevance_score', { ascending: false });

    // If found in cache, return immediately
    if (!cacheError && cachedCaps && cachedCaps.length > 0) {
      console.log(`[get-role-capabilities] Found ${cachedCaps.length} cached capabilities`);
      return apiSuccess(
        cachedCaps.map((cap: any) => ({
          id: cap.capability_id || cap.course_id,
          name: cap.capability_name || cap.match_reasons?.[0] || 'Learning Path',
          code: cap.capability_code || '',
          description: cap.capability_description || cap.match_reasons?.[1] || cap.skill_gaps_addressed?.[0] || ''
        })),
        context.request,
        { startTime }
      );
    }

    console.log(`[get-role-capabilities] Cache miss - fetching from LTE`);

    // Step 2: Not cached - fetch from LTE
    const lteUrl = env.LTE_API_URL;
    const response = await fetch(`${lteUrl}/api/v1/capabilities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[get-role-capabilities] LTE error: ${errorText.substring(0, 200)}`);
      return apiError(502, 'LTE_ERROR', `LTE API returned ${response.status}`, context.request, { startTime });
    }

    const lteResponse = await response.json() as any;

    if (!lteResponse.success || !lteResponse.capabilities || !Array.isArray(lteResponse.capabilities)) {
      console.log(`[get-role-capabilities] No capabilities found from LTE for role=${roleId}`);
      return apiSuccess([], context.request, { startTime });
    }

    const capabilities = lteResponse.capabilities;
    console.log(`[get-role-capabilities] Got ${capabilities.length} capabilities from LTE`);

    // Step 3: Save to DB for future caching
    const recommendations = capabilities.map((cap: any, idx: number) => ({
      learner_id: learnerId,
      course_id: null,
      role_id: roleId,
      assessment_result_id: assessmentResultId,
      relevance_score: 100 - (idx * 5),
      match_reasons: [cap.name, cap.description || ''].filter(Boolean),
      skill_gaps_addressed: [cap.code || cap.name],
      recommendation_type: 'assessment',
      status: 'active',
      recommended_at: new Date().toISOString(),
      capability_id: cap.id,
      capability_name: cap.name,
      capability_code: cap.code || '',
      capability_description: cap.description || '',
      cached_at: new Date().toISOString()
    }));

    const { error: saveError } = await supabase
      .from('learner_course_recommendations')
      .upsert(recommendations, {
        onConflict: 'learner_id,capability_id,role_id,assessment_result_id',
        ignoreDuplicates: false
      });

    if (saveError) {
      console.warn(`[get-role-capabilities] Warning - failed to cache: ${saveError.message}`);
    } else {
      console.log(`[get-role-capabilities] Successfully cached ${recommendations.length} capabilities`);
    }

    // Step 4: Return to frontend
    return apiSuccess(
      capabilities.map((cap: any) => ({
        id: cap.id,
        name: cap.name,
        code: cap.code,
        description: cap.description
      })),
      context.request,
      { startTime }
    );
  } catch (error: any) {
    console.error('[get-role-capabilities] Error:', error?.message || error);
    return apiError(500, 'INTERNAL_ERROR', error?.message || 'Failed to fetch capabilities', context.request, { startTime });
  }
});

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { Env } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';
import { fetchLteRoleCapabilities } from '../../../lib/lte-client';

const trimmed = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** The columns this handler reads from learner_course_recommendations. */
interface CachedRecommendationRow {
  course_id: string | null;
  capability_id: string | null;
  capability_name: string | null;
  capability_code: string | null;
  capability_description: string | null;
  match_reasons?: string[] | null;
  skill_gaps_addressed?: string[] | null;
}

/**
 * Resolves cached capability rows to learner-facing names at read time.
 *
 * The cached `capability_name` (original LTE name) is never read for display and never
 * modified. Each capability row is matched to an LTE capability by `capability_code`
 * (unique in LTE) and shown with LTE's `displayName`. There is no fallback to the original
 * name: a row with no match, a blank code, or no display name is omitted, and so are all
 * capability rows when LTE cannot be reached.
 *
 * Rows without a `capability_id` are not LTE capabilities (older course-recommendation rows)
 * and keep their existing shape.
 */
async function resolveCachedCapabilities(env: Env, roleId: string, cachedCaps: CachedRecommendationRow[]) {
  const isCapabilityRow = (row: CachedRecommendationRow) => Boolean(row.capability_id);

  let displayNameByCode: Map<string, string> | null = null;
  if (cachedCaps.some(isCapabilityRow)) {
    const lte = await fetchLteRoleCapabilities(env, roleId);
    if (lte.ok) {
      displayNameByCode = new Map();
      for (const cap of lte.capabilities) {
        const code = trimmed(cap.code);
        const displayName = trimmed(cap.displayName);
        if (code && displayName) displayNameByCode.set(code, displayName);
      }
    } else {
      console.error(`[get-role-capabilities] LTE fetch failed (${lte.reason}) - cached capability rows omitted`);
    }
  }

  const results: Array<{ id: string | null; name: string; code: string; description: string }> = [];
  for (const row of cachedCaps) {
    if (!isCapabilityRow(row)) {
      results.push({
        id: row.capability_id || row.course_id,
        name: row.capability_name || row.match_reasons?.[0] || 'Learning Path',
        code: row.capability_code || '',
        description: row.capability_description || row.match_reasons?.[1] || row.skill_gaps_addressed?.[0] || ''
      });
      continue;
    }

    const displayName = displayNameByCode?.get(trimmed(row.capability_code));
    if (!displayName) {
      if (displayNameByCode) {
        console.warn(`[get-role-capabilities] No display name from LTE for cached capability code="${row.capability_code ?? ''}" - omitted`);
      }
      continue;
    }
    results.push({
      id: row.capability_id,
      name: displayName,
      code: row.capability_code || '',
      description: row.capability_description || row.match_reasons?.[1] || row.skill_gaps_addressed?.[0] || ''
    });
  }
  return results;
}

export async function getRoleCapabilitiesHandler(context: AuthenticatedContext<Env>) {
  const env = context.env;
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

    // If found in cache, show LTE display names (cached rows are read, never modified)
    if (!cacheError && cachedCaps && cachedCaps.length > 0) {
      console.log(`[get-role-capabilities] Found ${cachedCaps.length} cached capabilities`);
      return apiSuccess(
        await resolveCachedCapabilities(env, roleId, cachedCaps),
        context.request,
        { startTime }
      );
    }

    console.log(`[get-role-capabilities] Cache miss - fetching from LTE`);

    // Step 2: Not cached - fetch from LTE (with timeout + graceful fallback, never 502 to browser)
    const lteResult = await fetchLteRoleCapabilities(env, roleId);
    if (!lteResult.ok) {
      console.error(`[get-role-capabilities] LTE fetch failed (${lteResult.reason}) - returning empty for RAG fallback`);
      return apiSuccess([], context.request, { startTime });
    }

    const capabilities = lteResult.capabilities;
    if (capabilities.length === 0) {
      console.log(`[get-role-capabilities] No capabilities found from LTE for role=${roleId}`);
      return apiSuccess([], context.request, { startTime });
    }
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

    // Step 4: Return to frontend with LTE's display name. The original name stays in the cache above.
    // A capability with no display name is omitted - never shown with the original name.
    return apiSuccess(
      capabilities.flatMap((cap) => {
        const displayName = trimmed(cap.displayName);
        if (!displayName) {
          console.warn(`[get-role-capabilities] No display name from LTE for capability code="${cap.code ?? ''}" - omitted`);
          return [];
        }
        return [{
          id: cap.id,
          name: displayName,
          code: cap.code,
          description: cap.description
        }];
      }),
      context.request,
      { startTime }
    );
  } catch (error: any) {
    console.error('[get-role-capabilities] Error:', error?.message || error);
    return apiError(500, 'INTERNAL_ERROR', error?.message || 'Failed to fetch capabilities', context.request, { startTime });
  }
}

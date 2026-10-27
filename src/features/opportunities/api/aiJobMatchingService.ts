import { ssoClient } from '@/shared/api/ssoClient';

import { getApiUrl } from '@/shared/api/apiUtils';

interface LearnerMatchingProfile {
  id?: string;
  learner_id?: string;
}
interface MatchingCriterion {
  status: string;
  mandatory?: boolean;
  capabilityName: string;
  levelNumber: number;
}
interface RankedOpportunity extends Record<string, unknown> {
  id: string;
  job_title?: string;
  title?: string;
  company_name?: string;
  company?: string;
  match_percentage?: number;
  similarity?: number;
  learning_eligibility?: { criteria?: MatchingCriterion[] };
}
interface MatchingResponse {
  success?: boolean;
  data?: {
    recommendations?: RankedOpportunity[];
    fallback?: boolean;
    provenance?: string;
    reason?: string;
    freshness?: string;
    cached?: boolean;
    computed_at?: string;
  };
  error?: string | { message?: string; code?: string };
  code?: string;
}

/**
 * Match learner profile with opportunities using AI
 * Results are cached in the database and only recomputed when:
 * - Learner profile data changes (skills, interests, etc.)
 * - Course enrollments change
 * - Training records change
 * - Opportunities catalog changes
 * - Cache expires (24 hours)
 * - Force refresh is requested
 *
 * NOTE: The API queries opportunities directly from the database using
 * vector similarity search for better performance.
 * NOTE: The API auto-generates learner embeddings if missing.
 *
 * @param {Object} learnerProfile - Learner profile data
 * @param {number} topN - Number of top matches to return (default: 3)
 * @param {boolean} forceRefresh - Force recomputation even if cache is valid
 * @returns {Promise<Array>} Top N matched jobs with scores and reasons
 */
export async function matchJobsWithAI(
  learnerProfile: LearnerMatchingProfile,
  topN = 3,
  forceRefresh = false,
) {
  if (!learnerProfile) {
    throw new Error('Learner profile is required');
  }

  const API_URL = getApiUrl('career');

  const token = ssoClient.getAccessToken();

  const learnerId = learnerProfile?.id || learnerProfile?.learner_id;
  if (!learnerId) {
    throw new Error('learnerId is required');
  }

  // NOTE: The API auto-generates learner embeddings if missing
  // No need to call ensurelearnerEmbedding here

  const response = await ssoClient.fetch(`${API_URL}/recommend-opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      learnerId,
      limit: topN,
      forceRefresh,
    }),
  });

  if (!response.ok) {
    const errorData: MatchingResponse = await response.json().catch(() => ({}));
    const detail = errorData.error;
    const message = typeof detail === 'string' ? detail : detail?.message;
    throw Object.assign(
      new Error(message || `Job matching unavailable (${response.status})`),
      {
        code:
          (typeof detail === 'object' ? detail?.code : undefined) ||
          errorData.code,
        status: response.status,
      },
    );
  }

  const result: MatchingResponse = await response.json();
  const data = result?.data;
  if (
    !result ||
    result.success === false ||
    !data ||
    !Array.isArray(data.recommendations)
  )
    throw new Error('Invalid recommendation response');
  if (data.fallback === true || data.provenance !== 'embedding') {
    throw new Error(
      'Personalized AI recommendations are unavailable. Please retry.',
    );
  }
  const recommendations = data.recommendations;

  if (recommendations.length === 0) {
    // Return empty array instead of throwing - no matches is valid
    return [];
  }

  // Transform matches - opportunity data comes from API response
  const provenance = 'embedding';
  return recommendations.map((rec) => {
    const overall =
      typeof rec.match_percentage === 'number' &&
      Number.isFinite(rec.match_percentage)
        ? rec.match_percentage
        : null;
    const similarity =
      typeof rec.similarity === 'number' && Number.isFinite(rec.similarity)
        ? Math.round(rec.similarity * 100)
        : null;
    const score = overall ?? similarity;
    return {
      job_id: rec.id,
      job_title: rec.job_title || rec.title,
      company_name: rec.company_name || rec.company,
      match_score: score,
      similarity_score: similarity,
      score_label:
        score === null
          ? null
          : overall !== null
            ? 'Match index'
            : 'Profile similarity',
      match_reason:
        score === null
          ? 'Review this opportunity.'
          : 'Ranked against your profile; this is not a hiring probability.',
      provenance,
      reason: data.reason,
      freshness: data.freshness || 'unknown',
      key_matching_skills: (rec.learning_eligibility?.criteria || [])
        .filter((c) => c.status === 'eligible')
        .map((c) => `${c.capabilityName} · Level ${c.levelNumber}`),
      skills_gap: (rec.learning_eligibility?.criteria || [])
        .filter((c) => c.mandatory && c.status !== 'eligible')
        .map((c) => `${c.capabilityName} · Level ${c.levelNumber}`),
      recommendation: 'Review the job requirements and apply if interested.',
      opportunity: rec, // Full opportunity data from API
      cached: data.cached || false,
      computed_at: data.computed_at,
    };
  });
}

/**
 * Force refresh job matches - bypasses cache and recomputes
 * Use this when you know the learner data has changed but triggers haven't fired yet
 */
export async function refreshJobMatches(
  learnerProfile: LearnerMatchingProfile,
  topN = 3,
) {
  return matchJobsWithAI(learnerProfile, topN, true);
}

export default { matchJobsWithAI, refreshJobMatches };

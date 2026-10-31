import { ssoClient } from '@/shared/api/ssoClient';

import { parseRecommendationResponse, recommendationRetryAt } from '@/shared/api/recommendationResponse';
import { getApiUrl } from '@/shared/api/apiUtils';
import { recommendationPending, type RecommendationEnvelope } from '../../../../shared/contracts/job-recommendations';

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
  recommendation_reasons?: Array<{ source: string; label: string }>;
}
interface MatchingResponse {
  success?: boolean;
  data?: {
    schemaVersion?: number;
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
async function requestJobRecommendations(
  learnerProfile: LearnerMatchingProfile,
  topN = 3,
  forceRefresh = false,
  requireEnvelope = false,
  signal?: AbortSignal,
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
    signal,
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
        retryAt: recommendationRetryAt(response.headers),
      },
    );
  }

  const result: MatchingResponse = await response.json();
  const data = result?.data;
  // Versioned consumers keep metadata even when there are no cards. Legacy
  // array callers remain supported only when no version was advertised.
  const envelope = data?.schemaVersion === undefined && response.status !== 202
    ? null
    : parseRecommendationResponse(response, data);
  if (requireEnvelope && !envelope) throw new Error('A versioned recommendation response is required');
  if (
    !result ||
    result.success === false ||
    !data ||
    !Array.isArray(data.recommendations)
  )
    throw new Error('Invalid recommendation response');
  if (envelope?.state === 'needs_profile' || envelope?.state === 'limited_context' || recommendationPending(envelope)) {
    return { matches: [], envelope };
  }
  if (data.fallback === true || data.provenance !== 'embedding') {
    throw new Error('Personalized AI recommendations are unavailable. Please retry.');
  }
  const recommendations = data.recommendations;

  // Transform matches - opportunity data comes from API response
  const provenance = 'embedding';
  const matches = recommendations.map((rec) => {
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
      match_reason: Array.isArray(rec.recommendation_reasons) && rec.recommendation_reasons.length
        ? rec.recommendation_reasons.slice(0, 3).filter(reason => typeof reason?.label === 'string').map(reason => reason.label).join(' · ')
        : score === null ? 'Review this opportunity.' : 'Ranked against your profile; this is not a hiring probability.',
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
  return { matches, envelope };
}

/** Versioned response for feature consumers; profile guidance is a success. */
export async function getJobRecommendations(
  learnerProfile: LearnerMatchingProfile,
  topN = 3,
  forceRefresh = false,
  signal?: AbortSignal,
) {
  const result = await requestJobRecommendations(learnerProfile, topN, forceRefresh, true, signal);
  return { matches: result.matches, envelope: result.envelope as RecommendationEnvelope };
}

/** Compatibility adapter for callers that still expect an array. */
export async function matchJobsWithAI(
  learnerProfile: LearnerMatchingProfile,
  topN = 3,
  forceRefresh = false,
) {
  const { matches, envelope } = await requestJobRecommendations(learnerProfile, topN, forceRefresh);
  if (envelope?.state === 'needs_profile' || envelope?.state === 'limited_context') {
    throw Object.assign(new Error('Add career context to get personalized job recommendations.'), {
      code: 'PROFILE_CONTEXT_REQUIRED', status: 200, readiness: envelope.readiness,
    });
  }
  if (recommendationPending(envelope)) throw Object.assign(new Error('Job recommendations are being prepared. Please try again shortly.'), {code:'MATCHING_PROCESSING',status:202});
  return matches;
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

export default { getJobRecommendations, matchJobsWithAI, refreshJobMatches };

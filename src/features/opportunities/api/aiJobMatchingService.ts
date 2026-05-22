import { ssoClient } from '@/shared/api/ssoClient';
/**
 * AI Job Matching Service
 * Uses vector embeddings and cosine similarity to match learner profiles with job opportunities
 * Implements industrial-grade caching - AI only processes when learner data changes
 */

import { supabase } from '@/shared/api/supabaseClient';
import { getApiUrl } from '@/shared/api/apiUtils';

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
export async function matchJobsWithAI(learnerProfile, topN = 3, forceRefresh = false) {
  if (!learnerProfile) {
    throw new Error('Learner profile is required');
  }

  const API_URL = getApiUrl('career');

  // Get auth token from existing supabase client
  const user = useAuthStore.getState().user;
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
      ...(token && { })
    },
    body: JSON.stringify({
      learnerId,
      limit: topN,
      forceRefresh
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json();
  const recommendations = result.recommendations || [];

  if (recommendations.length === 0) {
    // Return empty array instead of throwing - no matches is valid
    return [];
  }
  
  // Transform matches - opportunity data comes from API response
  return recommendations.map(rec => ({
    job_id: rec.id,
    job_title: rec.job_title || rec.title,
    company_name: rec.company_name || rec.company,
    match_score: Math.round((rec.similarity || 0.5) * 100),
    match_reason: `This opportunity matches your profile with ${Math.round((rec.similarity || 0.5) * 100)}% similarity.`,
    key_matching_skills: [],
    skills_gap: [],
    recommendation: 'Review the job requirements and apply if interested.',
    opportunity: rec, // Full opportunity data from API
    cached: result.cached || false,
    computed_at: result.computed_at
  }));
}

/**
 * Force refresh job matches - bypasses cache and recomputes
 * Use this when you know the learner data has changed but triggers haven't fired yet
 */
export async function refreshJobMatches(learnerProfile, topN = 3) {
  return matchJobsWithAI(learnerProfile, topN, true);
}

export default { matchJobsWithAI, refreshJobMatches };

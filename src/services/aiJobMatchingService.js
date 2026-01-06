/**
 * AI Job Matching Service
 * Uses vector embeddings and cosine similarity to match student profiles with job opportunities
 * Implements industrial-grade caching - AI only processes when student data changes
 */

import { supabase } from '../lib/supabaseClient';
import { ensureStudentEmbedding } from './embeddingService';

/**
 * Match student profile with opportunities using AI
 * Results are cached in the database and only recomputed when:
 * - Student profile data changes (skills, interests, etc.)
 * - Course enrollments change
 * - Training records change
 * - Opportunities catalog changes
 * - Cache expires (24 hours)
 * - Force refresh is requested
 * 
 * @param {Object} studentProfile - Student profile data
 * @param {Array} opportunities - Array of job opportunities from database
 * @param {number} topN - Number of top matches to return (default: 3)
 * @param {boolean} forceRefresh - Force recomputation even if cache is valid
 * @returns {Promise<Array>} Top N matched jobs with scores and reasons
 */
export async function matchJobsWithAI(studentProfile, opportunities, topN = 3, forceRefresh = false) {
  if (!studentProfile) {
    throw new Error('Student profile is required');
  }

  if (!opportunities || opportunities.length === 0) {
    throw new Error('No opportunities available');
  }

  const API_URL = import.meta.env.VITE_CAREER_API_URL;
  if (!API_URL) {
    throw new Error('VITE_CAREER_API_URL is not configured');
  }

  // Get auth token from existing supabase client
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const studentId = studentProfile?.id || studentProfile?.student_id;
  if (!studentId) {
    throw new Error('studentId is required');
  }

  // Ensure student has an embedding
  await ensureStudentEmbedding(studentId);

  const response = await fetch(`${API_URL}/recommend-opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({
      studentId,
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
  
  // Log cache status for debugging
  if (result.cached) {
    console.log(`[AI Job Matching] Cache HIT - ${recommendations.length} matches from cache (computed at ${result.computed_at})`);
  } else {
    console.log(`[AI Job Matching] Cache MISS - ${recommendations.length} fresh matches computed`);
  }
  
  if (recommendations.length === 0) {
    throw new Error('No recommendations available');
  }
  
  // Transform and enrich matches
  return recommendations.map(rec => {
    const localOpportunity = opportunities.find(opp => opp.id === rec.id);
    const opportunity = localOpportunity || rec;
    
    return {
      job_id: rec.id,
      job_title: rec.job_title || rec.title,
      company_name: rec.company_name || rec.company,
      match_score: Math.round((rec.similarity || 0.5) * 100),
      match_reason: `This opportunity matches your profile with ${Math.round((rec.similarity || 0.5) * 100)}% similarity.`,
      key_matching_skills: [],
      skills_gap: [],
      recommendation: 'Review the job requirements and apply if interested.',
      opportunity,
      cached: result.cached || false,
      computed_at: result.computed_at
    };
  }).filter(match => match.opportunity);
}

/**
 * Force refresh job matches - bypasses cache and recomputes
 * Use this when you know the student data has changed but triggers haven't fired yet
 */
export async function refreshJobMatches(studentProfile, opportunities, topN = 3) {
  return matchJobsWithAI(studentProfile, opportunities, topN, true);
}

export default { matchJobsWithAI, refreshJobMatches };

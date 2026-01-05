/**
 * AI Job Matching Service
 * Uses vector embeddings and cosine similarity to match student profiles with job opportunities
 */

import { ensureStudentEmbedding } from './embeddingService';

/**
 * Match student profile with opportunities using AI
 * @param {Object} studentProfile - Student profile data
 * @param {Array} opportunities - Array of job opportunities from database
 * @param {number} topN - Number of top matches to return (default: 3)
 * @returns {Promise<Array>} Top N matched jobs with scores and reasons
 */
export async function matchJobsWithAI(studentProfile, opportunities, topN = 3) {
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

  // Get auth token
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

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
      forceRefresh: false
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json();
  const recommendations = result.recommendations || [];
  
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
      opportunity
    };
  }).filter(match => match.opportunity);
}

export default { matchJobsWithAI };

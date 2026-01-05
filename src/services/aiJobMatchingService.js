/**
 * AI Job Matching Service
 * Uses vector embeddings and cosine similarity to match student profiles with job opportunities
 */

import { ensureStudentEmbedding } from './embeddingService';

/**
 * Match student profile with opportunities using AI
 * @param {Object} studentProfile - Student profile data with skills, education, training, experience
 * @param {Array} opportunities - Array of job opportunities from database
 * @param {number} topN - Number of top matches to return (default: 3)
 * @returns {Promise<Array>} Top N matched jobs with scores and reasons
 */
export async function matchJobsWithAI(studentProfile, opportunities, topN = 3) {
  // Get student identifier for logging
  const studentId = studentProfile?.id || studentProfile?.email || studentProfile?.profile?.email || 'unknown';
  const studentEmail = studentProfile?.email || studentProfile?.profile?.email || 'unknown@email.com';

  console.log('🎯 AI Job Matching - Input:', { 
    studentId, 
    studentEmail, 
    hasProfile: !!studentProfile,
    opportunitiesCount: opportunities?.length || 0 
  });

  // Validate inputs
  if (!studentProfile) {
    throw new Error('Student profile is required');
  }

  if (!opportunities || opportunities.length === 0) {
    throw new Error('No opportunities available');
  }

  // Call backend API for job matching
  const API_URL = import.meta.env.VITE_CAREER_API_URL;

  if (!API_URL) {
    throw new Error('VITE_CAREER_API_URL is not configured');
  }

  // Get auth token
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.warn('⚠️ No auth token found for job matching');
  }

  // Extract studentId from profile - the backend expects just the ID
  const studentIdForApi = studentProfile?.id || studentProfile?.student_id;
  
  if (!studentIdForApi) {
    throw new Error('studentId is required');
  }

  // Ensure student has an embedding before calling the API
  console.log('🔄 Ensuring student embedding exists...');
  const embeddingResult = await ensureStudentEmbedding(studentIdForApi);
  if (!embeddingResult.success && !embeddingResult.existed) {
    console.warn('⚠️ Could not ensure student embedding:', embeddingResult.error);
  }

  const response = await fetch(`${API_URL}/recommend-opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      studentId: studentIdForApi,
      limit: topN,
      forceRefresh: false
    })
  });

  console.log('🌐 API Request:', {
    url: `${API_URL}/recommend-opportunities`,
    studentId: studentIdForApi,
    limit: topN,
    responseStatus: response.status
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error: ${response.status}`);
  }

  const result = await response.json();
  console.log('🎯 AI Matching API Response:', JSON.stringify(result, null, 2));
  console.log('🎯 Recommendations count:', result.recommendations?.length);
  console.log('🎯 First 3 recommendations:', result.recommendations?.slice(0, 3).map(r => ({
    id: r.id,
    title: r.job_title || r.title,
    similarity: r.similarity
  })));

  // Backend returns { recommendations: [...], count, fallback, reason, ... }
  const recommendations = result.recommendations || [];
  
  if (recommendations.length === 0) {
    console.warn('⚠️ No recommendations returned from API', { fallback: result.fallback, reason: result.reason });
    throw new Error('No recommendations available');
  }
  
  // Transform backend response to match expected format
  const matches = recommendations.map(rec => ({
    job_id: rec.id,
    job_title: rec.job_title || rec.title,
    company_name: rec.company_name || rec.company,
    match_score: Math.round((rec.similarity || 0.5) * 100),
    match_reason: rec.match_reason || `This opportunity matches your profile with ${Math.round((rec.similarity || 0.5) * 100)}% similarity.`,
    key_matching_skills: rec.matching_skills || [],
    skills_gap: rec.skills_gap || [],
    recommendation: rec.recommendation || 'Review the job requirements and apply if interested.'
  }));

  console.log('🎯 Transformed matches:', matches);

  // Enrich matches with full opportunity data
  const enrichedMatches = matches.map(match => {
    const localOpportunity = opportunities.find(opp => opp.id === match.job_id);
    const backendOpportunity = recommendations.find(rec => rec.id === match.job_id);
    
    const opportunity = localOpportunity || backendOpportunity || { 
      id: match.job_id, 
      job_title: match.job_title, 
      company_name: match.company_name 
    };
    
    return {
      ...match,
      opportunity
    };
  }).filter(match => match.opportunity);

  console.log('🎯 Enriched matches:', enrichedMatches);

  if (enrichedMatches.length === 0) {
    throw new Error('No matches could be enriched with opportunity data');
  }

  return enrichedMatches;
}

export default {
  matchJobsWithAI
};

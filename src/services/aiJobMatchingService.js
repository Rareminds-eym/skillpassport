/**
 * AI Job Matching Service
 * Uses the new SMART matching system with multi-factor scoring:
 * - Semantic similarity (40%)
 * - Skills matching (30%)
 * - Certificates matching (15%)
 * - Projects matching (15%)
 * - Experience bonus
 * 
 * Filters opportunities based on student type (school vs university)
 * and grade/semester level for age-appropriate recommendations.
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Match student profile with opportunities using Smart AI Matching
 * 
 * The new system considers:
 * - Student type (school-student, university-student, college-student)
 * - Grade level (for school students)
 * - Semester (for university students)
 * - Skills, certificates, projects, and experience
 * - Age-appropriate filtering (school students only see internships/entry-level)
 * 
 * Results are cached and only recomputed when:
 * - Student profile data changes
 * - Force refresh is requested
 * 
 * @param {Object} studentProfile - Student profile data
 * @param {number} topN - Number of top matches to return (default: 3)
 * @param {boolean} forceRefresh - Force recomputation even if cache is valid
 * @returns {Promise<Array>} Top N matched jobs with detailed scores and reasons
 */
export async function matchJobsWithAI(studentProfile, topN = 3, forceRefresh = false) {
  if (!studentProfile) {
    throw new Error('Student profile is required');
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

  // NOTE: The API auto-generates student embeddings if missing
  // No need to call ensureStudentEmbedding here

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
    // Return empty array instead of throwing - no matches is valid
    return [];
  }
  
  // Transform matches - opportunity data comes from API response with smart scoring
  return recommendations.map(rec => {
    // Use the new match_percentage from smart matching (0-100)
    const matchPercentage = rec.match_percentage || Math.round((rec.final_score || rec.similarity || 0.5) * 100);
    
    // Build detailed match reason from match_reasons object
    const matchReasons = rec.match_reasons || {};
    const reasons = [];
    
    if (matchReasons.profile_match) reasons.push('Strong profile alignment');
    if (matchReasons.skill_match) reasons.push('Skills match job requirements');
    if (matchReasons.certificate_match) reasons.push('Relevant certifications');
    if (matchReasons.project_match) reasons.push('Project experience aligns');
    if (matchReasons.experience_appropriate) reasons.push('Experience level fits');
    if (matchReasons.recently_posted) reasons.push('Recently posted');
    if (matchReasons.high_demand) reasons.push('High demand role');
    
    const matchReason = reasons.length > 0 
      ? reasons.join(' • ') 
      : `This opportunity matches your profile with ${matchPercentage}% similarity.`;
    
    // Extract matching skills from the scoring
    const keyMatchingSkills = [];
    if (rec.skill_match_score > 0.3 && rec.skills_required) {
      const skills = Array.isArray(rec.skills_required) ? rec.skills_required : [];
      keyMatchingSkills.push(...skills.slice(0, 3));
    }
    
    return {
      job_id: rec.id,
      job_title: rec.job_title || rec.title,
      company_name: rec.company_name || rec.company,
      match_score: matchPercentage,
      match_reason: matchReason,
      key_matching_skills: keyMatchingSkills,
      skills_gap: [],
      recommendation: matchPercentage >= 70 
        ? 'Excellent match! We highly recommend applying.' 
        : matchPercentage >= 50 
        ? 'Good match. Review the requirements and apply if interested.'
        : 'Fair match. Consider building relevant skills before applying.',
      opportunity: rec, // Full opportunity data from API
      cached: result.cached || false,
      computed_at: result.computed_at,
      // Include detailed scores for debugging/display
      scores: {
        similarity: rec.similarity_score,
        skills: rec.skill_match_score,
        certificates: rec.certificate_match_score,
        projects: rec.project_match_score,
        experience: rec.experience_match_score,
        final: rec.final_score
      }
    };
  });
}

/**
 * Force refresh job matches - bypasses cache and recomputes
 * Use this when you know the student data has changed but triggers haven't fired yet
 */
export async function refreshJobMatches(studentProfile, topN = 3) {
  return matchJobsWithAI(studentProfile, topN, true);
}

export default { matchJobsWithAI, refreshJobMatches };

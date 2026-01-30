/**
 * Smart Job Recommendations Handler
 * Uses the new match_opportunities_smart database function
 * Considers student type, grade, skills, certificates, projects, and experience
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from '../types/career-ai';
import { isValidUUID } from '../utils/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { jsonResponse } from '../utils/cors';

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.30,  // 30% minimum match
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20
};

interface StudentProfile {
  id: string;
  name: string;
  student_type: string;
  grade?: string;
  semester?: number;
  branch_field?: string;
  embedding?: number[];
}

/**
 * Generate embedding for a student if missing
 */
async function generateStudentEmbeddingInternal(
  supabase: SupabaseClient,
  studentId: string,
  env: Env
): Promise<number[] | null> {
  try {
    // Fetch student with related data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, branch_field, course_name, university, bio, interests, hobbies')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Failed to fetch student for embedding:', studentError);
      return null;
    }

    // Fetch skills
    const { data: skills } = await supabase
      .from('skills')
      .select('name, level, type')
      .eq('student_id', studentId)
      .eq('enabled', true);

    // Fetch certificates
    const { data: certificates } = await supabase
      .from('certificates')
      .select('title, organization')
      .eq('student_id', studentId)
      .eq('enabled', true);

    // Fetch projects
    const { data: projects } = await supabase
      .from('projects')
      .select('title, description, technologies')
      .eq('student_id', studentId)
      .eq('enabled', true);

    // Fetch experience
    const { data: experience } = await supabase
      .from('experience')
      .select('title, company, description')
      .eq('student_id', studentId)
      .eq('enabled', true);

    // Build embedding text
    const parts: string[] = [];

    if (student.name) parts.push(`Name: ${student.name}`);
    if (student.bio) parts.push(`Bio: ${student.bio}`);
    if (student.branch_field) parts.push(`Field: ${student.branch_field}`);
    if (student.course_name) parts.push(`Course: ${student.course_name}`);

    // Add interests and hobbies
    if (student.interests && Array.isArray(student.interests)) {
      parts.push(`Interests: ${student.interests.join(', ')}`);
    }
    if (student.hobbies && Array.isArray(student.hobbies)) {
      parts.push(`Hobbies: ${student.hobbies.join(', ')}`);
    }

    // Add skills
    if (skills && skills.length > 0) {
      const skillNames = skills.map(s => s.name).filter(Boolean);
      if (skillNames.length > 0) {
        parts.push(`Skills: ${skillNames.join(', ')}`);
      }
    }

    // Add certificates
    if (certificates && certificates.length > 0) {
      const certNames = certificates.map(c => c.title).filter(Boolean);
      if (certNames.length > 0) {
        parts.push(`Certificates: ${certNames.join(', ')}`);
      }
    }

    // Add projects
    if (projects && projects.length > 0) {
      const projectInfo = projects.map(p => {
        const tech = Array.isArray(p.technologies) ? p.technologies.join(', ') : '';
        return `${p.title}${tech ? ` (${tech})` : ''}`;
      }).filter(Boolean);
      if (projectInfo.length > 0) {
        parts.push(`Projects: ${projectInfo.join('; ')}`);
      }
    }

    // Add experience
    if (experience && experience.length > 0) {
      const expInfo = experience.map(e => `${e.title} at ${e.company}`).filter(Boolean);
      if (expInfo.length > 0) {
        parts.push(`Experience: ${expInfo.join('; ')}`);
      }
    }

    const text = parts.join('\n');
    if (text.length < 10) {
      console.log(`[AUTO-EMBED] Insufficient data for student ${studentId}`);
      return null;
    }

    // Generate embedding via OpenRouter
    const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    if (!openRouterKey) {
      console.error('[AUTO-EMBED] OpenRouter API key not configured');
      return null;
    }

    const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.rareminds.in',
        'X-Title': 'SkillPassport Smart Recommendations',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('[AUTO-EMBED] OpenRouter error:', embeddingResponse.status, errorText);
      return null;
    }

    const data = await embeddingResponse.json() as { data: Array<{ embedding: number[] }> };
    const embedding = data.data[0]?.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      console.error('[AUTO-EMBED] Invalid embedding response');
      return null;
    }

    // Save embedding to database
    const { error: updateError } = await supabase
      .from('students')
      .update({ embedding })
      .eq('id', studentId);

    if (updateError) {
      console.error('[AUTO-EMBED] Failed to save embedding:', updateError);
    }

    console.log(`[AUTO-EMBED] Generated ${embedding.length}-dim embedding for student ${studentId}`);
    return embedding;

  } catch (error) {
    console.error('[AUTO-EMBED] Error:', error);
    return null;
  }
}

/**
 * Get popular opportunities as fallback
 */
async function getPopularFallback(
  supabase: SupabaseClient,
  studentId: string,
  studentType: string,
  limit: number,
  startTime: number,
  reason: string
): Promise<Response> {
  try {
    // For school students, only show internships
    const isSchoolStudent = studentType === 'school-student';
    
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'open')
      .order('views_count', { ascending: false })
      .order('posted_date', { ascending: false })
      .limit(limit);

    // Filter for school students
    if (isSchoolStudent) {
      query = query.or('employment_type.ilike.%internship%,experience_level.ilike.%entry%,experience_level.ilike.%intern%');
    }

    const { data: popular, error } = await query;

    if (error) throw error;

    // Add default match scores for fallback
    const recommendations = (popular || []).map(opp => ({
      ...opp,
      similarity_score: 0.3,
      skill_match_score: 0.2,
      certificate_match_score: 0.0,
      project_match_score: 0.0,
      experience_match_score: 0.0,
      final_score: 0.3,
      match_percentage: 30,
      match_reasons: {
        profile_match: false,
        skill_match: false,
        certificate_match: false,
        project_match: false,
        experience_appropriate: true,
        recently_posted: true,
        high_demand: true
      }
    }));

    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations,
      fallback: true,
      reason,
      count: recommendations.length,
      executionTime
    });
  } catch (fallbackError) {
    console.error('Fallback failed:', fallbackError);
    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: [],
      fallback: true,
      reason,
      count: 0,
      executionTime
    });
  }
}

/**
 * Main handler for smart job recommendations
 */
export async function handleSmartRecommendations(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const startTime = Date.now();

  let body: { studentId?: string; forceRefresh?: boolean; limit?: number };
  try {
    body = await request.json() as { studentId?: string; forceRefresh?: boolean; limit?: number };
  } catch {
    return jsonResponse({ error: 'Invalid JSON', recommendations: [] }, 400);
  }

  const { studentId, forceRefresh = false, limit = RECOMMEND_CONFIG.DEFAULT_LIMIT } = body;
  
  // Validation
  if (!studentId) {
    return jsonResponse({ error: 'studentId is required', recommendations: [] }, 400);
  }

  if (!isValidUUID(studentId)) {
    return jsonResponse({ error: 'Invalid studentId format', recommendations: [] }, 400);
  }

  if (!checkRateLimit(studentId)) {
    return jsonResponse({ error: 'Rate limit exceeded', recommendations: [] }, 429);
  }

  const safeLimit = Math.min(Math.max(1, limit), RECOMMEND_CONFIG.MAX_RECOMMENDATIONS);
  const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // ==================== FETCH STUDENT PROFILE ====================
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, name, student_type, grade, semester, branch_field, embedding')
    .eq('id', studentId)
    .maybeSingle();

  console.log('Student profile:', { 
    student: student ? { 
      id: student.id, 
      name: student.name, 
      type: student.student_type,
      grade: student.grade,
      semester: student.semester,
      hasEmbedding: !!student.embedding 
    } : null, 
    error: studentError 
  });

  if (studentError || !student) {
    console.error('Student not found:', { studentId, error: studentError });
    return await getPopularFallback(supabase, studentId, 'unknown', safeLimit, startTime, 'no_profile');
  }

  // Auto-generate embedding if missing
  let studentEmbedding = student.embedding;
  if (!studentEmbedding) {
    console.log(`[AUTO-EMBED] Student ${studentId} has no embedding - generating...`);
    try {
      studentEmbedding = await generateStudentEmbeddingInternal(supabase, studentId, env);
      if (!studentEmbedding) {
        console.log(`[AUTO-EMBED] Failed to generate embedding for student ${studentId}`);
        return await getPopularFallback(supabase, studentId, student.student_type, safeLimit, startTime, 'embedding_generation_failed');
      }
      console.log(`[AUTO-EMBED] Successfully generated embedding for student ${studentId}`);
    } catch (embedError) {
      console.error('[AUTO-EMBED ERROR]', embedError);
      return await getPopularFallback(supabase, studentId, student.student_type, safeLimit, startTime, 'embedding_generation_error');
    }
  }

  // Get dismissed opportunities
  const { data: dismissed } = await supabase
    .from('opportunity_interactions')
    .select('opportunity_id')
    .eq('student_id', studentId)
    .eq('action', 'dismiss');

  const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

  // ==================== RUN SMART MATCHING ====================
  console.log(`[SMART MATCH] Running for ${student.student_type} student, Grade: ${student.grade}, Semester: ${student.semester}`);
  
  const { data: recommendations, error: matchError } = await supabase.rpc('match_opportunities_smart', {
    p_student_id: studentId,
    p_query_embedding: studentEmbedding,
    p_student_type: student.student_type,
    p_grade: student.grade,
    p_semester: student.semester,
    p_dismissed_ids: dismissedIds,
    p_match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
    p_match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
  });

  if (matchError) {
    console.error('Match error:', matchError);
    return await getPopularFallback(supabase, studentId, student.student_type, safeLimit, startTime, 'match_error');
  }

  if (!recommendations || recommendations.length === 0) {
    console.log('[SMART MATCH] No matches found, using fallback');
    return await getPopularFallback(supabase, studentId, student.student_type, safeLimit, startTime, 'no_matches');
  }

  const topRecommendations = recommendations.slice(0, safeLimit);
  const executionTime = Date.now() - startTime;

  console.log(`[SMART MATCH] Found ${recommendations.length} matches, returning top ${topRecommendations.length}`);
  console.log(`[SMART MATCH] Top match: ${topRecommendations[0]?.title} (${topRecommendations[0]?.match_percentage}%)`);

  return jsonResponse({
    recommendations: topRecommendations,
    cached: false,
    computed_at: new Date().toISOString(),
    count: topRecommendations.length,
    totalMatches: recommendations.length,
    executionTime,
    studentType: student.student_type,
    grade: student.grade
  });
}

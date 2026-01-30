/**
 * Recommend Opportunities Handler - AI-powered job matching
 * 
 * Features:
 * - Embedding-based similarity matching with V2/V1 fallback
 * - Auto-generation of student embeddings if missing
 * - Entity-level embeddings for certificates, projects, skills
 * - Caching via database RPCs
 * - Dismissal filtering
 * - Fallback to popular opportunities
 */

import { jsonResponse } from '../../../../src/functions-lib/response';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isValidUUID } from '../utils/auth';
import { checkRateLimit } from '../utils/rate-limit';
import { getOpenRouterKey } from '../[[path]]';

const RECOMMEND_CONFIG = {
  MATCH_THRESHOLD: 0.01,
  MAX_RECOMMENDATIONS: 50,
  DEFAULT_LIMIT: 20
};

// ==================== EMBEDDING GENERATION ====================

/**
 * Generate embedding via OpenRouter API
 */
async function generateEmbeddingFromText(
  text: string,
  env: Record<string, string>
): Promise<number[] | null> {
  const openRouterKey = getOpenRouterKey(env);
  if (!openRouterKey) {
    console.error('[EMBED] OpenRouter API key not configured');
    return null;
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.rareminds.in',
        'X-Title': 'SkillPassport Embedding',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-3-small',
        input: text.slice(0, 8000),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EMBED] OpenRouter error:', response.status, errorText);
      return null;
    }

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    return data.data[0]?.embedding || null;
  } catch (error) {
    console.error('[EMBED] Error:', error);
    return null;
  }
}

/**
 * Generate embedding for a student internally
 * Builds enriched profile text with certificates, projects, and skills context
 */
async function generateStudentEmbeddingInternal(
  supabase: SupabaseClient,
  studentId: string,
  env: Record<string, string>
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

    // Fetch skills with proficiency levels
    const { data: skills } = await supabase
      .from('skills')
      .select('name, level, type, description')
      .eq('student_id', studentId)
      .eq('enabled', true)
      .order('level', { ascending: false })
      .limit(15);

    // Fetch certificates with full context
    const { data: certificates } = await supabase
      .from('certificates')
      .select('title, issuer, level, category, description, platform')
      .eq('student_id', studentId)
      .eq('enabled', true)
      .limit(10);

    // Fetch projects with tech stacks
    const { data: projects } = await supabase
      .from('projects')
      .select('title, description, tech_stack, role, organization')
      .eq('student_id', studentId)
      .eq('enabled', true)
      .limit(5);

    // Fetch course enrollments
    const { data: courseEnrollments } = await supabase
      .from('course_enrollments')
      .select('course_title, status, skills_acquired')
      .eq('student_id', studentId)
      .in('status', ['completed', 'in_progress', 'active']);

    // Fetch trainings
    const { data: trainings } = await supabase
      .from('trainings')
      .select('title, organization, description, source')
      .eq('student_id', studentId)
      .limit(5);

    // ========== Build ENRICHED Embedding Text ==========
    const parts: string[] = [];

    // Section 1: Core Profile
    parts.push('=== STUDENT PROFILE ===');
    if (student.name) parts.push(`Name: ${student.name}`);
    if (student.branch_field) parts.push(`Field of Study: ${student.branch_field}`);
    if (student.course_name) parts.push(`Course: ${student.course_name}`);
    if (student.university) parts.push(`University: ${student.university}`);
    if (student.bio) parts.push(`Bio: ${student.bio}`);

    // Add interests and hobbies
    if (student.interests && Array.isArray(student.interests)) {
      parts.push(`Interests: ${student.interests.join(', ')}`);
    }
    if (student.hobbies && Array.isArray(student.hobbies)) {
      parts.push(`Hobbies: ${student.hobbies.join(', ')}`);
    }

    // Section 2: Skills with Proficiency
    if (skills && skills.length > 0) {
      parts.push('\n=== TECHNICAL SKILLS ===');
      const skillStrings = skills.map(s => {
        let skillStr = s.name;
        if (s.level) skillStr += ` (Level ${s.level}/5)`;
        if (s.type) skillStr += ` [${s.type}]`;
        return skillStr;
      });
      parts.push(skillStrings.join(', '));
    }

    // Section 3: Certificates
    if (certificates && certificates.length > 0) {
      parts.push('\n=== CERTIFICATIONS ===');
      for (const cert of certificates) {
        let certStr = cert.title;
        if (cert.issuer) certStr += ` from ${cert.issuer}`;
        if (cert.platform) certStr += ` on ${cert.platform}`;
        if (cert.level) certStr += ` (${cert.level})`;
        if (cert.category) certStr += ` - Category: ${cert.category}`;
        if (cert.description) certStr += `. ${cert.description}`;
        parts.push(`• ${certStr}`);
      }
    }

    // Section 4: Projects
    if (projects && projects.length > 0) {
      parts.push('\n=== PROJECTS ===');
      for (const proj of projects) {
        let projStr = proj.title;
        if (proj.role) projStr += ` (${proj.role})`;
        if (proj.organization) projStr += ` at ${proj.organization}`;
        if (proj.tech_stack && proj.tech_stack.length > 0) {
          projStr += ` | Technologies: ${proj.tech_stack.join(', ')}`;
        }
        if (proj.description) projStr += `. ${proj.description.slice(0, 200)}`;
        parts.push(`• ${projStr}`);
      }
    }

    // Section 5: Trainings
    if (trainings && trainings.length > 0) {
      parts.push('\n=== TRAINING PROGRAMS ===');
      for (const training of trainings) {
        let trainStr = training.title;
        if (training.organization) trainStr += ` by ${training.organization}`;
        if (training.source) trainStr += ` via ${training.source}`;
        if (training.description) trainStr += `. ${training.description.slice(0, 150)}`;
        parts.push(`• ${trainStr}`);
      }
    }

    // Section 6: Completed Courses
    if (courseEnrollments && courseEnrollments.length > 0) {
      const completed = courseEnrollments.filter(c => c.status === 'completed');
      if (completed.length > 0) {
        parts.push('\n=== COMPLETED COURSES ===');
        for (const course of completed.slice(0, 5)) {
          let courseStr = course.course_title;
          if (course.skills_acquired && course.skills_acquired.length > 0) {
            courseStr += ` | Skills: ${course.skills_acquired.join(', ')}`;
          }
          parts.push(`• ${courseStr}`);
        }
      }
    }

    const text = parts.join('\n');
    if (text.length < 50) {
      console.log(`[AUTO-EMBED] Insufficient data for student ${studentId}`);
      return null;
    }

    console.log(`[AUTO-EMBED] Built enriched profile text (${text.length} chars) for student ${studentId}`);

    // Generate embedding via OpenRouter
    const embedding = await generateEmbeddingFromText(text, env);

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

// ==================== FALLBACK HANDLER ====================

async function getPopularFallback(
  supabase: SupabaseClient,
  studentId: string,
  limit: number,
  startTime: number,
  reason: string
): Promise<Response> {
  try {
    const { data: popular, error } = await supabase.rpc('get_popular_opportunities', {
      student_id_param: studentId,
      limit_count: limit
    });

    if (error) throw error;

    const executionTime = Date.now() - startTime;
    return jsonResponse({
      recommendations: popular || [],
      fallback: true,
      reason,
      count: popular?.length || 0,
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

// ==================== MAIN HANDLER ====================

export async function handleRecommendOpportunities(request: Request, env: Record<string, string>): Promise<Response> {
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
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  // ==================== CACHE CHECK ====================
  if (!forceRefresh) {
    try {
      const { data: cacheResult, error: cacheError } = await supabase
        .rpc('get_cached_job_matches', { p_student_id: studentId });
      
      if (!cacheError && cacheResult && cacheResult.length > 0 && cacheResult[0].is_cached) {
        const cached = cacheResult[0];
        const executionTime = Date.now() - startTime;
        console.log(`[CACHE HIT] Student ${studentId} - ${cached.match_count} matches from cache`);
        
        const cachedMatches = (cached.matches || []).slice(0, safeLimit);
        return jsonResponse({
          recommendations: cachedMatches,
          cached: true,
          computed_at: cached.computed_at,
          count: cachedMatches.length,
          totalMatches: cached.match_count,
          executionTime,
          message: 'Recommendations retrieved from cache'
        });
      }
      console.log(`[CACHE MISS] Student ${studentId} - computing fresh matches`);
    } catch (cacheCheckError) {
      console.error('[CACHE CHECK ERROR]', cacheCheckError);
    }
  } else {
    console.log(`[FORCE REFRESH] Student ${studentId} - bypassing cache`);
  }

  // ==================== GET STUDENT PROFILE ====================
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('embedding, id, name')
    .eq('id', studentId)
    .maybeSingle();

  console.log('Student query result:', { 
    student: student ? { id: student.id, name: student.name, hasEmbedding: !!student.embedding } : null, 
    error: studentError 
  });

  if (studentError || !student) {
    console.error('Student not found:', { studentId, error: studentError });
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_profile');
  }

  // ==================== AUTO-GENERATE EMBEDDING ====================
  let studentEmbedding = student.embedding;
  if (!studentEmbedding) {
    console.log(`[AUTO-EMBED] Student ${studentId} has no embedding - generating...`);
    try {
      studentEmbedding = await generateStudentEmbeddingInternal(supabase, studentId, env);
      if (!studentEmbedding) {
        console.log(`[AUTO-EMBED] Failed to generate embedding for student ${studentId}`);
        return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'embedding_generation_failed');
      }
      console.log(`[AUTO-EMBED] Successfully generated embedding for student ${studentId}`);
    } catch (embedError) {
      console.error('[AUTO-EMBED ERROR]', embedError);
      return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'embedding_generation_error');
    }
  }

  // ==================== GET DISMISSED OPPORTUNITIES ====================
  const { data: dismissed } = await supabase
    .from('opportunity_interactions')
    .select('opportunity_id')
    .eq('student_id', studentId)
    .eq('action', 'dismiss');

  const dismissedIds = dismissed?.map(d => d.opportunity_id) || [];

  // ==================== HYBRID MATCHING (V2/V1) ====================
  let recommendations: any[] | null = null;
  let matchError: any = null;
  let algorithmVersion = 'v2.0';

  // Try V2 matching first (with entity-level scoring)
  const { data: v2Recommendations, error: v2MatchError } = await supabase.rpc('match_opportunities_enhanced_v2', {
    query_embedding: studentEmbedding,
    student_id_param: studentId,
    dismissed_ids: dismissedIds,
    match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
    match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
  });

  if (!v2MatchError && v2Recommendations && v2Recommendations.length > 0) {
    recommendations = v2Recommendations;
    console.log(`[MATCH V2] Student ${studentId} - using entity-level scoring`);
  } else {
    // Fallback to V1 matching
    console.log(`[MATCH V1 FALLBACK] V2 error or no results, trying V1 for student ${studentId}`);
    algorithmVersion = 'v1.0';
    
    const { data: v1Recommendations, error: v1MatchError } = await supabase.rpc('match_opportunities_enhanced', {
      query_embedding: studentEmbedding,
      student_id_param: studentId,
      dismissed_ids: dismissedIds,
      match_threshold: RECOMMEND_CONFIG.MATCH_THRESHOLD,
      match_count: RECOMMEND_CONFIG.MAX_RECOMMENDATIONS
    });
    
    recommendations = v1Recommendations;
    matchError = v1MatchError;
  }

  if (matchError) {
    console.error('Match error:', matchError);
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'match_error');
  }

  if (!recommendations || recommendations.length === 0) {
    return await getPopularFallback(supabase, studentId, safeLimit, startTime, 'no_matches');
  }

  // ==================== RESPONSE ENRICHMENT ====================
  const enrichedRecommendations = recommendations.map(rec => ({
    ...rec,
    match_breakdown: rec.certificate_match_score !== undefined ? {
      profile_similarity: Math.round((rec.similarity || 0) * 100),
      skill_match: Math.round((rec.skill_match_score || 0) * 100),
      certificate_relevance: Math.round((rec.certificate_match_score || 0) * 100),
      project_relevance: Math.round((rec.project_match_score || 0) * 100)
    } : undefined
  }));

  const topRecommendations = enrichedRecommendations.slice(0, safeLimit);
  const executionTime = Date.now() - startTime;

  // ==================== SAVE TO CACHE ====================
  try {
    await supabase.rpc('save_job_matches_cache', {
      p_student_id: studentId,
      p_matches: enrichedRecommendations,
      p_algorithm_version: algorithmVersion
    });
    console.log(`[CACHE SAVE] Student ${studentId} - saved ${recommendations.length} matches to cache (${algorithmVersion})`);
  } catch (cacheSaveError) {
    console.error('[CACHE SAVE ERROR]', cacheSaveError);
  }

  return jsonResponse({
    recommendations: topRecommendations,
    cached: false,
    computed_at: new Date().toISOString(),
    count: topRecommendations.length,
    totalMatches: recommendations.length,
    executionTime,
    algorithmVersion,
    entityEmbeddingsEnabled: algorithmVersion === 'v2.0'
  });
}

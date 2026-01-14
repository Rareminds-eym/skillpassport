/**
 * Unified Cache Service
 * Handles caching for both career_assessment_ai_questions and adaptive_aptitude_questions_cache
 */

import type { Env, AdaptiveQuestion, CareerQuestion, DifficultyLevel, Subtag, TestPhase } from '../types';
import { getReadClient, getWriteClient } from './supabaseService';

// =============================================================================
// CAREER ASSESSMENT CACHE (career_assessment_ai_questions)
// =============================================================================

export interface CareerCacheRecord {
  student_id: string;
  stream_id: string;
  question_type: 'aptitude' | 'knowledge';
  attempt_id?: string;
  questions: CareerQuestion[];
  generated_at: string;
  is_active: boolean;
}

/**
 * Get cached career assessment questions for a student
 */
export async function getCareerCachedQuestions(
  env: Env,
  studentId: string,
  streamId: string,
  questionType: 'aptitude' | 'knowledge'
): Promise<CareerQuestion[] | null> {
  const supabase = getReadClient(env);
  
  try {
    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('*')
      .eq('student_id', studentId)
      .eq('stream_id', streamId)
      .eq('question_type', questionType)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    
    const minCount = questionType === 'aptitude' ? 50 : 20;
    if (data.questions?.length >= minCount) {
      console.log(`✅ Returning cached ${questionType} questions for student:`, studentId);
      return data.questions;
    }
    return null;
  } catch (e: any) {
    console.warn('⚠️ Error checking career cache:', e.message);
    return null;
  }
}

/**
 * Save career assessment questions for a student
 */
export async function saveCareerQuestions(
  env: Env,
  studentId: string,
  streamId: string,
  questionType: 'aptitude' | 'knowledge',
  questions: CareerQuestion[],
  attemptId?: string
): Promise<void> {
  // Use write client for insert/upsert operations
  const supabase = getWriteClient(env);
  
  console.log(`💾 [saveCareerQuestions] Saving ${questions.length} ${questionType} questions for student:`, studentId, 'stream:', streamId);
  
  try {
    const { data, error } = await supabase.from('career_assessment_ai_questions').upsert({
      student_id: studentId,
      stream_id: streamId,
      question_type: questionType,
      attempt_id: attemptId || null,
      questions,
      generated_at: new Date().toISOString(),
      is_active: true
    }, { onConflict: 'student_id,stream_id,question_type' })
    .select('id');
    
    if (error) {
      console.error(`❌ [saveCareerQuestions] Database error:`, error.message, error.details, error.hint);
    } else {
      console.log(`✅ [saveCareerQuestions] ${questionType} questions saved for student:`, studentId, 'record:', data);
    }
  } catch (e: any) {
    console.error('❌ [saveCareerQuestions] Exception:', e.message, e.stack);
  }
}

// =============================================================================
// ADAPTIVE APTITUDE CACHE (adaptive_aptitude_questions_cache)
// =============================================================================

type GradeLevel = 'middle_school' | 'high_school';

/**
 * Get cached adaptive questions
 */
export async function getAdaptiveCachedQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  phase: TestPhase,
  difficulty?: DifficultyLevel,
  subtag?: Subtag,
  limit: number = 10,
  excludeIds: string[] = []
): Promise<AdaptiveQuestion[]> {
  const supabase = getReadClient(env);
  
  console.log(`🔍 [getAdaptiveCachedQuestions] Querying cache:`, {
    gradeLevel, phase, difficulty, subtag, limit, excludeCount: excludeIds.length
  });

  let query = supabase
    .from('adaptive_aptitude_questions_cache')
    .select('*')
    .eq('grade_level', gradeLevel)
    .eq('phase', phase)
    .eq('is_active', true);

  if (difficulty !== undefined) {
    query = query.eq('difficulty', difficulty);
  }

  if (subtag !== undefined) {
    query = query.eq('subtag', subtag);
  }

  if (excludeIds.length > 0) {
    query = query.not('question_id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
  }

  query = query.order('usage_count', { ascending: true }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('❌ [getAdaptiveCachedQuestions] Error:', error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('📭 [getAdaptiveCachedQuestions] No cached questions found');
    return [];
  }

  console.log(`✅ [getAdaptiveCachedQuestions] Found ${data.length} cached questions`);

  const questions = data.map((record: any) => ({
    id: record.question_id,
    text: record.text,
    options: record.options as AdaptiveQuestion['options'],
    correctAnswer: record.correct_answer as AdaptiveQuestion['correctAnswer'],
    difficulty: record.difficulty as DifficultyLevel,
    subtag: record.subtag as Subtag,
    gradeLevel: record.grade_level as GradeLevel,
    phase: record.phase as TestPhase,
    explanation: record.explanation || undefined,
    createdAt: record.created_at,
  }));

  // Filter out any questions in exclusion list
  const validQuestions = questions.filter((q: AdaptiveQuestion) => !excludeIds.includes(q.id));
  
  // Track usage
  if (validQuestions.length > 0) {
    trackAdaptiveQuestionUsage(env, validQuestions.map((q: AdaptiveQuestion) => q.id)).catch(err => 
      console.warn('⚠️ Failed to track question usage:', err)
    );
  }

  return validQuestions;
}

/**
 * Track usage of adaptive questions
 */
async function trackAdaptiveQuestionUsage(env: Env, questionIds: string[]): Promise<void> {
  if (questionIds.length === 0) return;

  const writeClient = getWriteClient(env);

  for (const questionId of questionIds) {
    try {
      const { data: currentData } = await writeClient
        .from('adaptive_aptitude_questions_cache')
        .select('usage_count')
        .eq('question_id', questionId)
        .single();

      if (currentData) {
        await (writeClient.from('adaptive_aptitude_questions_cache') as any)
          .update({
            usage_count: ((currentData as any).usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('question_id', questionId);
      }
    } catch (err) {
      // Silent fail for usage tracking
    }
  }
}

/**
 * Cache adaptive questions
 */
export async function cacheAdaptiveQuestions(
  env: Env,
  questions: AdaptiveQuestion[]
): Promise<void> {
  if (questions.length === 0) return;

  try {
    console.log(`💾 [cacheAdaptiveQuestions] Caching ${questions.length} questions`);
    const writeClient = getWriteClient(env);

    const records = questions.map((q) => ({
      question_id: q.id,
      text: q.text,
      options: q.options,
      correct_answer: q.correctAnswer,
      difficulty: q.difficulty,
      subtag: q.subtag,
      grade_level: q.gradeLevel,
      phase: q.phase,
      explanation: q.explanation || null,
    }));

    const { error } = await writeClient
      .from('adaptive_aptitude_questions_cache')
      .upsert(records as any, { onConflict: 'question_id' });

    if (error) {
      console.error('❌ [cacheAdaptiveQuestions] Error:', error.message);
    } else {
      console.log(`✅ [cacheAdaptiveQuestions] Successfully cached ${records.length} questions`);
    }
  } catch (err) {
    console.error('❌ [cacheAdaptiveQuestions] Unexpected error:', err);
  }
}

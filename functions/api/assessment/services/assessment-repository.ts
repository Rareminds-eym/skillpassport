/**
 * Assessment Repository Service
 * Handles all Supabase database interactions for career assessment questions
 * 
 * @module assessment/services/assessment-repository
 */

import { getServiceClient } from '../../../lib/supabase';
import type { PagesEnv } from '../../../lib/types';

type QuestionType = 'aptitude' | 'knowledge';
type GradeLevel = 'after10' | 'after12' | 'higher_secondary' | 'college' | 'middle' | 'highschool';

interface SavedQuestionsData {
  questions: unknown[];
  generated_at: string;
  grade_level?: string;
}

interface Question {
  id: number | string;
  text?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  correctAnswer?: string;
  difficulty?: string;
  skill_tag?: string;
  subtag?: string;
  [key: string]: unknown;
}

/**
 * Get saved questions for a learner (for resume functionality)
 */
export async function getSavedQuestionsForLearner(
  env: PagesEnv,
  learnerId: string,
  streamId: string,
  questionType: QuestionType
): Promise<Question[] | null> {
  if (!learnerId) {
    console.log('⚠️ getSavedQuestionsForLearner: No learnerId provided');
    return null;
  }

  console.log(`🔍 Checking for cached ${questionType} questions:`, {
    learner_id: learnerId,
    stream_id: streamId,
    question_type: questionType,
  });

  try {
    const supabase = getServiceClient(env as any);

    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('questions, generated_at, grade_level')
      .eq('learner_id', learnerId)
      .eq('stream_id', streamId)
      .eq('question_type', questionType)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.warn(`⚠️ Database query error for ${questionType} questions:`, {
        error: error.message,
        code: error.code,
        details: error.details,
      });
      return null;
    }

    // Handle missing data
    if (!data) {
      console.log(`ℹ️ No cached ${questionType} questions found for learner ${learnerId}`);
      return null;
    }

    const savedData = data as SavedQuestionsData;

    // Validate data structure
    if (!savedData.questions) {
      console.warn(`⚠️ Cached data exists but questions field is missing for ${questionType}`);
      return null;
    }

    // Handle corrupted data (not an array)
    if (!Array.isArray(savedData.questions)) {
      console.warn(
        `⚠️ Cached ${questionType} questions data is corrupted (not an array):`,
        typeof savedData.questions
      );
      return null;
    }

    // Handle empty array
    if (savedData.questions.length === 0) {
      console.warn(`⚠️ Cached ${questionType} questions array is empty`);
      return null;
    }

    // Success - log cache hit with metadata
    console.log(`✅ Cache HIT: Found ${savedData.questions.length} saved ${questionType} questions`, {
      learner_id: learnerId,
      stream_id: streamId,
      question_count: savedData.questions.length,
      generated_at: savedData.generated_at,
      grade_level: savedData.grade_level,
      cache_age_hours: savedData.generated_at
        ? Math.round((Date.now() - new Date(savedData.generated_at).getTime()) / (1000 * 60 * 60))
        : 'unknown',
    });

    return savedData.questions as Question[];
  } catch (err) {
    const error = err as Error;
    console.error(`❌ Exception while fetching saved ${questionType} questions:`, {
      error: error.message,
      stack: error.stack,
      learner_id: learnerId,
      stream_id: streamId,
    });
    return null;
  }
}

/**
 * Save aptitude questions to database
 */
export async function saveAptitudeQuestions(
  env: PagesEnv,
  learnerId: string,
  streamId: string,
  attemptId: string | null,
  questions: Question[],
  gradeLevel: GradeLevel | null = null
): Promise<boolean> {
  if (!learnerId) {
    console.log('⚠️ No learnerId provided, skipping save');
    return false;
  }

  console.log(
    `💾 [Backend] Saving ${questions.length} aptitude questions for learner:`,
    learnerId,
    'stream:',
    streamId,
    'grade:',
    gradeLevel
  );

  try {
    const supabase = getServiceClient(env as any);

    const saveData = {
      learner_id: learnerId,
      stream_id: streamId,
      question_type: 'aptitude' as QuestionType,
      attempt_id: attemptId || null,
      questions: questions,
      generated_at: new Date().toISOString(),
      grade_level: gradeLevel,
      is_active: true,
    };

    console.log('💾 Attempting database save with metadata:', {
      learner_id: learnerId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId,
      grade_level: gradeLevel,
      question_count: questions.length,
    });

    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .upsert(saveData, { onConflict: 'learner_id,stream_id,question_type' })
      .select('id');

    if (error) {
      console.error('❌ [Backend] Database save failed:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      console.log('⚠️ Continuing with in-memory questions - assessment can proceed without caching');
      return false;
    }

    console.log('✅ [Backend] Aptitude questions saved successfully:', {
      question_count: questions.length,
      record_id: data?.[0]?.id,
      grade_level: gradeLevel,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    const error = err as Error;
    console.error('❌ [Backend] Exception during save:', {
      error: error.message,
      stack: error.stack,
    });
    console.log('⚠️ Continuing with in-memory questions - assessment can proceed without caching');
    return false;
  }
}

/**
 * Save knowledge questions to database
 */
export async function saveKnowledgeQuestions(
  env: PagesEnv,
  learnerId: string,
  streamId: string,
  attemptId: string | null,
  questions: Question[],
  gradeLevel: GradeLevel | null = null
): Promise<boolean> {
  if (!learnerId) {
    console.log('⚠️ No learnerId provided, skipping knowledge save');
    return false;
  }

  console.log(
    `💾 [Backend] Saving ${questions.length} knowledge questions for learner:`,
    learnerId,
    'stream:',
    streamId,
    'grade:',
    gradeLevel
  );

  try {
    const supabase = getServiceClient(env as any);

    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .upsert(
        {
          learner_id: learnerId,
          stream_id: streamId,
          question_type: 'knowledge' as QuestionType,
          attempt_id: attemptId || null,
          questions: questions,
          generated_at: new Date().toISOString(),
          grade_level: gradeLevel,
          is_active: true,
        },
        { onConflict: 'learner_id,stream_id,question_type' }
      )
      .select('id');

    if (error) {
      console.error('❌ [Backend] Database error:', error.message, error.details, error.hint);
      return false;
    }

    console.log('✅ [Backend] Knowledge questions saved successfully:', {
      question_count: questions.length,
      record_id: data?.[0]?.id,
      grade_level: gradeLevel,
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    const error = err as Error;
    console.error('❌ [Backend] Exception:', error.message);
    return false;
  }
}

/**
 * Clear saved questions for a learner (when starting fresh assessment)
 */
export async function clearSavedQuestionsForLearner(
  env: PagesEnv,
  learnerId: string,
  streamId: string
): Promise<void> {
  try {
    const supabase = getServiceClient(env as any);

    await supabase
      .from('career_assessment_ai_questions')
      .update({ is_active: false })
      .eq('learner_id', learnerId)
      .eq('stream_id', streamId);

    console.log('✅ Cleared saved questions for learner:', learnerId);
  } catch (err) {
    const error = err as Error;
    console.warn('Error clearing saved questions:', error.message);
  }
}

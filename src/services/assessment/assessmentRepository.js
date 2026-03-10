/**
 * Assessment Repository Module
 * Handles all Supabase database interactions for career assessment questions
 */

import { supabase } from '../../lib/supabaseClient';
import { handleDatabaseError } from './assessmentErrors.js';

/**
 * Get saved questions for a student (for resume functionality)
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} questionType - Question type ('aptitude' or 'knowledge')
 * @returns {Promise<Array|null>} - Array of questions or null if not found
 */
export async function getSavedQuestionsForStudent(studentId, streamId, questionType) {
  if (!studentId) {
    console.log('⚠️ getSavedQuestionsForStudent: No studentId provided');
    return null;
  }
  
  console.log(`🔍 Checking for cached ${questionType} questions:`, {
    student_id: studentId,
    stream_id: streamId,
    question_type: questionType
  });
  
  try {
    const { data, error } = await supabase
      .from('career_assessment_ai_questions')
      .select('questions, generated_at')
      .eq('student_id', studentId)
      .eq('stream_id', streamId)
      .eq('question_type', questionType)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

    if (error) {
      console.warn(`⚠️ Database query error for ${questionType} questions:`, {
        error: error.message,
        code: error.code,
        details: error.details
      });
      return null;
    }
    
    // Handle missing data
    if (!data) {
      console.log(`ℹ️ No cached ${questionType} questions found for student ${studentId}`);
      return null;
    }
    
    // Validate data structure
    if (!data.questions) {
      console.warn(`⚠️ Cached data exists but questions field is missing for ${questionType}`);
      return null;
    }
    
    // Handle corrupted data (not an array)
    if (!Array.isArray(data.questions)) {
      console.warn(`⚠️ Cached ${questionType} questions data is corrupted (not an array):`, typeof data.questions);
      return null;
    }
    
    // Handle empty array
    if (data.questions.length === 0) {
      console.warn(`⚠️ Cached ${questionType} questions array is empty`);
      return null;
    }
    
    // Success - log cache hit with metadata
    console.log(`✅ Cache HIT: Found ${data.questions.length} saved ${questionType} questions`, {
      student_id: studentId,
      stream_id: streamId,
      question_count: data.questions.length,
      generated_at: data.generated_at,
      grade_level: data.grade_level,
      cache_age_hours: data.generated_at ? 
        Math.round((Date.now() - new Date(data.generated_at).getTime()) / (1000 * 60 * 60)) : 
        'unknown'
    });
    
    return data.questions;
  } catch (err) {
    console.error(`❌ Exception while fetching saved ${questionType} questions:`, {
      error: err.message,
      stack: err.stack,
      student_id: studentId,
      stream_id: streamId
    });
    return null;
  }
}

/**
 * Save aptitude questions to database (fallback if API doesn't save)
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} attemptId - Assessment attempt ID
 * @param {Array} questions - Array of question objects
 * @param {string} gradeLevel - Grade level (e.g., 'higher_secondary', 'after10', 'college')
 */
export async function saveAptitudeQuestions(studentId, streamId, attemptId, questions, gradeLevel = null) {
  if (!studentId) {
    console.log('⚠️ No studentId provided, skipping save');
    return;
  }
  
  console.log(`💾 [Frontend] Saving ${questions.length} aptitude questions for student:`, studentId, 'stream:', streamId, 'grade:', gradeLevel);
  
  try {
    const saveData = {
      student_id: studentId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId || null,
      questions: questions,
      generated_at: new Date().toISOString(),
      grade_level: gradeLevel,
      is_active: true
    };
    
    console.log('💾 Attempting database save with metadata:', {
      student_id: studentId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId,
      grade_level: gradeLevel,
      question_count: questions.length
    });
    
    const { data, error } = await supabase.from('career_assessment_ai_questions').upsert(
      saveData,
      { onConflict: 'student_id,stream_id,question_type' }
    ).select('id');
    
    if (error) {
      const errorInfo = handleDatabaseError(error, 'saving aptitude questions');
      console.error('❌ [Frontend] Database save failed:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.log('ℹ️', errorInfo.message);
      console.log('⚠️ Continuing with in-memory questions - assessment can proceed without caching');
      // Continue with in-memory questions - don't throw
      return false;
    } else {
      console.log('✅ [Frontend] Aptitude questions saved successfully:', {
        question_count: questions.length,
        record_id: data?.[0]?.id,
        grade_level: gradeLevel,
        timestamp: new Date().toISOString()
      });
      return true;
    }
  } catch (e) {
    const errorInfo = handleDatabaseError(e, 'saving aptitude questions');
    console.error('❌ [Frontend] Exception during save:', {
      error: e.message,
      stack: e.stack
    });
    console.log('ℹ️', errorInfo.message);
    console.log('⚠️ Continuing with in-memory questions - assessment can proceed without caching');
    // Continue with in-memory questions - don't throw
    return false;
  }
}

/**
 * Save knowledge questions to database (fallback if API doesn't save)
 * @param {string} studentId - Student ID
 * @param {string} streamId - Stream ID
 * @param {string} attemptId - Assessment attempt ID
 * @param {Array} questions - Array of question objects
 * @param {string} gradeLevel - Grade level (e.g., 'higher_secondary', 'after10', 'college')
 */
export async function saveKnowledgeQuestions(studentId, streamId, attemptId, questions, gradeLevel = null) {
  if (!studentId) {
    console.log('⚠️ No studentId provided, skipping knowledge save');
    return;
  }
  
  console.log(`💾 [Frontend] Saving ${questions.length} knowledge questions for student:`, studentId, 'stream:', streamId, 'grade:', gradeLevel);
  
  try {
    const { data, error } = await supabase.from('career_assessment_ai_questions').upsert({
      student_id: studentId,
      stream_id: streamId,
      question_type: 'knowledge',
      attempt_id: attemptId || null,
      questions: questions,
      generated_at: new Date().toISOString(),
      grade_level: gradeLevel,
      is_active: true
    }, { onConflict: 'student_id,stream_id,question_type' })
    .select('id');
    
    if (error) {
      const errorInfo = handleDatabaseError(error, 'saving knowledge questions');
      console.error('❌ [Frontend] Database error:', error.message, error.details, error.hint);
      console.log('ℹ️', errorInfo.message);
      // Continue with in-memory questions - don't throw
    } else {
      console.log('✅ [Frontend] Knowledge questions saved successfully:', {
        question_count: questions.length,
        record_id: data?.[0]?.id,
        grade_level: gradeLevel,
        timestamp: new Date().toISOString()
      });
    }
  } catch (e) {
    const errorInfo = handleDatabaseError(e, 'saving knowledge questions');
    console.error('❌ [Frontend] Exception:', e.message);
    console.log('ℹ️', errorInfo.message);
    // Continue with in-memory questions - don't throw
  }
}

/**
 * Clear saved questions for a student (when starting fresh assessment)
 */
export async function clearSavedQuestionsForStudent(studentId, streamId) {
  try {
    await supabase
      .from('career_assessment_ai_questions')
      .update({ is_active: false })
      .eq('student_id', studentId)
      .eq('stream_id', streamId);
    console.log('✅ Cleared saved questions for student:', studentId);
  } catch (err) {
    console.warn('Error clearing saved questions:', err);
  }
}

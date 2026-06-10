/**
 * Assessment Repository Module
 * Handles all database interactions for career assessment questions via Pages Functions
 */

import { apiGet, apiPost } from '@/shared/api/apiClient';
import { handleDatabaseError } from './assessmentErrors.js';

/**
 * Get saved questions for a learner (for resume functionality)
 * @param {string} learnerId - Learner ID
 * @param {string} streamId - Stream ID
 * @param {string} questionType - Question type ('aptitude' or 'knowledge')
 * @returns {Promise<Array|null>} - Array of questions or null if not found
 */
export async function getSavedQuestionsForLearner(learnerId, streamId, questionType) {
  if (!learnerId) {
    console.log('⚠️ getSavedQuestionsForLearner: No learnerId provided');
    return null;
  }
  
  console.log(`🔍 Checking for cached ${questionType} questions:`, {
    learner_id: learnerId,
    stream_id: streamId,
    question_type: questionType
  });
  
  try {
    const response = await apiGet(
      `/assessment-questions?learnerId=${encodeURIComponent(learnerId)}&streamId=${encodeURIComponent(streamId)}&questionType=${encodeURIComponent(questionType)}`
    );

    const data = response.data;

    // Handle missing data
    if (!data || !data.questions) {
      console.log(`ℹ️ No cached ${questionType} questions found for learner ${learnerId}`);
      return null;
    }
    
    // Validate data structure
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
      learner_id: learnerId,
      stream_id: streamId,
      question_count: data.questions.length,
      generated_at: data.generatedAt,
      cache_age_hours: data.generatedAt ? 
        Math.round((Date.now() - new Date(data.generatedAt).getTime()) / (1000 * 60 * 60)) : 
        'unknown'
    });
    
    return data.questions;
  } catch (err) {
    console.error(`❌ Exception while fetching saved ${questionType} questions:`, {
      error: err.message,
      stack: err.stack,
      learner_id: learnerId,
      stream_id: streamId
    });
    return null;
  }
}

/**
 * Save aptitude questions to database (fallback if API doesn't save)
 * @param {string} learnerId - Learner ID
 * @param {string} streamId - Stream ID
 * @param {string} attemptId - Assessment attempt ID
 * @param {Array} questions - Array of question objects
 * @param {string} gradeLevel - Grade level (e.g., 'higher_secondary', 'after10', 'college')
 */
export async function saveAptitudeQuestions(learnerId, streamId, attemptId, questions, gradeLevel = null) {
  if (!learnerId) {
    console.log('⚠️ No learnerId provided, skipping save');
    return;
  }
  
  console.log(`💾 [Frontend] Saving ${questions.length} aptitude questions for learner:`, learnerId, 'stream:', streamId, 'grade:', gradeLevel);
  
  try {
    console.log('💾 Attempting database save with metadata:', {
      learner_id: learnerId,
      stream_id: streamId,
      question_type: 'aptitude',
      attempt_id: attemptId,
      grade_level: gradeLevel,
      question_count: questions.length
    });
    
    await apiPost('/assessment-questions', {
      action: 'save-aptitude',
      learner_id: learnerId,
      stream_id: streamId,
      attempt_id: attemptId || null,
      questions,
      grade_level: gradeLevel,
    });
    
    console.log('✅ [Frontend] Aptitude questions saved successfully:', {
      question_count: questions.length,
      grade_level: gradeLevel,
      timestamp: new Date().toISOString()
    });
    return true;
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
 * @param {string} learnerId - Learner ID
 * @param {string} streamId - Stream ID
 * @param {string} attemptId - Assessment attempt ID
 * @param {Array} questions - Array of question objects
 * @param {string} gradeLevel - Grade level (e.g., 'higher_secondary', 'after10', 'college')
 */
export async function saveKnowledgeQuestions(learnerId, streamId, attemptId, questions, gradeLevel = null) {
  if (!learnerId) {
    console.log('⚠️ No learnerId provided, skipping knowledge save');
    return;
  }
  
  console.log(`💾 [Frontend] Saving ${questions.length} knowledge questions for learner:`, learnerId, 'stream:', streamId, 'grade:', gradeLevel);
  
  try {
    await apiPost('/assessment-questions', {
      action: 'save-knowledge',
      learner_id: learnerId,
      stream_id: streamId,
      attempt_id: attemptId || null,
      questions,
      grade_level: gradeLevel,
    });
    
    console.log('✅ [Frontend] Knowledge questions saved successfully:', {
      question_count: questions.length,
      grade_level: gradeLevel,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    const errorInfo = handleDatabaseError(e, 'saving knowledge questions');
    console.error('❌ [Frontend] Exception:', e.message);
    console.log('ℹ️', errorInfo.message);
    // Continue with in-memory questions - don't throw
  }
}

/**
 * Clear saved questions for a learner (when starting fresh assessment)
 */
export async function clearSavedQuestionsForLearner(learnerId, streamId) {
  try {
    await apiPost('/assessment-questions', {
      action: 'clear-saved',
      learner_id: learnerId,
      stream_id: streamId,
    });
    console.log('✅ Cleared saved questions for learner:', learnerId);
  } catch (err) {
    console.warn('Error clearing saved questions:', err);
  }
}
